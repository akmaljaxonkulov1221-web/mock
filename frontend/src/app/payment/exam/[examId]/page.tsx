'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Upload, CheckCircle } from 'lucide-react';

export default function ExamPaymentPage() {
  const params = useParams();
  const examId = typeof params.examId === 'string' ? params.examId : params.examId?.[0] ?? '';
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [amountNote, setAmountNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!file) {
      toast.error('Chek skrinshotini tanlang');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const up = await api.post('/uploads/payment-proof', fd);
      const key = up.data.storageKey as string;
      await api.post('/manual-payments', { examId, screenshotKey: key, amountNote: amountNote || undefined });
      setDone(true);
      toast.success('So‘rov yuborildi. Admin tasdiqlashini kuting.');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white mb-2">To‘lov (qo‘lda)</h1>
          <p className="text-gray-400 text-sm mb-6">
            Bank yoki boshqa usulda to‘lov qiling, chekni yuklang. Admin tasdiqlagach, imtihon ochiladi.
          </p>

          {done ? (
            <div className="glass-dark rounded-2xl p-8 text-center">
              <CheckCircle className="text-emerald-400 mx-auto mb-4" size={48} />
              <p className="text-white mb-4">So‘rov qabul qilindi.</p>
              <Link href="/exams" className="text-primary-400 hover:text-primary-300">
                Imtihonlar ro‘yxatiga qaytish
              </Link>
            </div>
          ) : (
            <div className="glass-dark rounded-2xl p-8 space-y-5">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Chek rasmi (JPEG/PNG/WEBP)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Izoh (ixtiyoriy, masalan summa)</label>
                <input
                  value={amountNote}
                  onChange={(e) => setAmountNote(e.target.value)}
                  className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white"
                  placeholder="50000 so‘m, invoys raqami..."
                />
              </div>
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 gradient-bg py-3 rounded-xl text-white font-semibold disabled:opacity-50"
              >
                <Upload size={18} />
                {loading ? 'Yuborilmoqda…' : 'Yuborish'}
              </button>
              <Link href={`/exams/${examId}`} className="block text-center text-sm text-gray-400 hover:text-white">
                Imtihon sahifasiga qaytish
              </Link>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
