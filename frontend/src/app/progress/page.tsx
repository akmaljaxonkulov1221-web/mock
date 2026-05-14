'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { Route, Target, BookOpen, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function ProgressPage() {
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/ai/roadmap')
      .then(({ data }) => setRoadmap(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white mb-2">Progress & Roadmap</h1>
          <p className="text-gray-400 mb-8">AI-generated personalized study plan based on your performance.</p>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : roadmap ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="glass-dark rounded-2xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Route size={20} className="text-primary-400" /> Your Study Roadmap
                  </h3>
                  <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-xl">
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">Current</p>
                      <p className="text-2xl font-bold text-white">{roadmap.currentLevel}</p>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full gradient-bg rounded-full" style={{ width: '45%' }} />
                      </div>
                      <p className="text-gray-400 text-sm mt-1">Progress</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">Target</p>
                      <p className="text-2xl font-bold gradient-text">{roadmap.targetLevel}</p>
                    </div>
                  </div>

                  <h4 className="text-white font-semibold mb-3">Weak Areas</h4>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {roadmap.weakSkills?.map((skill: string, i: number) => (
                      <span key={i} className="px-4 py-2 bg-red-500/10 text-red-400 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="glass-dark rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">7-Day Study Plan</h3>
                  <div className="space-y-3">
                    {roadmap.studyPlan?.map((task: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {task.day}
                          </div>
                          <div>
                            <p className="text-white font-medium">{task.task}</p>
                            <p className="text-gray-400 text-sm">{task.duration}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="glass-dark rounded-2xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Target size={20} className="text-primary-400" /> Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-300">Total Exams</span>
                      <span className="text-white font-bold">{roadmap.totalExams}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-300">Average Score</span>
                      <span className="text-white font-bold">{Math.round(roadmap.avgScore)}%</span>
                    </div>
                  </div>
                </div>

                <div className="glass-dark rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link href="/exams" className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition">
                      <BookOpen size={20} className="text-primary-400" />
                      <span className="text-gray-300">Take a Mock Exam</span>
                    </Link>
                    <Link href="/ai-writing" className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition">
                      <TrendingUp size={20} className="text-accent-400" />
                      <span className="text-gray-300">Practice Writing</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-dark rounded-xl p-12 text-center">
              <Route size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Roadmap Yet</h3>
              <p className="text-gray-400">Complete some exams to get your personalized AI roadmap.</p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
