'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { CreditCard } from 'lucide-react';

function PaymentRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get('examId');

  useEffect(() => {
    if (examId) {
      router.replace(`/payment/exam/${examId}`);
    } else {
      router.replace('/exams');
    }
  }, [router, examId]);

  return (
    <div className="max-w-xl glass-dark rounded-2xl p-8 text-center text-gray-300 text-sm">
      Yo‘naltirilmoqda…
    </div>
  );
}

export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <CreditCard className="text-primary-400" /> To‘lov
          </h1>
          <p className="text-gray-400 mb-8 text-sm">
            Click/Payme olib tashlangan. Imtihon uchun to‘lovni imtihon kartasidan oching yoki profilda tarixni ko‘ring.
          </p>
          <Suspense fallback={<div className="glass-dark rounded-2xl p-8 h-24 animate-pulse max-w-xl" />}>
            <PaymentRedirectInner />
          </Suspense>
          <p className="text-gray-500 text-sm mt-6 max-w-xl">
            <Link href="/exams" className="text-primary-400 hover:text-primary-300">
              Imtihonlar
            </Link>
            {' · '}
            <Link href="/dashboard/profile" className="text-primary-400 hover:text-primary-300">
              Profil va to‘lov tarixi
            </Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
