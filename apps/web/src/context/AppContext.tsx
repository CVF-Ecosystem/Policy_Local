'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { makeT } from '@/lib/i18n';

type Lang = 'vi' | 'en';
type Theme = 'light' | 'dark';
type Accent = 'indigo' | 'violet' | 'fuchsia' | 'cobalt' | 'teal';

interface AppCtxValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  accent: Accent;
  setAccent: (a: Accent) => void;
  gradient: boolean;
  setGradient: (g: boolean) => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  t: (key: string) => string;
}

const AppCtx = createContext<AppCtxValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('vi');
  const [theme, setThemeState] = useState<Theme>('light');
  const [accent, setAccentState] = useState<Accent>('indigo');
  const [gradient, setGradientState] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setLangState((localStorage.getItem('pl_lang') as Lang) || 'vi');
    setThemeState((localStorage.getItem('pl_theme') as Theme) || 'light');
    setAccentState((localStorage.getItem('pl_accent') as Accent) || 'indigo');
    setGradientState(localStorage.getItem('pl_grad') !== 'off');
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pl_theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent);
    localStorage.setItem('pl_accent', accent);
  }, [accent]);

  useEffect(() => {
    document.documentElement.setAttribute('data-grad', gradient ? 'on' : 'off');
    localStorage.setItem('pl_grad', gradient ? 'on' : 'off');
  }, [gradient]);

  const setLang = (l: Lang) => { setLangState(l); localStorage.setItem('pl_lang', l); };
  const setTheme = (t: Theme) => setThemeState(t);
  const setAccent = (a: Accent) => setAccentState(a);
  const setGradient = (g: boolean) => setGradientState(g);
  const t = makeT(lang);

  return (
    <AppCtx.Provider value={{ lang, setLang, theme, setTheme, accent, setAccent, gradient, setGradient, collapsed, setCollapsed, t }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
