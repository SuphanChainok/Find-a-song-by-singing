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
  const stopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestTranscriptRef = useRef<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setErrorMessage('เบราว์เซอร์ไม่รองรับการแปลงเสียง แนะนำให้ใช้ Google Chrome ครับ');
        return;
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'th-TH';

      rec.onresult = (event: any) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
        latestTranscriptRef.current = currentText; // อัปเดตข้อความล่าสุดเก็บไว้
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          setErrorMessage('กรุณากดอนุญาตการใช้งานไมโครโฟน');
        }
      };

      rec.onend = () => {
        // เมื่อเบราว์เซอร์หยุดรับเสียง ให้ตั้งดีเลย์ 5 วินาทีก่อนเปลี่ยนสถานะและค้นหา
        stopTimerRef.current = setTimeout(() => {
          setIsRecording(false);
          if (latestTranscriptRef.current) {
            handleSearch(latestTranscriptRef.current);
          }
        }, 5000); // 5000ms = 5 วินาที
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    };
  }, []);

  const handleSearch = async (textToSearch: string) => {
    if (!textToSearch.trim()) return;
    setIsLoading(true);

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
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecording = async () => {
    setErrorMessage('');

    // เคลียร์ Timer เก่า (ถ้ามี)
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }

    if (!recognitionRef.current) {
      alert('เบราว์เซอร์ไม่รองรับ แนะนำให้เปิดด้วย Google Chrome');
      return;
    }

    if (isRecording) {
      // กดหยุดเองทันที (ไม่ต้องรอดีเลย์)
      recognitionRef.current.stop();
      setIsRecording(false);
      if (transcript) {
        handleSearch(transcript);
      }
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setTranscript('');
        latestTranscriptRef.current = '';
        setIsRecording(true);
        recognitionRef.current.start();
      } catch (err) {
        console.error('Mic Access Denied:', err);
        setErrorMessage('ไม่สามารถเข้าถึงไมโครโฟนได้');
        setIsRecording(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-slate-900 rounded-xl text-white">
      <button
        onClick={toggleRecording}
        disabled={isLoading}
        className={`w-20 h-20 rounded-full text-2xl font-bold transition-all flex items-center justify-center ${
          isRecording
            ? 'bg-red-600 animate-pulse scale-105'
            : 'bg-purple-600 hover:bg-purple-500'
        }`}
      >
        {isLoading ? '⏳' : isRecording ? '⏹️' : '🎤'}
      </button>

      <p className="text-sm text-gray-300">
        {isRecording
          ? '🔴 กำลังอัดเสียง... (ร้องจบแล้วระบบจะหน่วงรอ 5 วินาทีก่อนค้นหา หรือกด⏹️ เพื่อค้นหาทันที)'
          : isLoading
          ? 'กำลังค้นหาเพลงใน Dataset...'
          : 'กดปุ่มไมค์เพื่อเริ่มร้องเพลง'}
      </p>

      {errorMessage && (
        <p className="text-xs text-red-400 bg-red-950/50 p-2 rounded-lg border border-red-800">
          ⚠️ {errorMessage}
        </p>
      )}

      {transcript && (
        <div className="mt-2 text-center p-3 bg-slate-800 rounded-lg max-w-md w-full">
          <p className="text-xs text-purple-400 font-semibold">เสียงที่จับได้:</p>
          <p className="text-lg text-gray-100 mt-1">"{transcript}"</p>
          {!isRecording && !isLoading && (
            <button
              onClick={() => handleSearch(transcript)}
              className="mt-3 px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-xs rounded-lg transition-colors font-semibold"
            >
              🔍 ค้นหาเพลงนี้อีกครั้ง
            </button>
          )}
        </div>
      )}
    </div>
  );
}