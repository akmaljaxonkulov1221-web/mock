'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { Clock, AlertTriangle, ChevronLeft, ChevronRight, CheckCircle, Shield, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

type Access = {
  unlocked: boolean;
  messageUz: string;
  paymentInstructions?: string | null;
  priceUzs?: number | null;
};

function integrityScoreFromEvents(events: { type: string }[]) {
  const w: Record<string, number> = {
    TAB_BLUR: 14,
    FULLSCREEN_EXIT: 20,
    COPY_ATTEMPT: 28,
    WEBCAM_DENIED: 26,
    MULTI_FACE: 40,
    WEBCAM_HEARTBEAT: 0,
    WEBCAM_ON: 0,
    EXAM_START: 0,
  };
  let s = 0;
  for (const e of events) s += w[e.type] ?? 6;
  return Math.min(100, Math.round(s));
}

export default function ExamDetail() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0] ?? '';
  const router = useRouter();
  const [exam, setExam] = useState<any>(null);
  const [access, setAccess] = useState<Access | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [webcamOn, setWebcamOn] = useState(false);
  const examSurfaceRef = useRef<HTMLDivElement>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const submittedRef = useRef(false);
  const integrityEventsRef = useRef<{ type: string; ts: string; detail?: Record<string, unknown> }[]>([]);

  const pushIntegrity = useCallback((type: string, detail?: Record<string, unknown>) => {
    integrityEventsRef.current.push({ type, ts: new Date().toISOString(), detail });
  }, []);

  const reportProctor = useCallback(
    async (eventType: string, detail?: Record<string, unknown>) => {
      pushIntegrity(eventType, detail);
      if (!id) return;
      try {
        await api.post(`/exams/${id}/proctor`, { eventType, detail });
      } catch {
        /* ignore */
      }
    },
    [id, pushIntegrity],
  );

  useEffect(() => {
    if (!id) return;
    api
      .get(`/exams/${id}`)
      .then(({ data }) => {
        setExam(data.exam);
        setAccess(data.access);
        setTimeLeft((data.exam?.duration ?? 60) * 60);
      })
      .catch(() => toast.error('Imtihon topilmadi'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFinish = useCallback(async () => {
    if (submittedRef.current || !exam) return;
    submittedRef.current = true;
    setFinished(true);
    try {
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    } catch {
      /* ignore */
    }

    let score = 0;
    const total = exam?.questions?.length || 1;
    exam?.questions?.forEach((q: any) => {
      if (answers[q.id] === q.answer) score++;
    });
    const percentage = Math.round((score / total) * 100);
    const integrityScore = integrityScoreFromEvents(integrityEventsRef.current);
    const integrityReport = { events: integrityEventsRef.current };

    try {
      const { data } = await api.post(`/exams/${id}/submit`, {
        answers,
        score: percentage,
        integrityScore,
        integrityReport,
      });
      setResult(data);
      toast.success('Imtihon yuborildi!');
    } catch {
      toast.error('Yuborishda xatolik');
      submittedRef.current = false;
      setFinished(false);
    }
    webcamStreamRef.current?.getTracks().forEach((t) => t.stop());
    webcamStreamRef.current = null;
  }, [exam, answers, id]);

  useEffect(() => {
    if (!started || finished || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, finished, timeLeft, handleFinish]);

  useEffect(() => {
    if (!started || finished || result) return;
    reportProctor('EXAM_START', {});
    const t = requestAnimationFrame(() => {
      const el = examSurfaceRef.current || document.documentElement;
      el.requestFullscreen?.().catch(() => {
        toast('To‘liq ekran yoqilmadi; monitoring davom etadi.', { icon: 'ℹ️' });
      });
    });
    return () => cancelAnimationFrame(t);
  }, [started, finished, result, reportProctor]);

  useEffect(() => {
    if (!started || finished) return;

    const onVisibility = () => {
      if (document.hidden) {
        reportProctor('TAB_BLUR', { at: new Date().toISOString() });
        toast.error('Varaq almashtirildi — qayd etildi.');
      } else {
        const el = examSurfaceRef.current || document.documentElement;
        if (!document.fullscreenElement) {
          el.requestFullscreen?.().catch(() => {});
        }
      }
    };

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        reportProctor('FULLSCREEN_EXIT', { at: new Date().toISOString() });
        toast('To‘liq ekran o‘chirildi. Qayta yoqilmoqda…', { icon: '⚠️' });
        const el = examSurfaceRef.current || document.documentElement;
        setTimeout(() => el.requestFullscreen?.().catch(() => {}), 300);
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [started, finished, reportProctor]);

  useEffect(() => {
    if (!started || finished) return;
    let interval: ReturnType<typeof setInterval>;

    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        webcamStreamRef.current = stream;
        setWebcamOn(true);
        reportProctor('WEBCAM_ON', { tracks: stream.getVideoTracks().length });
        interval = setInterval(() => {
          reportProctor('WEBCAM_HEARTBEAT', { at: new Date().toISOString() });
        }, 45000);
      } catch {
        setWebcamOn(false);
        reportProctor('WEBCAM_DENIED', {});
        toast.error('Kamera ruxsati talab qilinadi.');
      }
    };

    startWebcam();
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [started, finished, reportProctor]);

  const beginExam = () => {
    if (!access?.unlocked) {
      toast.error('Avval to‘lovni tasdiqlating');
      return;
    }
    integrityEventsRef.current = [];
    setStarted(true);
  };

  const blockClipboard = (e: React.ClipboardEvent) => {
    if (!started || finished) return;
    e.preventDefault();
    reportProctor('COPY_ATTEMPT', { type: e.type });
    toast.error('Nusxa ko‘chirish va qo‘yish imtihon davomida o‘chirilgan.');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!exam)
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <p className="text-gray-400">Imtihon topilmadi</p>
      </div>
    );

  if (result)
    return (
      <div className="min-h-screen bg-[#0f172a] flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-dark rounded-2xl p-8 max-w-md w-full text-center"
          >
            <CheckCircle size={64} className="text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Yakunlandi!</h2>
            <div className="text-5xl font-bold gradient-text mb-2">{result.score}%</div>
            {result.cefrLevel && <p className="text-gray-400 mb-6">CEFR: {result.cefrLevel}</p>}
            <div className="flex gap-4">
              <button onClick={() => router.push('/exams')} className="flex-1 py-3 glass rounded-xl text-white hover:bg-white/10 transition">
                Ro‘yxatga
              </button>
              <button onClick={() => router.push('/results')} className="flex-1 py-3 gradient-bg rounded-xl text-white transition">
                Natijalar
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    );

  if (!started) {
    const locked = access && !access.unlocked;
    return (
      <div className="min-h-screen bg-[#0f172a] flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-dark rounded-2xl p-8 max-w-lg w-full">
            <h2 className="text-2xl font-bold text-white mb-2">{exam.title}</h2>
            <div className="space-y-2 mb-6 text-gray-400 text-sm">
              <p>Turi: {exam.type}</p>
              <p>Vaqt: {exam.duration} daqiqa</p>
              {exam.level && <p>Daraja: {exam.level}</p>}
            </div>

            {locked ? (
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-amber-500/15 border border-amber-500/40 rounded-xl text-amber-100 text-sm">
                  <p className="font-medium mb-2">To‘lov talab qilinadi</p>
                  <p>{access?.messageUz}</p>
                  {access?.paymentInstructions && (
                    <pre className="mt-3 whitespace-pre-wrap text-gray-200 text-xs bg-black/30 p-3 rounded-lg">{access.paymentInstructions}</pre>
                  )}
                  {access?.priceUzs != null && <p className="mt-2 text-gray-300">Summa: {access.priceUzs} so‘m</p>}
                </div>
                <Link
                  href={`/payment/exam/${id}`}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl gradient-bg text-white font-semibold"
                >
                  <CreditCard size={18} /> To‘lov sahifasiga o‘tish
                </Link>
              </div>
            ) : (
              <div className="space-y-3 p-4 bg-amber-500/10 rounded-lg mb-6 text-amber-100 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <p>To‘liq ekran, varaq nazorati, bufer bloklash va kamera monitoringi yoqiladi.</p>
                </div>
                <div className="flex items-start gap-2">
                  <Shield size={18} className="text-primary-300 shrink-0 mt-0.5" />
                  <p>Shubhali harakatlar balli hisoblanadi va admin panelda ko‘rinadi.</p>
                </div>
              </div>
            )}

            <button
              onClick={beginExam}
              disabled={!!locked}
              className="w-full gradient-bg hover:gradient-bg-hover text-white font-semibold py-3 rounded-xl transition disabled:opacity-40"
            >
              {locked ? 'To‘lov kutilmoqda' : 'Boshlash'}
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  const question = exam.questions?.[currentQuestion];
  const qLen = exam.questions?.length || 1;
  const progress = ((currentQuestion + 1) / qLen) * 100;

  return (
    <div className="min-h-screen bg-[#0f172a] flex" ref={examSurfaceRef}>
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 className="text-xl font-semibold text-white">{exam.title}</h2>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className={`px-2 py-1 rounded-lg ${webcamOn ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-700 text-gray-300'}`}>
                Kamera: {webcamOn ? 'faol' : 'yo‘q'}
              </span>
              <span className="px-2 py-1 rounded-lg bg-gray-700 text-gray-300">Monitoring faol</span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${timeLeft < 60 ? 'bg-red-500/20 text-red-400' : 'glass text-gray-300'}`}>
              <Clock size={18} />
              {formatTime(timeLeft)}
            </div>
          </div>

          <div className="w-full h-2 bg-gray-700 rounded-full mb-8">
            <div className="h-full gradient-bg rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>

          {question && (
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-dark rounded-2xl p-6 mb-6"
              onCopy={blockClipboard}
              onCut={blockClipboard}
              onPaste={blockClipboard}
            >
              {question.passage && (
                <div className="mb-6 p-4 bg-white/5 rounded-xl text-gray-300 text-sm leading-relaxed max-h-60 overflow-y-auto select-none">
                  {question.passage}
                </div>
              )}
              <p className="text-white text-lg mb-6 select-none">{question.question}</p>
              {question.options && Array.isArray(question.options) && (
                <div className="space-y-3">
                  {question.options.map((option: string, i: number) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAnswers({ ...answers, [question.id]: option })}
                      className={`w-full text-left p-4 rounded-xl border transition ${
                        answers[question.id] === option
                          ? 'border-primary-500 bg-primary-500/10 text-white'
                          : 'border-gray-700 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="flex items-center gap-2 px-6 py-3 glass rounded-xl text-gray-300 hover:text-white disabled:opacity-30 transition"
            >
              <ChevronLeft size={18} /> Oldingi
            </button>

            {currentQuestion < qLen - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                className="flex items-center gap-2 px-6 py-3 gradient-bg rounded-xl text-white transition"
              >
                Keyingi <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 rounded-xl text-white hover:bg-emerald-700 transition"
              >
                Yakunlash <CheckCircle size={18} />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
