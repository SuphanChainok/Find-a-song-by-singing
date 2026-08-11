'use client';

import { useState, useEffect, useRef } from 'react';

interface AudioRecorderProps {
  onSearchResult: (data: any) => void;
}

export default function AudioRecorder({ onSearchResult }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        // ตั้งค่าให้ฟังเสียงต่อเนื่องไม่ตัดจบเอง
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'th-TH';

        rec.onresult = (event: any) => {
          let fullText = '';
          for (let i = 0; i < event.results.length; i++) {
            fullText += event.results[i][0].transcript;
          }
          setTranscript(fullText);
        };

        rec.onerror = (e: any) => {
          console.error('Speech recognition error:', e);
          setIsRecording(false);
        };

        recognitionRef.current = rec;
      }
    }
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

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('เบราว์เซอร์ไม่รองรับ แนะนำให้ใช้ Google Chrome ครับ');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      if (transcript) {
        handleSearch(transcript);
      }
    } else {
      setTranscript('');
      setIsRecording(true);
      recognitionRef.current.start();
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
          ? '🔴 กำลังอัดเสียง... (ร้องได้เรื่อยๆ แล้วกดปุ่ม⏹️ เพื่อค้นหา)'
          : isLoading
          ? 'กำลังค้นหาเพลงใน Dataset...'
          : 'กดปุ่มไมค์เพื่อเริ่มร้องเพลง'}
      </p>

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