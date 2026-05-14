'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { Mic, Square, Loader2, Play, Timer, Gauge } from 'lucide-react';
import toast from 'react-hot-toast';

type PauseMetrics = {
  source?: string;
  wordCount?: number;
  segmentCount?: number;
  longPausesOver1_5s?: number | null;
  pausesOver0_5s?: number | null;
  maxGapSec?: number;
  totalSpeechSec?: number;
  audioDurationSec?: number | null;
  totalPauseSec?: number | null;
  speechRatioApprox?: number | null;
  wordsPerMinuteApprox?: number | null;
  noteUz?: string;
};

type PronunciationBlock = {
  strengthsUz?: string;
  issuesUz?: string;
  stressAndLinkingUz?: string;
};

type FluencyBlock = {
  paceAndRhythmUz?: string;
  hesitationUz?: string;
  coherenceSpokenUz?: string;
};

type SpeakingResult = {
  id: string;
  transcript: string | null;
  fluencyScore: number | null;
  grammarScore: number | null;
  pronunciationScore: number | null;
  overallScore: number | null;
  estimatedSpeakingCefr?: string | null;
  pronunciationAnalysis?: PronunciationBlock | null;
  fluencyAnalysis?: FluencyBlock | null;
  pauseMetrics?: PauseMetrics | null;
  feedback?: string | null;
  sttProvider?: string | null;
};

