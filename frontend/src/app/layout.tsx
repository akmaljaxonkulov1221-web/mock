import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'MockCEFR - AI Mock Exam Platform',
  description: 'CEFR va IELTS imtihonlariga AI yordamida tayyorlaning. Speaking, Writing, Reading, Listening - hammasi AI bilan.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
