'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import {
  GraduationCap, Plus, Clock, CheckCircle2, XCircle,
  ChevronRight, BookOpen, BarChart3, Loader2, X, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DtmSession {
  id: string;
  title: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  totalScore?: number;
  maxScore?: number;
  createdAt: string;
  blocks: {
    id: string;
    subjectName: string;
    blockOrder: number;
    score?: number;
    maxScore?: number;
    correctCount?: number;
    totalCount?: number;
  }[];
}

interface Subject {
  id: string;
  name: string;
  nameUz?: string;
  icon?: string;
}

export default function DtmPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<DtmSession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // DTM test yaratish form
  const [title, setTitle] = useState('DTM Imtihoni');
  const [selectedBlocks, setSelectedBlocks] = useState([
    { subjectId: '', subjectName: '', count: 30 },
    { subjectId: '', subjectName: '', count: 30 },
  ]);

  useEffect(() => {
    Promise.all([
      api.get('/dtm-tests/sessions').then(({ data }) => setSessions(data)),
      api.get('/subjects').then(({ data }) => setSubjects(data)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addBlock = () => {
    if (selectedBlocks.length < 6) {
      setSelectedBlocks([...selectedBlocks, { subjectId: '', subjectName: '', count: 20 }]);
    }
  };

  const removeBlock = (idx: number) => {
    if (selectedBlocks.length > 2) {
      setSelectedBlocks(selectedBlocks.filter((_, i) => i !== idx));
    }
  };

  const updateBlock = (idx: number, field: string, value: string | number) => {
    const updated = [...selectedBlocks];
    if (field === 'subjectId') {
      const sub = subjects.find(s => s.id === value);
      updated[idx] = { ...updated[idx], subjectId: value as string, subjectName: sub?.nameUz || sub?.name || '' };
    } else {
      updated[idx] = { ...updated[idx], [field]: value };
    }
    setSelectedBlocks(updated);
  };

  const handleCreate = async () => {
    setError('');
    if (!title.trim()) { setError("Sarlavha kiriting"); return; }
    for (let i = 0; i < selectedBlocks.length; i++) {
      if (!selectedBlocks[i].subjectId) { setError(`${i + 1}-blok uchun fan tanlang`); return; }
      if (selectedBlocks[i].count < 1) { setError(`${i + 1}-blok uchun savollar soni 1 dan kam bo'lmasin`); return; }
    }

    setCreating(true);
    try {
      const { data } = await api.post('/dtm-tests/sessions/from-bank', {
        title,
        totalDuration: 10800,
        blocks: selectedBlocks.map(b => ({
          subjectId: b.subjectId,
          subjectName: b.subjectName,
          count: Number(b.count),
        })),
      });
      router.push(`/dtm/${data.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Test yaratishda xatolik yuz berdi");
      setCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-400';
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('uz-UZ', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  const inProgress = sessions.filter(s => s.status === 'IN_PROGRESS');
  const completed = sessions.filter(s => s.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <GraduationCap className="text-orange-400" size={32} />
                DTM Testlar
              </h1>
              <p className="text-gray-400 mt-1">O'zbekiston DTM imtihoni formatida sinov yechish</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-700 text-white font-medium hover:opacity-90 transition shadow-lg"
            >
              <Plus size={18} /> Yangi DTM Test
            </button>
          </div>

          {/* Info banner */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Majburiy fanlar', desc: '1-2 blok', score: '3.1 ball/savol', color: 'from-orange-500/20 to-orange-600/10 border-orange-500/30' },
              { label: "Qo'shimcha fanlar", desc: '3-4 blok', score: '2.1 ball/savol', color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30' },
              { label: 'Umumiy fanlar', desc: '5+ blok', score: '1.1 ball/savol', color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30' },
            ].map((item) => (
              <div key={item.label} className={`bg-gradient-to-br ${item.color} border rounded-xl p-4`}>
                <p className="text-white font-semibold">{item.label}</p>
                <p className="text-gray-400 text-sm">{item.desc}</p>
                <p className="text-white font-bold mt-2">{item.score}</p>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="animate-spin text-orange-400" size={40} />
            </div>
          ) : (
            <>
              {/* Davom etayotgan testlar */}
              {inProgress.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Clock className="text-amber-400" size={20} /> Davom etayotgan
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {inProgress.map((s, i) => (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Link href={`/dtm/${s.id}`}>
                          <div className="bg-white/5 border border-amber-500/30 rounded-xl p-5 hover:bg-white/10 transition cursor-pointer">
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="text-white font-semibold">{s.title}</h3>
                              <span className="text-amber-400 text-xs bg-amber-400/10 px-2 py-1 rounded-full flex items-center gap-1">
                                <Clock size={10} /> Davom etmoqda
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm mb-3">{formatDate(s.createdAt)}</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {s.blocks.map((b) => (
                                <span key={b.id} className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded-full">
                                  {b.subjectName}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center text-orange-400 font-medium text-sm">
                              Davom ettirish <ChevronRight size={16} />
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Yakunlangan testlar */}
              {completed.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-400" size={20} /> Yakunlangan
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {completed.map((s, i) => (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Link href={`/dtm/results/${s.id}`}>
                          <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition cursor-pointer">
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="text-white font-semibold">{s.title}</h3>
                              <span className="text-emerald-400 text-xs bg-emerald-400/10 px-2 py-1 rounded-full flex items-center gap-1">
                                <CheckCircle2 size={10} /> Yakunlandi
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm mb-3">{formatDate(s.createdAt)}</p>
                            {s.totalScore != null && (
                              <div className="bg-white/5 rounded-lg p-3 mb-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-400 text-sm">Umumiy ball</span>
                                  <span className="text-white font-bold text-lg">
                                    {s.totalScore} <span className="text-gray-400 font-normal text-sm">/ {s.maxScore}</span>
                                  </span>
                                </div>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {s.blocks.map((b) => (
                                <span key={b.id} className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded-full">
                                  {b.subjectName}: {b.correctCount ?? 0}/{b.totalCount ?? 0}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center text-blue-400 font-medium text-sm mt-3">
                              Natijalarni ko'rish <ChevronRight size={16} />
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {sessions.length === 0 && (
                <div className="text-center py-24 bg-white/5 rounded-xl border border-white/10">
                  <GraduationCap size={56} className="mx-auto text-gray-600 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Hali DTM test yo'q</h3>
                  <p className="text-gray-400 mb-6">Birinchi DTM testingizni boshlang</p>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-700 text-white font-medium hover:opacity-90 transition"
                  >
                    <Plus size={16} className="inline mr-2" />
                    Yangi DTM Test yaratish
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </main>

      {/* Yangi test yaratish modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1e293b] border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Yangi DTM Test</h2>
                <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white transition">
                  <X size={24} />
                </button>
              </div>

              {/* Sarlavha */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-300 mb-2">Test sarlavhasi</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
                  placeholder="DTM Imtihoni..."
                />
              </div>

              {/* Bloklar */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-300">Fanlar (bloklar)</label>
                  <button
                    onClick={addBlock}
                    disabled={selectedBlocks.length >= 6}
                    className="text-xs text-orange-400 hover:text-orange-300 disabled:opacity-40 flex items-center gap-1"
                  >
                    <Plus size={14} /> Blok qo'shish
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedBlocks.map((block, idx) => (
                    <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          idx < 2 ? 'bg-orange-500/20 text-orange-400' :
                          idx < 4 ? 'bg-blue-500/20 text-blue-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {idx + 1}-blok {idx < 2 ? '(majburiy, 3.1 ball)' : idx < 4 ? "(qo'shimcha, 2.1 ball)" : '(umumiy, 1.1 ball)'}
                        </span>
                        {selectedBlocks.length > 2 && (
                          <button onClick={() => removeBlock(idx)} className="ml-auto text-gray-500 hover:text-red-400">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={block.subjectId}
                          onChange={e => updateBlock(idx, 'subjectId', e.target.value)}
                          className="bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none"
                        >
                          <option value="">Fan tanlang...</option>
                          {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.icon} {s.nameUz || s.name}</option>
                          ))}
                        </select>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={block.count}
                            onChange={e => updateBlock(idx, 'count', parseInt(e.target.value) || 1)}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-orange-500 focus:outline-none"
                            placeholder="Savollar soni"
                          />
                          <span className="text-gray-500 text-xs whitespace-nowrap">ta savol</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 mb-4 text-sm">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-700 text-white font-medium hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 size={18} className="animate-spin" /> : <GraduationCap size={18} />}
                  {creating ? "Yaratilmoqda..." : "Test boshlash"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
