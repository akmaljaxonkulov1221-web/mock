'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { BookOpen, Headphones, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/exams')
      .then(({ data }) => setExams(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getExamIcon = (type: string) => {
    switch (type) {
      case 'READING': return { icon: BookOpen, color: 'from-blue-500 to-blue-700' };
      case 'LISTENING': return { icon: Headphones, color: 'from-purple-500 to-purple-700' };
      case 'WRITING': return { icon: BookOpen, color: 'from-emerald-500 to-emerald-700' };
      case 'SPEAKING': return { icon: BookOpen, color: 'from-amber-500 to-amber-700' };
      default: return { icon: BookOpen, color: 'from-primary-500 to-primary-700' };
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white mb-2">Mock Exams</h1>
          <p className="text-gray-400 mb-8">Choose an exam to practice. All exams are timed.</p>

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
                        <div className="flex items-center gap-4 text-white/70 text-sm mb-4">
                          <span className="flex items-center gap-1"><Clock size={14} />{exam.duration} min</span>
                          <span>{exam.type}</span>
                          {exam.level && <span>Level: {exam.level}</span>}
                        </div>
                        <div className="flex items-center text-white font-medium">
                          Start Exam <ArrowRight size={16} className="ml-2" />
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
              <h3 className="text-xl font-semibold text-white mb-2">No Exams Available</h3>
              <p className="text-gray-400">Exams will appear here once your teacher creates them.</p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
