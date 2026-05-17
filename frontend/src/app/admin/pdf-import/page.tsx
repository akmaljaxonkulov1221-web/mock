'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import {
  Upload, FileText, CheckCircle2, XCircle, Loader2,
  Save, Trash2, AlertCircle, BookOpen, X, Eye, ChevronDown, ChevronUp
} from 'lucide-react';

interface ParsedQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

interface Subject {
  id: string;
  name: string;
  nameUz?: string;
  icon?: string;
}

type Step = 'upload' | 'preview' | 'saved';

export default function AdminPdfImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState(2);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [parseInfo, setParseInfo] = useState<{ pages: number; chars: number; model: string; ms: number } | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  // Removed question indexes
  const [removedSet, setRemovedSet] = useState<Set<number>>(new Set());

  useEffect(() => {
    api.get('/subjects').then(({ data }) => setSubjects(data)).catch(() => {});
  }, []);

  // Drag & Drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === 'application/pdf') {
      setFile(dropped);
      setError('');
    } else {
      setError('Faqat PDF fayl qabul qilinadi');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setError(''); }
  };

  const handleParse = async () => {
    if (!file) { setError('PDF fayl tanlang'); return; }
    if (!subjectId) { setError('Fan tanlang'); return; }

    setError('');
    setParsing(true);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('subjectId', subjectId);
      fd.append('topic', topic || 'Umumiy');
      fd.append('difficulty', String(difficulty));

      const { data } = await api.post('/pdf-import/parse', fd);
      setQuestions(data.questions || []);
      setParseInfo({
        pages: data.pdfPageCount,
        chars: data.pdfCharCount,
        model: data.model,
        ms: data.latencyMs,
      });
      setRemovedSet(new Set());
      setStep('preview');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'PDF tahlil qilishda xatolik yuz berdi');
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    const toSave = questions.filter((_, i) => !removedSet.has(i));
    if (toSave.length === 0) { setError("Saqlash uchun savollar yo'q"); return; }

    setError('');
    setSaving(true);
    try {
      const { data } = await api.post('/pdf-import/save', {
        subjectId,
        topic: topic || 'Umumiy',
        difficulty,
        questions: toSave,
      });
      setSavedCount(data.saved);
      setStep('saved');
    } catch (err: any) {
      setError(err?.response?.data?.message || "Saqlashda xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const removeQuestion = (idx: number) => {
    setRemovedSet(prev => new Set([...prev, idx]));
  };

  const restoreQuestion = (idx: number) => {
    setRemovedSet(prev => { const s = new Set(prev); s.delete(idx); return s; });
  };

  const activeCount = questions.filter((_, i) => !removedSet.has(i)).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <FileText className="text-orange-400" size={26} />
          PDF orqali Test Yuklash
        </h2>
        <p className="text-gray-400 mt-1 text-sm">
          PDF fayldan AI yordamida test savollari yaratib, Question Bank ga saqlang
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-3">
        {(['upload', 'preview', 'saved'] as Step[]).map((s, i) => {
          const active = s === step;
          const done =
            (s === 'upload' && (step === 'preview' || step === 'saved')) ||
            (s === 'preview' && step === 'saved');
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition ${
                done ? 'bg-emerald-500 text-white' :
                active ? 'bg-orange-500 text-white' :
                'bg-white/10 text-gray-500'
              }`}>
                {done ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span className={`text-sm ${active ? 'text-white' : 'text-gray-500'}`}>
                {s === 'upload' ? 'Yuklash' : s === 'preview' ? 'Tekshirish' : 'Saqlash'}
              </span>
              {i < 2 && <div className="w-8 h-px bg-white/10" />}
            </div>
          );
        })}
      </div>

      {/* STEP 1: Upload */}
      {step === 'upload' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Fan *</label>
              <select
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
                className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="">Fan tanlang...</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.icon} {s.nameUz || s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Mavzu</label>
              <input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Masalan: Algebra, Grammatika..."
                className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Qiyinlik darajasi</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(parseInt(e.target.value))}
                className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:outline-none"
              >
                <option value={1}>1 — Oson</option>
                <option value={2}>2 — O'rta</option>
                <option value={3}>3 — Qiyin</option>
                <option value={4}>4 — Juda qiyin</option>
              </select>
            </div>
          </div>

          {/* Drop zone */}
          <div
            ref={dropRef}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition ${
              dragOver
                ? 'border-orange-400 bg-orange-400/10'
                : file
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-white/20 hover:border-orange-400/50 hover:bg-white/5'
            }`}
          >
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
            {file ? (
              <div>
                <CheckCircle2 size={40} className="mx-auto text-emerald-400 mb-3" />
                <p className="text-white font-semibold text-lg">{file.name}</p>
                <p className="text-gray-400 text-sm mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                <button
                  onClick={e => { e.stopPropagation(); setFile(null); }}
                  className="mt-3 text-xs text-red-400 hover:text-red-300"
                >
                  Faylni olib tashlash
                </button>
              </div>
            ) : (
              <div>
                <Upload size={40} className="mx-auto text-gray-500 mb-3" />
                <p className="text-white font-medium">PDF faylni bu yerga tashlang</p>
                <p className="text-gray-500 text-sm mt-1">yoki <span className="text-orange-400 underline">tanlang</span></p>
                <p className="text-gray-600 text-xs mt-3">Maksimal hajm: 20 MB</p>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button
            onClick={handleParse}
            disabled={parsing || !file || !subjectId}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-700 text-white font-semibold hover:opacity-90 disabled:opacity-40 transition flex items-center justify-center gap-3 text-lg"
          >
            {parsing ? (
              <><Loader2 size={22} className="animate-spin" /> AI tahlil qilmoqda...</>
            ) : (
              <><FileText size={22} /> AI bilan savollar yaratish</>
            )}
          </button>

          {parsing && (
            <div className="text-center text-gray-400 text-sm animate-pulse">
              PDF matnini o'qiyapman va AI yordamida savollar yaratyapman... Bu 10-30 soniya olishi mumkin.
            </div>
          )}
        </motion.div>
      )}

      {/* STEP 2: Preview */}
      {step === 'preview' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Summary */}
          {parseInfo && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'PDF betlar', value: parseInfo.pages },
                { label: 'Belgilar', value: parseInfo.chars.toLocaleString() },
                { label: 'Yaratilgan savollar', value: questions.length },
                { label: "AI vaqti", value: `${(parseInfo.ms / 1000).toFixed(1)}s` },
              ].map(s => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-xl font-bold text-white">{s.value}</p>
                  <p className="text-gray-400 text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              <span className="text-white font-medium">{activeCount}</span> ta savol saqlanadi
              {removedSet.size > 0 && <span className="text-red-400 ml-2">({removedSet.size} ta o'chirildi)</span>}
            </p>
            <button
              onClick={() => { setStep('upload'); setQuestions([]); setError(''); }}
              className="text-sm text-gray-400 hover:text-white transition flex items-center gap-1"
            >
              <X size={14} /> Qayta yuklash
            </button>
          </div>

          {/* Questions list */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const removed = removedSet.has(idx);
              const isExpanded = expandedIdx === idx;
              return (
                <div
                  key={idx}
                  className={`border rounded-xl overflow-hidden transition ${
                    removed ? 'border-red-500/20 bg-red-500/5 opacity-50' : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex items-start gap-3 px-4 py-3">
                    <span className="text-gray-500 text-sm font-mono mt-0.5 shrink-0">{idx + 1}.</span>
                    <p className={`flex-1 text-sm ${removed ? 'text-gray-500 line-through' : 'text-white'}`}>
                      {q.question}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                        className="text-gray-500 hover:text-white transition"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      {removed ? (
                        <button
                          onClick={() => restoreQuestion(idx)}
                          className="text-xs text-emerald-400 hover:text-emerald-300"
                        >Qaytarish</button>
                      ) : (
                        <button
                          onClick={() => removeQuestion(idx)}
                          className="text-gray-500 hover:text-red-400 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  {isExpanded && !removed && (
                    <div className="px-4 pb-4 border-t border-white/10">
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`text-xs px-3 py-2 rounded-lg ${
                              String(oIdx) === String(q.answer)
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-white/5 text-gray-400'
                            }`}
                          >
                            <span className="font-bold mr-1">{['A', 'B', 'C', 'D'][oIdx]}.</span> {opt}
                            {String(oIdx) === String(q.answer) && (
                              <span className="ml-2 text-emerald-400">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="text-gray-400 text-xs mt-3 bg-white/5 rounded-lg px-3 py-2">
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setStep('upload'); setQuestions([]); }}
              className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition"
            >
              Orqaga
            </button>
            <button
              onClick={handleSave}
              disabled={saving || activeCount === 0}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 text-white font-semibold hover:opacity-90 disabled:opacity-40 transition flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Saqlanmoqda...' : `${activeCount} ta savolni saqlash`}
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 3: Saved */}
      {step === 'saved' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Muvaffaqiyatli saqlandi!</h3>
          <p className="text-gray-400 mb-8">
            <span className="text-white font-bold">{savedCount}</span> ta savol Question Bank ga qo'shildi.
          </p>
          <button
            onClick={() => {
              setStep('upload');
              setFile(null);
              setQuestions([]);
              setError('');
              setParseInfo(null);
              setRemovedSet(new Set());
            }}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-700 text-white font-medium hover:opacity-90 transition flex items-center gap-2 mx-auto"
          >
            <Upload size={18} /> Yangi PDF yuklash
          </button>
        </motion.div>
      )}
    </div>
  );
}
