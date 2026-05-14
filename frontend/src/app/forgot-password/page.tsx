'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDevToken(null);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      toast.success(data.message || 'Check your email.');
      if (data.resetToken) {
        setDevToken(data.resetToken);
        toast('Dev reset token returned by API (non-production only).', { icon: 'ℹ️' });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-2xl font-bold">
              <span className="gradient-text">Mock</span>CEFR
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Forgot password</h1>
          <p className="text-gray-400 text-sm">Enter your email. We will send reset instructions when mail is configured.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-dark rounded-2xl p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-gray-700 rounded-xl px-10 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-bg hover:gradient-bg-hover text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send reset link'}
            {!loading && <ArrowRight size={18} />}
          </button>
          {devToken && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200 text-sm break-all">
              <p className="font-medium mb-1">Dev token (use on reset page)</p>
              <Link href={`/reset-password?token=${encodeURIComponent(devToken)}`} className="text-primary-300 underline">
                Open reset form with token
              </Link>
            </div>
          )}
          <p className="text-center text-gray-400 text-sm">
            <Link href="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              Back to login
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
