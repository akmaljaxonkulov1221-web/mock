'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { BarChart3, TrendingUp, Award } from 'lucide-react';

export default function ResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/exams/results/mine')
      .then(({ data }) => setResults(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const avgScore = results.length > 0
    ? Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length)
    : 0;

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white mb-2">Results</h1>
          <p className="text-gray-400 mb-8">View your exam results and track your performance.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="glass-dark rounded-xl p-5">
              <BarChart3 size={24} className="text-primary-400 mb-3" />
              <div className="text-2xl font-bold text-white">{results.length}</div>
              <div className="text-gray-400 text-sm">Total Exams</div>
            </div>
            <div className="glass-dark rounded-xl p-5">
              <TrendingUp size={24} className="text-emerald-400 mb-3" />
              <div className="text-2xl font-bold text-white">{avgScore}%</div>
              <div className="text-gray-400 text-sm">Average Score</div>
            </div>
            <div className="glass-dark rounded-xl p-5">
              <Award size={24} className="text-amber-400 mb-3" />
              <div className="text-2xl font-bold text-white">
                {results.filter(r => r.score >= 70).length}
              </div>
              <div className="text-gray-400 text-sm">Passed Exams</div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : results.length > 0 ? (
            <div className="glass-dark rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left p-4 text-gray-400 font-medium">Exam</th>
                      <th className="text-left p-4 text-gray-400 font-medium">Type</th>
                      <th className="text-left p-4 text-gray-400 font-medium">Score</th>
                      <th className="text-left p-4 text-gray-400 font-medium">CEFR</th>
                      <th className="text-left p-4 text-gray-400 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result: any, i: number) => (
                      <tr key={result.id} className="border-b border-gray-800 hover:bg-white/5 transition">
                        <td className="p-4 text-white">{result.exam?.title || 'Exam'}</td>
                        <td className="p-4 text-gray-300">{result.exam?.type}</td>
                        <td className="p-4">
                          <span className={`font-semibold ${result.score >= 70 ? 'text-emerald-400' : result.score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                            {Math.round(result.score)}%
                          </span>
                        </td>
                        <td className="p-4">
                          {result.cefrLevel ? (
                            <span className="px-3 py-1 gradient-bg rounded-full text-white text-sm">{result.cefrLevel}</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="p-4 text-gray-400">{new Date(result.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="glass-dark rounded-xl p-12 text-center">
              <BarChart3 size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Results Yet</h3>
              <p className="text-gray-400">Complete some exams to see your results here.</p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
