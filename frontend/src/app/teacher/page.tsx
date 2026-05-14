'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import { Users, BookOpen, BarChart3, TrendingUp, Plus, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeacherPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [examForm, setExamForm] = useState({
    title: '',
    type: 'READING',
    duration: 60,
    level: 'B1',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data } = await api.get('/users?role=STUDENT');
      setStudents(data);
    } catch {}
    setLoading(false);
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/exams', {
        ...examForm,
        questions: [
          { question: 'Sample question 1?', type: 'MCQ', options: ['A', 'B', 'C', 'D'], answer: 'A', order: 1 },
          { question: 'Sample question 2?', type: 'MCQ', options: ['A', 'B', 'C', 'D'], answer: 'B', order: 2 },
        ],
      });
      toast.success('Exam created!');
      setShowCreateExam(false);
    } catch {
      toast.error('Failed to create exam');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Teacher Panel</h1>
              <p className="text-gray-400">Manage your students and create exams.</p>
            </div>
            <button
              onClick={() => setShowCreateExam(!showCreateExam)}
              className="flex items-center gap-2 px-6 py-3 gradient-bg rounded-xl text-white font-medium hover:gradient-bg-hover transition"
            >
              <Plus size={18} /> Create Exam
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-dark rounded-xl p-5">
              <Users size={24} className="text-primary-400 mb-3" />
              <div className="text-2xl font-bold text-white">{students.length}</div>
              <div className="text-gray-400 text-sm">Students</div>
            </div>
            <div className="glass-dark rounded-xl p-5">
              <BookOpen size={24} className="text-emerald-400 mb-3" />
              <div className="text-2xl font-bold text-white">0</div>
              <div className="text-gray-400 text-sm">Exams Created</div>
            </div>
            <div className="glass-dark rounded-xl p-5">
              <BarChart3 size={24} className="text-amber-400 mb-3" />
              <div className="text-2xl font-bold text-white">0</div>
              <div className="text-gray-400 text-sm">Total Results</div>
            </div>
            <div className="glass-dark rounded-xl p-5">
              <TrendingUp size={24} className="text-accent-400 mb-3" />
              <div className="text-2xl font-bold text-white">0%</div>
              <div className="text-gray-400 text-sm">Avg Score</div>
            </div>
          </div>

          {showCreateExam && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-dark rounded-2xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Create New Exam</h3>
              <form onSubmit={handleCreateExam} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Title</label>
                    <input
                      type="text"
                      value={examForm.title}
                      onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                      className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Type</label>
                    <select
                      value={examForm.type}
                      onChange={(e) => setExamForm({ ...examForm, type: e.target.value })}
                      className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                    >
                      <option value="READING">Reading</option>
                      <option value="LISTENING">Listening</option>
                      <option value="WRITING">Writing</option>
                      <option value="SPEAKING">Speaking</option>
                      <option value="MOCK_CEFR">Mock CEFR</option>
                      <option value="MOCK_IELTS">Mock IELTS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Duration (min)</label>
                    <input
                      type="number"
                      value={examForm.duration}
                      onChange={(e) => setExamForm({ ...examForm, duration: parseInt(e.target.value) })}
                      className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Level</label>
                    <select
                      value={examForm.level}
                      onChange={(e) => setExamForm({ ...examForm, level: e.target.value })}
                      className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                    >
                      <option value="A1">A1</option>
                      <option value="A2">A2</option>
                      <option value="B1">B1</option>
                      <option value="B2">B2</option>
                      <option value="C1">C1</option>
                      <option value="C2">C2</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="px-6 py-3 gradient-bg rounded-xl text-white font-medium hover:gradient-bg-hover transition">
                  Create Exam
                </button>
              </form>
            </motion.div>
          )}

          <div className="glass-dark rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users size={20} className="text-primary-400" /> Your Students
            </h3>
            {loading ? (
              <div className="text-center py-10">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : students.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left p-3 text-gray-400 font-medium">Name</th>
                      <th className="text-left p-3 text-gray-400 font-medium">Email</th>
                      <th className="text-left p-3 text-gray-400 font-medium">XP</th>
                      <th className="text-left p-3 text-gray-400 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student: any) => (
                      <tr key={student.id} className="border-b border-gray-800 hover:bg-white/5 transition">
                        <td className="p-3 flex items-center gap-2 text-white">
                          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white text-sm">
                            {student.name?.charAt(0)}
                          </div>
                          {student.name}
                        </td>
                        <td className="p-3 text-gray-400">{student.email}</td>
                        <td className="p-3 text-white">{student.xp || 0}</td>
                        <td className="p-3 text-gray-400">{new Date(student.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 text-center py-10">No students assigned yet.</p>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
