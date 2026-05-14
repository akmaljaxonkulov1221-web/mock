import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME
    ? `${process.env.NEXT_PUBLIC_SITE_NAME} - AI Mock Exam Platform`
    : 'MockCEFR - AI Mock Exam Platform',
  description:
    'CEFR, IELTS va boshqa imtihonlarga AI yordamida tayyorlaning. Speaking, Writing, Reading, Listening - hammasi AI bilan.',
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