export default function AISpeakingPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<SpeakingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      mediaRecorder.current = new MediaRecorder(stream, { mimeType: mime });
      const chunks: BlobPart[] = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.current.onstop = async () => {
        const blob = new Blob(chunks, { type: mediaRecorder.current?.mimeType || 'audio/webm' });
        await analyzeSpeaking(blob);
      };

      mediaRecorder.current.start(250);
      setIsRecording(true);
      setTranscript('');
      setResult(null);
      toast.success('Yozish boshlandi');
    } catch {
      toast.error('Mikrofon ruxsati rad etildi');
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    mediaRecorder.current?.stream.getTracks().forEach((track) => track.stop());
    setIsRecording(false);
  };

  const analyzeSpeaking = async (audioBlob: Blob) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      const { data } = await api.post<SpeakingResult>('/ai/speaking', formData);
      setResult(data);
      setTranscript(data.transcript || '');
      toast.success('Groq STT + tahlil yakunlandi');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Tahlil xatoligi');
    } finally {
      setLoading(false);
    }
  };

  const pm = result?.pauseMetrics;

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-6xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white mb-2">AI speaking</h1>
          <p className="text-gray-400 mb-8 text-sm md:text-base">
            Groq Whisper transkripsiya + Groq LLM: talaffuz, ravonlik, pauzalar, CEFR (nutq) va o‘zbekcha fikr. Natijalar bazaga yoziladi.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-dark rounded-2xl p-8 text-center">
              <div
                className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-6 transition ${
                  isRecording ? 'bg-red-500/20 animate-pulse' : 'gradient-bg'
                }`}
              >
                <Mic size={48} className={isRecording ? 'text-red-400' : 'text-white'} />
              </div>

              <h3 className="text-xl font-semibold text-white mb-2">{isRecording ? 'Yozilmoqda…' : 'Tayyor'}</h3>
              <p className="text-gray-400 mb-6 text-sm">{isRecording ? 'Aniq gapiring (ingliz tili tavsiya etiladi)' : 'Boshlash tugmasini bosing'}</p>

              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={loading}
                className={`px-8 py-4 rounded-full font-semibold transition flex items-center gap-2 mx-auto ${
                  isRecording ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'gradient-bg text-white hover:gradient-bg-hover'
                } disabled:opacity-50`}
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : isRecording ? <Square size={20} /> : <Play size={20} />}
                {loading ? 'Tahlil…' : isRecording ? 'To‘xtatish' : 'Boshlash'}
              </button>

              {transcript && (
                <div className="mt-6 p-4 bg-white/5 rounded-xl text-left">
                  <p className="text-gray-400 text-xs mb-1">Transkript (STT)</p>
                  <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">{transcript}</p>
                </div>
              )}
            </div>

            <div>
              {result ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-dark rounded-2xl p-6 space-y-5 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-700 pb-3">
                    <h3 className="text-lg font-semibold text-white">Natija</h3>
                    {result.estimatedSpeakingCefr && (
                      <span className="px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-semibold">
                        CEFR (nutq): {result.estimatedSpeakingCefr}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-gray-400 text-xs">Ravonlik</p>
                      <p className="text-white font-bold text-lg">{result.fluencyScore ?? '—'}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-gray-400 text-xs">Grammatika</p>
                      <p className="text-white font-bold text-lg">{result.grammarScore ?? '—'}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-gray-400 text-xs">Talaffuz</p>
                      <p className="text-white font-bold text-lg">{result.pronunciationScore ?? '—'}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-gray-400 text-xs">Umumiy</p>
                      <p className="text-emerald-400 font-bold text-xl">{result.overallScore ?? '—'}</p>
                    </div>
                  </div>

                  {pm && pm.source === 'groq_whisper' && (
                    <div className="rounded-xl border border-gray-700/80 bg-black/20 p-4 space-y-2">
                      <p className="text-gray-300 text-xs font-semibold flex items-center gap-2">
                        <Timer size={14} className="text-amber-400" /> Pauza va sur’at (segmentlar)
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                        <span>So‘zlar: {pm.wordCount ?? '—'}</span>
                        <span>Segmentlar: {pm.segmentCount ?? '—'}</span>
                        <span>1.5s+ pauzalar: {pm.longPausesOver1_5s ?? '—'}</span>
                        <span>0.5s+ pauzalar: {pm.pausesOver0_5s ?? '—'}</span>
                        <span>Eng uzun bo‘shliq (s): {pm.maxGapSec != null ? pm.maxGapSec.toFixed(2) : '—'}</span>
                        <span className="flex items-center gap-1">
                          <Gauge size={12} /> WPM ≈ {pm.wordsPerMinuteApprox ?? '—'}
                        </span>
                        {pm.audioDurationSec != null && (
                          <span className="col-span-2">Audio davomiyligi ≈ {pm.audioDurationSec.toFixed(1)} s</span>
                        )}
                        {pm.speechRatioApprox != null && (
                          <span className="col-span-2">Nutq / audio nisbati ≈ {(pm.speechRatioApprox * 100).toFixed(0)}%</span>
                        )}
                      </div>
                    </div>
                  )}

                  {pm?.source === 'transcript_only' && pm.noteUz && (
                    <p className="text-amber-200/90 text-xs border border-amber-500/20 rounded-lg p-3 bg-amber-500/5">{pm.noteUz}</p>
                  )}

                  {result.pronunciationAnalysis && (
                    <div className="border-t border-gray-700 pt-4 space-y-2">
                      <p className="text-primary-400 text-xs font-semibold uppercase tracking-wide">Talaffuz tahlili</p>
                      <p className="text-gray-300">
                        <span className="text-gray-500">Kuchli tomonlar: </span>
                        {result.pronunciationAnalysis.strengthsUz}
                      </p>
                      <p className="text-gray-300">
                        <span className="text-gray-500">Muammolar: </span>
                        {result.pronunciationAnalysis.issuesUz}
                      </p>
                      <p className="text-gray-300">
                        <span className="text-gray-500">Urg‘u va bog‘lash: </span>
                        {result.pronunciationAnalysis.stressAndLinkingUz}
                      </p>
                    </div>
                  )}

                  {result.fluencyAnalysis && (
                    <div className="border-t border-gray-700 pt-4 space-y-2">
                      <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide">Ravonlik tahlili</p>
                      <p className="text-gray-300">
                        <span className="text-gray-500">Sur’at va ritm: </span>
                        {result.fluencyAnalysis.paceAndRhythmUz}
                      </p>
                      <p className="text-gray-300">
                        <span className="text-gray-500">Ikkilanish: </span>
                        {result.fluencyAnalysis.hesitationUz}
                      </p>
                      <p className="text-gray-300">
                        <span className="text-gray-500">Izchillik: </span>
                        {result.fluencyAnalysis.coherenceSpokenUz}
                      </p>
                    </div>
                  )}

                  {result.feedback && (
                    <div className="text-gray-200 text-sm whitespace-pre-wrap border-t border-gray-700 pt-4 leading-relaxed">
                      <p className="text-gray-500 text-xs mb-2">Umumiy fikr (o‘zbekcha)</p>
                      {result.feedback}
                    </div>
                  )}

                  {result.sttProvider && (
                    <p className="text-gray-600 text-[10px]">STT: {result.sttProvider}</p>
                  )}
                </motion.div>
              ) : (
                <div className="glass-dark rounded-2xl p-6 text-center text-gray-400 text-sm">
                  Yozib tugatgach natija shu yerda ko‘rinadi.
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
