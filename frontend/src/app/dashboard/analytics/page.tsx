'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { LineChart, Target, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/analytics/my'), api.get('/ai/roadmap')])
      .then(([a, r]) => {
        setAnalytics(a.data);
        setRoadmap(r.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const weak = Array.isArray(analytics?.weakSkills) ? analytics.weakSkills : ['Reading', 'Listening', 'Writing', 'Speaking'];
  const radarData = weak.map((skill: string, i: number) => ({
    skill,
    score: Math.max(20, 100 - i * 12 - (analytics?.avgScore ? 100 - analytics.avgScore : 20)),
  }));

  const trend = (roadmap?.totalExams ? [60, 62, 65, analytics?.avgScore || 68, 72] : [55, 58, 60, 63, 66]).map((v, i) => ({
    attempt: `T${i + 1}`,
    score: Math.round(v),
  }));

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <LineChart className="text-primary-400" /> AI Analytics
          </h1>
          <p className="text-gray-400 mb-8">Weak skills, estimated trajectory, and roadmap signals in one place.</p>

          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="glass-dark rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target size={20} className="text-accent-400" /> Skill balance
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="skill" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b' }} />
                      <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.35} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-dark rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-emerald-400" /> Score trend (mock)
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReLineChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="attempt" stroke="#64748b" />
                      <YAxis domain={[0, 100]} stroke="#64748b" />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
                      <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} dot />
                    </ReLineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="xl:col-span-2 glass-dark rounded-2xl p-6 grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Estimated CEFR band</p>
                  <p className="text-3xl font-bold text-white">{roadmap?.currentLevel || 'B1'}</p>
                  <p className="text-gray-500 text-sm mt-2">Target: {roadmap?.targetLevel || 'C1'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Avg. score</p>
                  <p className="text-3xl font-bold text-white">{Math.round(analytics?.avgScore || 0)}%</p>
                  <p className="text-gray-500 text-sm mt-2">Across {analytics?.totalExams || 0} attempts</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Study roadmap</p>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {(roadmap?.studyPlan && roadmap.studyPlan[0]?.task) || 'Complete a mock exam to unlock a tailored weekly plan.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
