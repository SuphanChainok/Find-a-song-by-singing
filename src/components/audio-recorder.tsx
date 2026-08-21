'use client';

import { useState, useRef } from 'react';
import { Mic, Square, Search, LoaderCircle } from 'lucide-react';
import type { SongSearchResponse } from '@/types/music';

interface SpeechResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface SpeechErrorEvent {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface AudioRecorderProps {
  onSearchResult: (data: SongSearchResponse) => void;
}

export default function AudioRecorder({ onSearchResult }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const latestTranscriptRef = useRef<string>('');
  const onSearchResultRef = useRef(onSearchResult);

  const handleSearch = async (textToSearch: string) => {
    if (!textToSearch || !textToSearch.trim()) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/identify-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSearch }),
      });

      const data: SongSearchResponse = await res.json();
      onSearchResultRef.current(data);
    } catch (err) {
      console.error('Search error:', err);
      setErrorMessage('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  // สร้าง SpeechRecognition ครั้งแรกที่ผู้ใช้กดปุ่ม (lazy init)
  const getRecognition = (): SpeechRecognitionLike | null => {
    if (recognitionRef.current) return recognitionRef.current;
    if (typeof window === 'undefined') return null;

    const w = window as Window & {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return null;

    const rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'th-TH';

    rec.onstart = () => {
      setIsRecording(true);
      setErrorMessage('');
      setTranscript('');
      latestTranscriptRef.current = '';
    };

    rec.onresult = (event) => {
      let currentText = '';
      for (let i = 0; i < event.results.length; i++) {
        currentText += event.results[i][0].transcript;
      }
      setTranscript(currentText);
      latestTranscriptRef.current = currentText;
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setErrorMessage('เบราว์เซอร์ปฏิเสธการใช้ไมค์ กรุณากดอนุญาตสิทธิ์ไมค์ในเบราว์เซอร์');
      } else if (event.error === 'no-speech') {
        setErrorMessage('ไม่ได้ยินเสียงร้อง กรุณากดไมค์แล้วลองใหม่อีกครั้ง');
      } else {
        setErrorMessage(`ไม่สามารถรับเสียงได้ (${event.error})`);
      }
    };

    rec.onend = () => {
      setIsRecording(false);
      if (latestTranscriptRef.current && latestTranscriptRef.current.trim()) {
        handleSearch(latestTranscriptRef.current);
      }
    };

    recognitionRef.current = rec;
    return rec;
  };

  const toggleRecording = () => {
    setErrorMessage('');
    onSearchResultRef.current = onSearchResult;

    const rec = getRecognition();
    if (!rec) {
      setErrorMessage('เบราว์เซอร์นี้ไม่รองรับระบบเปลี่ยนเสียงเป็นข้อความ แนะนำให้ใช้ Google Chrome หรือ Safari ครับ');
      return;
    }

    if (isRecording) {
      rec.stop();
    } else {
      setTranscript('');
      latestTranscriptRef.current = '';
      try {
        rec.start();
      } catch (err) {
        console.error('Start error:', err);
        try {
          rec.stop();
        } catch {
          // ปล่อยว่างไว้ เพราะ stop ระหว่าง reset อาจ throw ได้
        }
        setErrorMessage('ระบบไมค์กำลังรีเซ็ต กรุณากดปุ่มใหม่อีกครั้งครับ');
      }
    }
  };

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-5">
      {/* ── ปุ่มไมค์กลาง ── */}
      <div className="relative flex items-center justify-center">
        {isRecording && (
          <>
            <span className="pulse-ring" />
            <span className="pulse-ring delayed" />
          </>
        )}
        {!isRecording && !isLoading && (
          <span className="mic-halo pointer-events-none absolute inset-0 rounded-full bg-emerald-500/25 blur-2xl" />
        )}

        <button
          onClick={toggleRecording}
          disabled={isLoading}
          aria-label={isRecording ? 'หยุดบันทึกเสียง' : 'เริ่มบันทึกเสียง'}
          className={`relative z-10 flex h-28 w-28 items-center justify-center rounded-full text-white transition-all duration-300 active:scale-95 sm:h-32 sm:w-32 ${
            isRecording
              ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-[0_0_50px_rgba(244,63,94,0.45)]'
              : 'bg-gradient-to-br from-emerald-400 to-teal-600 shadow-[0_0_45px_rgba(16,185,129,0.4)] hover:shadow-[0_0_60px_rgba(16,185,129,0.55)] hover:brightness-110'
          } ${isLoading ? 'cursor-wait opacity-80' : ''}`}
        >
          {isLoading ? (
            <LoaderCircle className="h-10 w-10 animate-spin" strokeWidth={2.2} />
          ) : isRecording ? (
            <Square className="h-9 w-9 fill-current" />
          ) : (
            <Mic className="h-11 w-11" strokeWidth={1.8} />
          )}
        </button>
      </div>

      {/* ── สถานะ + อีควอไลเซอร์ ── */}
      <div className="flex h-7 items-center gap-3">
        {isRecording ? (
          <>
            <div className="flex items-end gap-1" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className="eq-bar" style={{ animationDelay: `${i * 0.12}s` }} />
              ))}
            </div>
            <p className="text-sm font-medium text-rose-400">กำลังฟังเสียง… ร้องจบระบบค้นหาให้อัตโนมัติ</p>
          </>
        ) : isLoading ? (
          <p className="text-sm font-medium text-emerald-400">กำลังค้นหาเพลงในระบบ…</p>
        ) : (
          <p className="text-sm text-zinc-400">แตะปุ่มไมค์ แล้วฮัมทำนองหรือร้องท่อนที่จำได้</p>
        )}
      </div>

      {/* ── เสียงที่จับได้ระหว่างอัด ── */}
      {transcript && (
        <div className="glass slide-up w-full rounded-2xl px-5 py-4 text-center">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-400"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            คำที่จับได้
          </p>
          <p className="mt-1.5 text-lg font-medium text-zinc-100">&ldquo;{transcript}&rdquo;</p>
        </div>
      )}

      {/* ── ข้อผิดพลาด ── */}
      {errorMessage && (
        <p className="w-full rounded-xl border border-rose-900/60 bg-rose-950/40 px-4 py-3 text-center text-xs leading-relaxed text-rose-300">
          {errorMessage}
        </p>
      )}

      {/* ── ค้นหาด้วยการพิมพ์ ── */}
      <div className="flex w-full items-center gap-3 pt-1">
        <div className="h-px flex-1 bg-white/8" />
        <span
          className="text-[11px] uppercase tracking-[0.25em] text-zinc-600"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          หรือพิมพ์เนื้อร้อง
        </span>
        <div className="h-px flex-1 bg-white/8" />
      </div>

      <form
        className="glass flex w-full items-center gap-2 rounded-full p-1.5 pl-5 transition-colors focus-within:border-emerald-500/50"
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch(transcript);
        }}
      >
        <input
          type="text"
          placeholder="เช่น เอาแรงเป็นทุน…"
          value={transcript}
          onChange={(e) => {
            setTranscript(e.target.value);
            latestTranscriptRef.current = e.target.value;
          }}
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isLoading || !transcript.trim()}
          aria-label="ค้นหา"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-zinc-950 transition-all hover:bg-emerald-400 active:scale-90 disabled:bg-zinc-800 disabled:text-zinc-600"
        >
          {isLoading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" strokeWidth={2.5} />
          )}
        </button>
      </form>
    </div>
  );
}
