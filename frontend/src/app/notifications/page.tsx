'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { Bell, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api
      .get('/notifications')
      .then(({ data }) => setItems(data))
      .catch(() => toast.error('Could not load notifications'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      toast.error('Could not update');
    }
  };

  const markAll = async () => {
    try {
      await api.patch('/notifications/read-all');
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All marked read');
    } catch {
      toast.error('Could not update');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <Bell className="text-primary-400" /> Notifications
            </h1>
            <p className="text-gray-400">Exam reminders, results, and integrity notices.</p>
          </div>
          <button
            type="button"
            onClick={markAll}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass text-gray-200 hover:bg-white/10 transition text-sm"
          >
            <CheckCheck size={18} /> Mark all read
          </button>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="glass-dark rounded-2xl p-12 text-center text-gray-400">No notifications yet.</div>
        ) : (
          <div className="space-y-3">
            {items.map((n) => (
              <motion.div
                key={n.id}
                layout
                className={`glass-dark rounded-xl p-5 border ${n.read ? 'border-gray-800' : 'border-primary-500/40'}`}
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="text-white font-semibold">{n.title}</p>
                    <p className="text-gray-400 text-sm mt-1">{n.body}</p>
                    <p className="text-gray-500 text-xs mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  {!n.read && (
                    <button type="button" onClick={() => markRead(n.id)} className="text-primary-400 text-sm shrink-0 h-fit hover:text-primary-300">
                      Mark read
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
