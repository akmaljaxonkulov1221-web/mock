'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react';

export default function LeaderboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/leaderboard')
      .then(({ data }) => setUsers(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return { icon: Crown, color: 'text-amber-400', bg: 'bg-amber-400/10' };
      case 1: return { icon: Medal, color: 'text-gray-300', bg: 'bg-gray-300/10' };
      case 2: return { icon: Medal, color: 'text-amber-700', bg: 'bg-amber-700/10' };
      default: return { icon: Trophy, color: 'text-gray-500', bg: 'bg-gray-500/10' };
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
          <p className="text-gray-400 mb-8">Top students ranked by XP and performance.</p>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : users.length > 0 ? (
            <div className="glass-dark rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-800">
                <div className="grid grid-cols-12 gap-4 text-gray-400 text-sm font-medium">
                  <div className="col-span-1">#</div>
                  <div className="col-span-6">Student</div>
                  <div className="col-span-2 text-center">XP</div>
                  <div className="col-span-2 text-center">Streak</div>
                  <div className="col-span-1"></div>
                </div>
              </div>
              <div className="divide-y divide-gray-800">
                {users.map((user: any, i: number) => {
                  const { icon: RankIcon, color, bg } = getRankIcon(i);
                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`grid grid-cols-12 gap-4 items-center p-4 hover:bg-white/5 transition ${i < 3 ? bg : ''}`}
                    >
                      <div className="col-span-1 flex justify-center">
                        <RankIcon size={20} className={color} />
                      </div>
                      <div className="col-span-6 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${i < 3 ? 'gradient-bg' : 'bg-gray-700'}`}>
                          {user.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-gray-400 text-sm">{user.email || ''}</p>
                        </div>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="text-white font-bold">{user.xp || 0}</span>
                      </div>
                      <div className="col-span-2 text-center">
                        <div className="inline-flex items-center gap-1 text-amber-400">
                          <TrendingUp size={14} />
                          <span>{user.streak || 0} days</span>
                        </div>
                      </div>
                      <div className="col-span-1 text-center">
                        {i === 0 && <Crown size={18} className="text-amber-400 mx-auto" />}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="glass-dark rounded-xl p-12 text-center">
              <Trophy size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Rankings Yet</h3>
              <p className="text-gray-400">Start taking exams to appear on the leaderboard!</p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
