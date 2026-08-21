'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { applyTheme, getStoredTheme, THEMES, type ThemeId } from '@/lib/themes';

/**
 * ปุ่มสลับธีม (Dark Neon ↔ Light White)
 * - ตั้งค่า data-theme บน <html> และบันทึกลง localStorage
 * - ธีมเริ่มต้นถูก apply ก่อนหน้านี้จาก inline script ใน layout.tsx
 */
export default function ThemeSelector() {
  const [theme, setTheme] = useState<ThemeId>('dark');

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  const toggleTheme = () => {
    const next: ThemeId = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  const nextLabel = THEMES.find((t) => t.id !== theme)?.label ?? '';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`สลับธีม — ปัจจุบัน ${theme === 'dark' ? 'Dark Neon' : 'Light White'} (กดเพื่อไป ${nextLabel})`}
      title={`สลับธีม: ${nextLabel}`}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-elevated text-muted transition-all hover:border-line-strong hover:text-fg active:scale-90"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" strokeWidth={2} />
      ) : (
        <Moon className="h-4 w-4" strokeWidth={2} />
      )}
    </button>
  );
}
