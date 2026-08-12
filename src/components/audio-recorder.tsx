'use client';

import { useState, useEffect, useRef } from 'react';

interface AudioRecorderProps {
  onSearchResult: (data: any) => void;
}

export default function AudioRecorder({ onSearchResult }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const recognitionRef = useRef<any>(null);
  const latestTranscriptRef = useRef<string>('');

  // ฟังก์ชันส่งคำร้องเพลงไปค้นหาใน API
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

      const data = await res.json();
      onSearchResult(data);
    } catch (err) {
      console.error('Search error:', err);
      setErrorMessage('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setErrorMessage('เบราว์เซอร์นี้ไม่รองรับระบบเปลี่ยนเสียงเป็นข้อความ แนะนำให้ใช้ Google Chrome หรือ Safari ครับ');
        return;
      }

      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'th-TH';

      rec.onstart = () => {
        setIsRecording(true);
        setErrorMessage('');
        setTranscript('');
        latestTranscriptRef.current = '';
      };

      rec.onresult = (event: any) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
        latestTranscriptRef.current = currentText;
      };

      rec.onerror = (event: any) => {
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
        // สั่งค้นหาทันทีที่หยุดฟัง
        if (latestTranscriptRef.current && latestTranscriptRef.current.trim()) {
          handleSearch(latestTranscriptRef.current);
        }
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleRecording = () => {
    setErrorMessage('');

    if (!recognitionRef.current) {
      setErrorMessage('เบราว์เซอร์ไม่รองรับ แนะนำให้ใช้ Safari หรือ Chrome ครับ');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      latestTranscriptRef.current = '';
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Start error:', err);
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        setErrorMessage('ระบบไมค์กำลังรีเซ็ต กรุณากดปุ่มใหม่อีกครั้งครับ');
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-slate-900 rounded-xl text-white w-full max-w-md mx-auto">
      <button
        onClick={toggleRecording}
        disabled={isLoading}
        className={`w-24 h-24 rounded-full text-3xl font-bold transition-all flex items-center justify-center shadow-lg ${
          isRecording
            ? 'bg-red-600 animate-pulse scale-105'
            : 'bg-purple-600 hover:bg-purple-500 active:scale-95'
        }`}
      >
        {isLoading ? '⏳' : isRecording ? '⏹️' : '🎤'}
      </button>

      <p className="text-sm text-gray-300 text-center">
        {isRecording
          ? '🔴 กำลังฟังเสียงร้อง... (กดปุ่ม ⏹️ หรือร้องจบระบบจะค้นหาให้อัตโนมัติ)'
          : isLoading
          ? 'กำลังค้นหาเพลงในระบบ...'
          : 'กดปุ่มไมค์เพื่อเริ่มร้องเพลง'}
      </p>

      {transcript && (
        <div className="mt-1 text-center p-3 bg-slate-800 rounded-lg w-full border border-slate-700">
          <p className="text-xs text-purple-400 font-semibold">เสียงที่จับได้:</p>
          <p className="text-lg text-gray-100 mt-1 font-medium">"{transcript}"</p>
        </div>
      )}

      {errorMessage && (
        <p className="text-xs text-red-400 bg-red-950/60 p-3 rounded-lg border border-red-800 text-center w-full">
          ⚠️ {errorMessage}
        </p>
      )}

      <div className="w-full border-t border-slate-800 pt-4 mt-2">
        <p className="text-xs text-purple-300 mb-2 text-center">
          หรือพิมพ์เนื้อร้องเพื่อค้นหาโดยตรง:
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="เช่น เอาแรงเป็นทุน..."
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
              latestTranscriptRef.current = e.target.value;
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(transcript)}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={() => handleSearch(transcript)}
            disabled={isLoading || !transcript.trim()}
            className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            ค้นหา
          </button>
        </div>
      </div>
    </div>
  );
}