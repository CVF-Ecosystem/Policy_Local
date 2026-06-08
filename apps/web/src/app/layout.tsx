import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';

export const metadata: Metadata = {
  title: 'PolicyLocal — Tra cứu pháp luật local-first',
  description: 'Tra cứu văn bản pháp luật — có trích dẫn, có ranh giới, không đoán mò.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
