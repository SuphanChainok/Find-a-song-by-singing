/**
 * themes.ts — รายการธีมและ helper จัดการธีมของแอป
 * ค่าสีทั้งหมดอยู่ใน globals.css ภายใต้ [data-theme='...']
 */

export type ThemeId = 'dark' | 'light';

export interface ThemeOption {
  id: ThemeId;
  label: string;
}

export const THEMES: ThemeOption[] = [
  { id: 'dark', label: 'Dark Neon' },
  { id: 'light', label: 'Light White' },
];

export const DEFAULT_THEME: ThemeId = 'dark';

export const THEME_STORAGE_KEY = 'humsearch-theme';

const VALID_THEMES: readonly ThemeId[] = THEMES.map((t) => t.id);

/** อ่านธีมที่บันทึกไว้ใน localStorage (client เท่านั้น) */
export function getStoredTheme(): ThemeId {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && VALID_THEMES.includes(stored as ThemeId)) {
      return stored as ThemeId;
    }
  } catch {
    // localStorage ใช้ไม่ได้ (เช่น privacy mode) — ใช้ค่าเริ่มต้น
  }
  return DEFAULT_THEME;
}

/** ตั้งธีม: อัปเดต data-theme บน <html> และบันทึกลง localStorage */
export function applyTheme(id: ThemeId): void {
  document.documentElement.setAttribute('data-theme', id);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    // บันทึกไม่ได้ก็ข้าม (ธีมยังใช้งานได้จนถึงจบ session)
  }
}
