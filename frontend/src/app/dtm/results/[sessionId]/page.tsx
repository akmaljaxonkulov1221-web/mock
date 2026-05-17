'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import {
  GraduationCap, CheckCircle2, XCircle, Trophy,
  BarChart3, ArrowRight, Loader2, Star, TrendingUp,
  ChevronDown, ChevronUp
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Block {
  id: string;
  subjectName: string;
  blockOrder: number;
  correctCount: number;
  totalCount: number;
  score: number;
  maxScore: number;
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
  answers: Record<string, number>;
}

interface Session {
  id: string;
  title: string;
  status: string;
  totalScore: number;
  maxScore: number;
  completedAt: string;
  blocks: Block[];
  blockScores?: { blockOrder: number; score: number; maxScore: number }[];
}

function ScoreCircle({ score, max, size = 120 }: { score: number; max: number; size?: number }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#ffffff10" strokeWidth={10} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={10} fill="none"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold text-white">{score}</div>
        <div className="text-xs text-gray-400">/{max}</div>
      </div>
    </div>
  );
}

export default function DtmResultsPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string;
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);

  useEffect(() => {
    api.get(`/dtm-tests/sessions/${sessionId}`)
      .then(({ data }) => setSession(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-400" size={48} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-gray-400">
        Natija topilmadi
      </div>
    );
  }

  const pct = session.maxScore > 0 ? Math.round((session.totalScore / session.maxScore) * 100) : 0;
  const grade = pct >= 85 ? { label: 'A\'lo', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' } :
                pct >= 70 ? { label: 'Yaxshi', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30' } :
                pct >= 55 ? { label: "Qoniqarli", color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30' } :
                { label: "Yaxshilash kerak", color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30' };

  // Ball koeffitsientlari
  const getCoeff = (blockOrder: number) =>
    blockOrder <= 2 ? 3.1 : blockOrder <= 4 ? 2.1 : 1.1;

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Trophy className="text-orange-400" size={32} />
                DTM Natijalar
              </h1>
              <p className="text-gray-400 mt-1">{session.title}</p>
            </div>
            <Link href="/dtm">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition text-sm">
                DTM sahifasiga qaytish <ArrowRight size={16} />
              </button>
            </Link>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Overall score */}
            <div className="md:col-span-1 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-2xl p-6 flex flex-col items-center">
              <ScoreCircle score={session.totalScore} max={session.maxScore} size={130} />
              <p className="text-white font-semibold mt-4 text-lg">Umumiy ball</p>
              <span className={`mt-2 text-sm font-medium px-3 py-1 rounded-full border ${grade.bg} ${grade.color}`}>
                {grade.label}
              </span>
              <p className="text-gray-400 text-sm mt-2">{pct}% to'g'ri</p>
            </div>

            {/* Stats */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              {[
                {
                  label: 'Jami savollar',
                  value: session.blocks.reduce((a, b) => a + b.totalCount, 0),
                  icon: BarChart3, color: 'text-blue-400'
                },
                {
                  label: "To'g'ri javoblar",
                  value: session.blocks.reduce((a, b) => a + (b.correctCount ?? 0), 0),
                  icon: CheckCircle2, color: 'text-emerald-400'
                },
                {
                  label: "Noto'g'ri javoblar",
                  value: session.blocks.reduce((a, b) => a + (b.totalCount - (b.correctCount ?? 0)), 0),
                  icon: XCircle, color: 'text-red-400'
                },
                {
                  label: 'Maksimal ball',
                  value: session.maxScore,
                  icon: Star, color: 'text-amber-400'
                },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <stat.icon size={20} className={stat.color + " mb-2"} />
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Block-by-block results */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-orange-400" /> Bloklar bo'yicha natijalar
            </h2>
            <div className="space-y-3">
              {session.blocks.map((block, idx) => {
                const blockPct = block.totalCount > 0 ? Math.round((block.correctCount / block.totalCount) * 100) : 0;
                const coeff = getCoeff(block.blockOrder);
                const dtmScore = Math.round(block.correctCount * coeff * 10) / 10;
                const dtmMax = Math.round(block.totalCount * coeff * 10) / 10;
                const isExpanded = expandedBlock === block.id;

                return (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedBlock(isExpanded ? null : block.id)}
                      className="w-full px-5 py-4 flex items-center gap-4 hover:bg-white/5 transition"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        block.blockOrder <= 2 ? 'bg-orange-500/20 text-orange-400' :
                        block.blockOrder <= 4 ? 'bg-blue-500/20 text-blue-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {block.blockOrder}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white font-medium">{block.subjectName}</p>
                        <p className="text-gray-400 text-xs">{coeff} ball/savol • {dtmScore}/{dtmMax} ball</p>
                      </div>
                      <div className="text-right mr-4">
                        <p className="text-white font-bold">{block.correctCount}/{block.totalCount}</p>
                        <p className={`text-xs ${blockPct >= 75 ? 'text-emerald-400' : blockPct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                          {blockPct}%
                        </p>
                      </div>
                      {/* Progress bar */}
                      <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${blockPct >= 75 ? 'bg-emerald-500' : blockPct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${blockPct}%` }}
                        />
                      </div>
                      {isExpanded ? <ChevronUp size={16} className="text-gray-400 ml-2" /> : <ChevronDown size={16} className="text-gray-400 ml-2" />}
                    </button>

                    {/* Expanded: Savollar tahlili */}
                    {isExpanded && block.questions && (
                      <div className="px-5 pb-5 border-t border-white/10">
                        <p className="text-gray-400 text-xs font-medium mt-4 mb-3 uppercase tracking-wider">Savollar tahlili</p>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                          {block.questions.map((q, qIdx) => {
                            const userAnswer = block.answers?.[qIdx];
                            const isCorrect = userAnswer === q.correctAnswer;
                            const skipped = userAnswer === undefined || userAnswer === null;

                            return (
                              <div key={qIdx} className={`rounded-xl p-4 border ${
                                skipped ? 'bg-gray-500/10 border-gray-500/20' :
                                isCorrect ? 'bg-emerald-500/10 border-emerald-500/20' :
                                'bg-red-500/10 border-red-500/20'
                              }`}>
                                <div className="flex items-start gap-2 mb-2">
                                  <span className="text-xs font-medium text-gray-500 mt-0.5">{qIdx + 1}.</span>
                                  <p className="text-white text-sm flex-1">{q.question}</p>
                                  <span className="shrink-0">
                                    {skipped ? (
                                      <span className="text-gray-500 text-xs">O'tkazildi</span>
                                    ) : isCorrect ? (
                                      <CheckCircle2 size={16} className="text-emerald-400" />
                                    ) : (
                                      <XCircle size={16} className="text-red-400" />
                                    )}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-1 ml-4">
                                  {q.options.map((opt, oIdx) => (
                                    <div
                                      key={oIdx}
                                      className={`text-xs px-2 py-1 rounded ${
                                        oIdx === q.correctAnswer ? 'bg-emerald-500/20 text-emerald-300' :
                                        oIdx === userAnswer && !isCorrect ? 'bg-red-500/20 text-red-300' :
                                        'text-gray-500'
                                      }`}
                                    >
                                      <span className="font-medium mr-1">{['A', 'B', 'C', 'D', 'E'][oIdx]}.</span>
                                      {opt}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Link href="/dtm" className="flex-1">
              <button className="w-full px-6 py-4 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition font-medium">
                DTM sahifasiga qaytish
              </button>
            </Link>
            <Link href="/dtm" className="flex-1">
              <button className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-700 text-white font-medium hover:opacity-90 transition flex items-center justify-center gap-2">
                <GraduationCap size={18} /> Yangi DTM Test
              </button>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
