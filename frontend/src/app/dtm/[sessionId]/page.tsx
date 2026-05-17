'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import {
  GraduationCap, Clock, ChevronLeft, ChevronRight,
  CheckCircle2, AlertTriangle, Loader2, Flag, X
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Block {
  id: string;
  subjectName: string;
  blockOrder: number;
  questions: Question[];
  totalCount: number;
  answers?: Record<number, number>;
  correctCount?: number;
  score?: number;
}

interface Session {
  id: string;
  title: string;
  status: string;
  totalDuration: number;
  blocks: Block[];
}

// Vaqtni formatlash: HH:MM:SS
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

export default function DtmExamPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string;
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentBlockIdx, setCurrentBlockIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Record<number, number>>>({});
  const [submittedBlocks, setSubmittedBlocks] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10800); // 3 soat default
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [blockSubmitting, setBlockSubmitting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    api.get(`/dtm-tests/sessions/${sessionId}`)
      .then(({ data }) => {
        setSession(data);
        setTimeLeft(data.totalDuration || 10800);
        // Allaqachon topshirilgan bloklarni belgilash
        const done = new Set<string>();
        data.blocks.forEach((b: Block) => {
          if (b.answers && Object.keys(b.answers).length > 0) done.add(b.id);
        });
        setSubmittedBlocks(done);
      })
      .catch(() => router.push('/dtm'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  // Vaqt hisoblagichi
  useEffect(() => {
    if (!session || session.status !== 'IN_PROGRESS') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [session]);

  const currentBlock = session?.blocks[currentBlockIdx];

  const handleAnswer = (questionIdx: number, optionIdx: number) => {
    if (!currentBlock) return;
    if (submittedBlocks.has(currentBlock.id)) return;
    setAnswers(prev => ({
      ...prev,
      [currentBlock.id]: { ...(prev[currentBlock.id] || {}), [questionIdx]: optionIdx },
    }));
  };

  const handleSubmitBlock = async () => {
    if (!currentBlock) return;
    const blockAnswers = answers[currentBlock.id] || {};

    setBlockSubmitting(true);
    try {
      await api.post(`/dtm-tests/sessions/${sessionId}/blocks/${currentBlock.id}/submit`, {
        answers: blockAnswers,
      });
      setSubmittedBlocks(prev => new Set([...prev, currentBlock.id]));

      // Keyingi blokga o'tish
      if (currentBlockIdx < (session?.blocks.length ?? 0) - 1) {
        setCurrentBlockIdx(currentBlockIdx + 1);
        setCurrentQuestionIdx(0);
      } else {
        // Oxirgi blok — yakunlash modali
        setShowFinishModal(true);
      }
    } catch {
      // xatolik
    } finally {
      setBlockSubmitting(false);
    }
  };

  const handleFinish = async () => {
    setFinishing(true);
    try {
      // Topshirilmagan bloklarni ham submit qilish
      if (session) {
        for (const block of session.blocks) {
          if (!submittedBlocks.has(block.id)) {
            try {
              await api.post(`/dtm-tests/sessions/${sessionId}/blocks/${block.id}/submit`, {
                answers: answers[block.id] || {},
              });
            } catch { /* ignore */ }
          }
        }
      }
      await api.post(`/dtm-tests/sessions/${sessionId}/complete`);
      router.push(`/dtm/results/${sessionId}`);
    } catch {
      setFinishing(false);
    }
  };

  const answeredCount = currentBlock
    ? Object.keys(answers[currentBlock.id] || {}).length
    : 0;

  const totalAnswered = session?.blocks.reduce((acc, b) => {
    return acc + Object.keys(answers[b.id] || {}).length;
  }, 0) ?? 0;

  const totalQuestions = session?.blocks.reduce((acc, b) => acc + b.totalCount, 0) ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-400" size={48} />
      </div>
    );
  }

  if (!session) return null;

  if (session.status === 'COMPLETED') {
    router.push(`/dtm/results/${sessionId}`);
    return null;
  }

  const questions = currentBlock?.questions || [];
  const currentQ = questions[currentQuestionIdx];
  const timerColor = timeLeft < 300 ? 'text-red-400' : timeLeft < 900 ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top bar */}
        <div className="bg-[#1e293b] border-b border-white/10 px-6 py-3 flex items-center gap-4">
          <h1 className="text-white font-semibold flex-1 truncate">{session.title}</h1>

          {/* Vaqt */}
          <div className={`flex items-center gap-2 font-mono text-lg font-bold ${timerColor}`}>
            <Clock size={18} />
            {formatTime(timeLeft)}
          </div>

          {/* Progress */}
          <div className="text-gray-400 text-sm">
            {totalAnswered}/{totalQuestions} javoblandi
          </div>

          <button
            onClick={() => setShowFinishModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition text-sm font-medium"
          >
            <Flag size={16} /> Yakunlash
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Block navigator */}
          <div className="w-64 bg-[#1e293b] border-r border-white/10 p-4 overflow-y-auto shrink-0">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">Bloklar</p>
            {session.blocks.map((block, idx) => {
              const isActive = idx === currentBlockIdx;
              const isSubmitted = submittedBlocks.has(block.id);
              const blockAnswered = Object.keys(answers[block.id] || {}).length;

              return (
                <button
                  key={block.id}
                  onClick={() => { setCurrentBlockIdx(idx); setCurrentQuestionIdx(0); }}
                  className={`w-full text-left px-3 py-3 rounded-xl mb-2 transition ${
                    isActive
                      ? 'bg-orange-500/20 border border-orange-500/40 text-orange-400'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{idx + 1}. {block.subjectName}</span>
                    {isSubmitted && <CheckCircle2 size={14} className="text-emerald-400" />}
                  </div>
                  <div className="text-xs mt-1 opacity-70">
                    {isSubmitted ? 'Topshirildi' : `${blockAnswered}/${block.totalCount} javob`}
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isSubmitted ? 'bg-emerald-500' : 'bg-orange-500'}`}
                      style={{ width: `${isSubmitted ? 100 : (blockAnswered / block.totalCount) * 100}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Center: Question */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {currentBlock && (
              <>
                {/* Block header */}
                <div className="bg-[#0f172a] border-b border-white/10 px-6 py-3 flex items-center gap-4">
                  <div>
                    <span className="text-white font-medium">{currentBlock.subjectName}</span>
                    <span className="text-gray-500 text-sm ml-2">— {currentBlockIdx + 1}-blok</span>
                  </div>
                  <div className="text-gray-400 text-sm ml-auto">
                    {currentQuestionIdx + 1} / {questions.length}
                  </div>
                  {submittedBlocks.has(currentBlock.id) && (
                    <span className="text-emerald-400 text-xs bg-emerald-400/10 px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={12} /> Topshirildi
                    </span>
                  )}
                </div>

                {/* Question content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <AnimatePresence mode="wait">
                    {currentQ && (
                      <motion.div
                        key={currentQuestionIdx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="max-w-2xl mx-auto">
                          <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-5">
                            <p className="text-gray-400 text-sm mb-2">Savol {currentQuestionIdx + 1}</p>
                            <p className="text-white text-lg leading-relaxed">{currentQ.question}</p>
                          </div>

                          <div className="space-y-3">
                            {currentQ.options.map((opt, oIdx) => {
                              const isSelected = answers[currentBlock.id]?.[currentQuestionIdx] === oIdx;
                              const isSubmitted = submittedBlocks.has(currentBlock.id);
                              const isCorrect = oIdx === currentQ.correctAnswer;

                              let style = 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10';
                              if (isSubmitted) {
                                if (isCorrect) style = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300';
                                else if (isSelected && !isCorrect) style = 'bg-red-500/20 border-red-500/50 text-red-300';
                              } else if (isSelected) {
                                style = 'bg-orange-500/20 border-orange-500/50 text-orange-300';
                              }

                              return (
                                <button
                                  key={oIdx}
                                  onClick={() => handleAnswer(currentQuestionIdx, oIdx)}
                                  disabled={isSubmitted}
                                  className={`w-full text-left border rounded-xl px-5 py-4 transition ${style} ${!isSubmitted ? 'cursor-pointer' : 'cursor-default'}`}
                                >
                                  <span className="font-medium mr-3 text-sm">
                                    {['A', 'B', 'C', 'D', 'E'][oIdx]}.
                                  </span>
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Navigation */}
                <div className="border-t border-white/10 px-6 py-4 flex items-center gap-4">
                  <button
                    onClick={() => setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))}
                    disabled={currentQuestionIdx === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition"
                  >
                    <ChevronLeft size={18} /> Oldingi
                  </button>

                  {/* Question dots */}
                  <div className="flex-1 flex flex-wrap gap-1.5 justify-center max-h-12 overflow-y-auto">
                    {questions.map((_, qIdx) => {
                      const answered = answers[currentBlock.id]?.[qIdx] !== undefined;
                      const isActive = qIdx === currentQuestionIdx;
                      return (
                        <button
                          key={qIdx}
                          onClick={() => setCurrentQuestionIdx(qIdx)}
                          className={`w-7 h-7 rounded-md text-xs font-medium transition ${
                            isActive ? 'bg-orange-500 text-white' :
                            answered ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/30' :
                            'bg-white/5 text-gray-500 hover:bg-white/10'
                          }`}
                        >
                          {qIdx + 1}
                        </button>
                      );
                    })}
                  </div>

                  {currentQuestionIdx < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition"
                    >
                      Keyingi <ChevronRight size={18} />
                    </button>
                  ) : !submittedBlocks.has(currentBlock.id) ? (
                    <button
                      onClick={handleSubmitBlock}
                      disabled={blockSubmitting}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-700 text-white font-medium hover:opacity-90 disabled:opacity-50 transition"
                    >
                      {blockSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      Blokni topshirish
                    </button>
                  ) : (
                    <div className="text-emerald-400 text-sm flex items-center gap-2">
                      <CheckCircle2 size={16} /> Topshirildi
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Finish modal */}
      <AnimatePresence>
        {showFinishModal && (
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
              className="bg-[#1e293b] border border-white/10 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="text-center mb-6">
                <AlertTriangle size={48} className="mx-auto text-amber-400 mb-3" />
                <h2 className="text-xl font-bold text-white mb-2">Testni yakunlaysizmi?</h2>
                <p className="text-gray-400 text-sm">
                  Jami: {totalAnswered}/{totalQuestions} ta savol javoblandi.
                  {totalAnswered < totalQuestions && (
                    <span className="block text-amber-400 mt-1">
                      {totalQuestions - totalAnswered} ta savol javobsiz qoldi!
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFinishModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition"
                >
                  Qaytish
                </button>
                <button
                  onClick={handleFinish}
                  disabled={finishing}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-700 text-white font-medium hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {finishing ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />}
                  {finishing ? "Yakunlanmoqda..." : "Yakunlash"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
