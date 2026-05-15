'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { BookOpen, Headphones, Clock, ArrowRight, Filter } from 'lucide-react';
import Link from 'next/link';

export default function ExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/subjects').then(({ data }) => setSubjects(data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedType) params.set('type', selectedType);
    if (selectedSubject) params.set('subjectId', selectedSubject);
    api.get(`/exams?${params.toString()}`)
      .then(({ data }) => setExams(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedType, selectedSubject]);

  const getExamIcon = (type: string) => {
    switch (type) {
      case 'READING': return { icon: BookOpen, color: 'from-blue-500 to-blue-700' };
      case 'LISTENING': return { icon: Headphones, color: 'from-purple-500 to-purple-700' };
      case 'WRITING': return { icon: BookOpen, color: 'from-emerald-500 to-emerald-700' };
      case 'SPEAKING': return { icon: BookOpen, color: 'from-amber-500 to-amber-700' };
      case 'MOCK_DTM': return { icon: BookOpen, color: 'from-orange-500 to-orange-700' };
      case 'CUSTOM': return { icon: BookOpen, color: 'from-teal-500 to-teal-700' };
      default: return { icon: BookOpen, color: 'from-primary-500 to-primary-700' };
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white mb-2">Mock Testlar</h1>
          <p className="text-gray-400 mb-6">Imtihon tanlang va mashq qiling. Barcha testlar vaqt belgilangan.</p>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            <div className="flex items-center gap-2 text-gray-400">
              <Filter size={16} /> Filter:
            </div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-white/5 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:border-primary-500 focus:outline-none"
            >
              <option value="">Barcha fanlar</option>
              {subjects.map((s: any) => (
                <option key={s.id} value={s.id}>{s.icon || ''} {s.nameUz || s.name}</option>
              ))}
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-white/5 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:border-primary-500 focus:outline-none"
            >
              <option value="">Barcha turlar</option>
              <option value="READING">Reading</option>
              <option value="LISTENING">Listening</option>
              <option value="WRITING">Writing</option>
              <option value="SPEAKING">Speaking</option>
              <option value="MOCK_CEFR">Mock CEFR</option>
              <option value="MOCK_IELTS">Mock IELTS</option>
              <option value="MOCK_DTM">Mock DTM</option>
              <option value="CUSTOM">Boshqa</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : exams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.map((exam: any, i: number) => {
                const { icon: Icon, color } = getExamIcon(exam.type);
                return (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={`/exams/${exam.id}`}>
                      <div className={`bg-gradient-to-br ${color} rounded-xl p-6 card-hover`}>
                        <Icon size={32} className="text-white mb-4" />
                        <h3 className="text-white font-semibold text-lg mb-2">{exam.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-white/70 text-sm mb-4">
                          <span className="flex items-center gap-1"><Clock size={14} />{exam.duration} min</span>
                          <span>{exam.type}</span>
                          {exam.level && <span>Level: {exam.level}</span>}
                          {exam.subject && (
                            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                              {exam.subject.icon || ''} {exam.subject.nameUz || exam.subject.name}
                            </span>
                          )}
                        </div>
                        {exam.priceUzs && (
                          <div className="text-white/80 text-sm mb-2">
                            {exam.priceUzs.toLocaleString()} so&apos;m
                          </div>
                        )}
                        <div className="flex items-center text-white font-medium">
                          Testni boshlash <ArrowRight size={16} className="ml-2" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 glass-dark rounded-xl">
              <BookOpen size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Testlar topilmadi</h3>
              <p className="text-gray-400">O&apos;qituvchi test yaratganidan keyin bu yerda ko&apos;rinadi.</p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
