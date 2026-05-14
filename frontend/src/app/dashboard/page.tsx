'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { BookOpen, Mic, PenLine, Trophy, TrendingUp, Clock, Target } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentResults, setRecentResults] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, resultsRes] = await Promise.all([
          api.get('/analytics/my'),
          api.get('/exams/results/mine'),
        ]);
        setStats(analyticsRes.data);
        setRecentResults(resultsRes.data.slice(0, 5));
      } catch (err) {}
    };
    fetchData();
  }, []);

  const quickActions = [
    { href: '/exams', icon: BookOpen, label: 'Take Exam', desc: 'Practice with mock tests', color: 'from-primary-500 to-primary-700' },
    { href: '/ai-speaking', icon: Mic, label: 'AI Speaking', desc: 'Practice speaking', color: 'from-accent-500 to-accent-700' },
    { href: '/ai-writing', icon: PenLine, label: 'AI Writing', desc: 'Write and get feedback', color: 'from-emerald-500 to-emerald-700' },
    { href: '/leaderboard', icon: Trophy, label: 'Leaderboard', desc: 'See rankings', color: 'from-amber-500 to-amber-700' },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400 mb-8">Welcome back! Here is your progress overview.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Exams', value: stats?.totalExams || 0, icon: BookOpen, color: 'text-primary-400' },
              { label: 'Average Score', value: `${Math.round(stats?.avgScore || 0)}%`, icon: TrendingUp, color: 'text-emerald-400' },
              { label: 'Study Time', value: `${stats?.studyTime || 0}h`, icon: Clock, color: 'text-amber-400' },
              { label: 'Progress', value: `${Math.round(stats?.progressScore || 0)}%`, icon: Target, color: 'text-accent-400' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-dark rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <item.icon size={24} className={item.color} />
                </div>
                <div className="text-2xl font-bold text-white">{item.value}</div>
                <div className="text-gray-400 text-sm">{item.label}</div>
              </motion.div>
            ))}
          </div>

          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {quickActions.map((action, i) => (
              <Link key={i} href={action.href}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className={`bg-gradient-to-br ${action.color} rounded-xl p-5 card-hover cursor-pointer`}
                >
                  <action.icon size={28} className="text-white mb-3" />
                  <h3 className="text-white font-semibold">{action.label}</h3>
                  <p className="text-white/70 text-sm">{action.desc}</p>
                </motion.div>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-dark rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Results</h3>
              {recentResults.length > 0 ? (
                <div className="space-y-3">
                  {recentResults.map((result: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{result.exam?.title || 'Exam'}</p>
                        <p className="text-gray-400 text-sm">{result.exam?.type} - {new Date(result.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{Math.round(result.score)}%</p>
                        {result.cefrLevel && <p className="text-primary-400 text-sm">{result.cefrLevel}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No results yet. Start an exam!</p>
              )}
            </div>

            <div className="glass-dark rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Weak Skills</h3>
              {stats?.weakSkills && stats.weakSkills.length > 0 ? (
                <div className="space-y-3">
                  {stats.weakSkills.map((skill: string, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-gray-300">{skill}</span>
                      <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full gradient-bg rounded-full" style={{ width: `${30 + Math.random() * 50}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">Complete some exams to see your weak areas.</p>
              )}
              <Link href="/progress" className="block text-center mt-4 text-primary-400 hover:text-primary-300 font-medium">
                View Full Progress
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
