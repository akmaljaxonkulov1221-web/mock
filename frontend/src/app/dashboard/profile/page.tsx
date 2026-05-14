'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { UserCircle, Save, Receipt } from 'lucide-react';

const paymentStatusUz: Record<string, string> = {
  PENDING: 'Kutilmoqda',
  APPROVED: 'Tasdiqlangan',
  REJECTED: 'Rad etilgan',
};

export default function ProfilePage() {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [email, setEmail] = useState('');
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/auth/profile').then(({ data }) => {
        setName(data.name || '');
        setAvatar(data.avatar || '');
        setEmail(data.email || '');
      }),
      api.get('/manual-payments/mine').then(({ data }) => setPayments(data)),
    ])
      .catch(() => toast.error('Ma’lumot yuklanmadi'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/users/profile', { name, avatar: avatar || undefined });
      toast.success('Profil saqlandi');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Saqlashda xato');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <UserCircle className="text-primary-400" /> Profil
          </h1>
          <p className="text-gray-400 mb-8">Ism va avatar. Pastda imtihon uchun qo‘lda to‘lovlar tarixi.</p>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="max-w-lg glass-dark rounded-2xl p-8 space-y-5">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Display name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Avatar URL</label>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition"
                  placeholder="https://…"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 gradient-bg hover:gradient-bg-hover text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? 'Saqlanmoqda…' : 'Saqlash'}
              </button>
            </form>
          )}

          {!loading && (
            <div className="max-w-lg mt-10 glass-dark rounded-2xl p-8">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Receipt className="text-amber-400" size={22} />
                To‘lovlar tarixi
              </h2>
              {payments.length === 0 ? (
                <p className="text-gray-400 text-sm">Hali yozuv yo‘q.</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {payments.map((p) => (
                    <li key={p.id} className="border border-gray-700 rounded-xl p-3 flex flex-wrap justify-between gap-2">
                      <div>
                        <p className="text-white font-medium">{p.exam?.title}</p>
                        <p className="text-gray-500 text-xs">{new Date(p.createdAt).toLocaleString()}</p>
                        {p.amountNote && <p className="text-gray-400 text-xs mt-1">{p.amountNote}</p>}
                      </div>
                      <span
                        className={`self-start px-2 py-1 rounded-lg text-xs font-medium ${
                          p.status === 'APPROVED'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : p.status === 'REJECTED'
                              ? 'bg-red-500/15 text-red-300'
                              : 'bg-amber-500/15 text-amber-200'
                        }`}
                      >
                        {paymentStatusUz[p.status] ?? p.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
