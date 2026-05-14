'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';
import {
  Users,
  Building2,
  CreditCard,
  DollarSign,
  Cpu,
  ShieldAlert,
  RefreshCw,
  Settings,
  BookOpen,
  Save,
  Plus,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'overview' | 'payments' | 'settings' | 'subjects' | 'ai' | 'integrity';

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [oneTimePending, setOneTimePending] = useState<any[]>([]);
  const [aiUsage, setAiUsage] = useState<any[]>([]);
  const [suspicious, setSuspicious] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleEdits, setRoleEdits] = useState<Record<string, string>>({});

  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [settingsLoading, setSettingsLoading] = useState(false);

  const [subjects, setSubjects] = useState<any[]>([]);
  const [newSubject, setNewSubject] = useState({ name: '', nameUz: '', description: '', icon: '' });

  const loadCore = useCallback(async () => {
    try {
      const [usersRes, subsRes, centersRes] = await Promise.all([
        api.get('/users'),
        api.get('/payments/subscriptions/all'),
        api.get('/centers'),
      ]);
      setUsers(usersRes.data);
      setSubscriptions(subsRes.data);
      setCenters(centersRes.data);
    } catch {
      toast.error("Ma'lumot yuklanmadi");
    }
  }, []);

  const loadPayments = useCallback(async () => {
    try {
      const [manualRes, oneTimeRes] = await Promise.all([
        api.get('/manual-payments/pending'),
        api.get('/payments/pending'),
      ]);
      setPendingPayments(manualRes.data);
      setOneTimePending(oneTimeRes.data);
    } catch {
      toast.error("To'lovlar yuklanmadi");
    }
  }, []);

  const loadAi = useCallback(async () => {
    try {
      const { data } = await api.get('/analytics/admin/ai-usage');
      setAiUsage(data);
    } catch {
      toast.error('AI usage yuklanmadi');
    }
  }, []);

  const loadSuspicious = useCallback(async () => {
    try {
      const { data } = await api.get('/exams/admin/suspicious-results');
      setSuspicious(data);
    } catch {
      toast.error('Shubhali natijalar yuklanmadi');
    }
  }, []);

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const { data } = await api.get('/settings');
      setSiteSettings(data);
    } catch {
      toast.error('Sozlamalar yuklanmadi');
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const loadSubjects = useCallback(async () => {
    try {
      const { data } = await api.get('/subjects?includeInactive=true');
      setSubjects(data);
    } catch {
      toast.error('Fanlar yuklanmadi');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadCore();
      await Promise.all([loadPayments(), loadAi(), loadSuspicious(), loadSettings(), loadSubjects()]);
      setLoading(false);
    })();
  }, [loadCore, loadPayments, loadAi, loadSuspicious, loadSettings, loadSubjects]);

  const approvePayment = async (id: string) => {
    try {
      await api.post(`/manual-payments/${id}/approve`);
      toast.success('Tasdiqlandi');
      loadPayments();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Xato');
    }
  };

  const rejectPayment = async (id: string) => {
    const reason = window.prompt("Rad etish sababi") || 'Rad etildi';
    try {
      await api.post(`/manual-payments/${id}/reject`, { reason });
      toast.success('Rad etildi');
      loadPayments();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Xato');
    }
  };

  const approveOneTime = async (id: string) => {
    try {
      await api.post(`/payments/${id}/approve`);
      toast.success('Tasdiqlandi');
      loadPayments();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Xato');
    }
  };

  const rejectOneTime = async (id: string) => {
    const reason = window.prompt("Rad etish sababi") || 'Rad etildi';
    try {
      await api.post(`/payments/${id}/reject`, { reason });
      toast.success('Rad etildi');
      loadPayments();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Xato');
    }
  };

  const saveRole = async (userId: string) => {
    const role = roleEdits[userId];
    if (!role) return;
    try {
      await api.patch(`/users/${userId}/role`, { role });
      toast.success('Rol yangilandi');
      loadCore();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Xato');
    }
  };

  const saveSettings = async () => {
    try {
      await api.put('/settings', siteSettings);
      toast.success('Sozlamalar saqlandi');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Xato');
    }
  };

  const createSubject = async () => {
    if (!newSubject.name.trim()) {
      toast.error('Fan nomi kiritilmagan');
      return;
    }
    try {
      await api.post('/subjects', newSubject);
      toast.success('Fan qo\'shildi');
      setNewSubject({ name: '', nameUz: '', description: '', icon: '' });
      loadSubjects();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Xato');
    }
  };

  const deleteSubject = async (id: string) => {
    if (!window.confirm("Bu fanni o'chirishni xohlaysizmi?")) return;
    try {
      await api.delete(`/subjects/${id}`);
      toast.success("O'chirildi");
      loadSubjects();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Xato');
    }
  };

  const toggleSubjectActive = async (id: string, isActive: boolean) => {
    try {
      await api.put(`/subjects/${id}`, { isActive: !isActive });
      toast.success('Yangilandi');
      loadSubjects();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Xato');
    }
  };

  const stats = [
    { icon: Users, label: 'Foydalanuvchilar', value: users.length, color: 'text-primary-400' },
    { icon: Building2, label: 'Markazlar', value: centers.length, color: 'text-emerald-400' },
    { icon: CreditCard, label: 'Obunalar', value: subscriptions.length, color: 'text-amber-400' },
    { icon: DollarSign, label: "Kutilayotgan to'lov", value: pendingPayments.length + oneTimePending.length, color: 'text-accent-400' },
  ];

  const tabLabels: Record<Tab, string> = {
    overview: 'Umumiy',
    payments: "To'lovlar",
    settings: 'Sozlamalar',
    subjects: 'Fanlar',
    ai: 'AI usage',
    integrity: 'Shubhali',
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Admin panel</h1>
              <p className="text-gray-400 text-sm">Sozlamalar, to&apos;lovlar, fanlar, monitoring.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                loadCore();
                loadPayments();
                loadAi();
                loadSuspicious();
                loadSettings();
                loadSubjects();
                toast.success('Yangilandi');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass text-gray-200 hover:bg-white/10"
            >
              <RefreshCw size={18} /> Yangilash
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {(Object.keys(tabLabels) as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  tab === t ? 'gradient-bg text-white' : 'glass text-gray-400 hover:text-white'
                }`}
              >
                {tabLabels[t]}
              </button>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {tab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-dark rounded-xl p-5"
                  >
                    <stat.icon size={24} className={stat.color + ' mb-3'} />
                    <div className="text-2xl font-bold text-white">{loading ? '\u2014' : stat.value}</div>
                    <div className="text-gray-400 text-sm">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              <div className="glass-dark rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Users size={20} className="text-primary-400" /> Foydalanuvchilar
                </h3>
                {loading ? (
                  <div className="text-center py-10">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-800">
                          <th className="text-left p-3 text-gray-400">Ism</th>
                          <th className="text-left p-3 text-gray-400">Email</th>
                          <th className="text-left p-3 text-gray-400">Rol</th>
                          <th className="text-left p-3 text-gray-400">Aksiya</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user: any) => (
                          <tr key={user.id} className="border-b border-gray-800">
                            <td className="p-3 text-white">{user.name}</td>
                            <td className="p-3 text-gray-400">{user.email}</td>
                            <td className="p-3 text-gray-300">{user.role}</td>
                            <td className="p-3 flex flex-wrap gap-2 items-center">
                              <select
                                className="bg-white/5 border border-gray-700 rounded-lg px-2 py-1 text-white text-xs"
                                value={roleEdits[user.id] ?? user.role}
                                onChange={(e) => setRoleEdits((s) => ({ ...s, [user.id]: e.target.value }))}
                              >
                                {['STUDENT', 'TEACHER', 'CENTER_ADMIN', 'SUPER_ADMIN'].map((r) => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                              <button type="button" onClick={() => saveRole(user.id)} className="text-xs px-2 py-1 rounded-lg bg-primary-600 text-white">Saqlash</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* SETTINGS TAB */}
          {tab === 'settings' && (
            <div className="glass-dark rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Settings size={20} className="text-primary-400" /> Sayt sozlamalari
              </h3>
              {settingsLoading ? (
                <div className="text-center py-10">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Sayt nomi</label>
                      <input
                        type="text"
                        value={siteSettings.site_name || ''}
                        onChange={(e) => setSiteSettings((s) => ({ ...s, site_name: e.target.value }))}
                        className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                        placeholder="MockCEFR"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Logo URL</label>
                      <input
                        type="text"
                        value={siteSettings.site_logo || ''}
                        onChange={(e) => setSiteSettings((s) => ({ ...s, site_logo: e.target.value }))}
                        className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                        placeholder="https://..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-gray-400 text-sm mb-2">Sayt tavsifi</label>
                      <textarea
                        value={siteSettings.site_description || ''}
                        onChange={(e) => setSiteSettings((s) => ({ ...s, site_description: e.target.value }))}
                        className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                        rows={3}
                        placeholder="AI-powered mock exam platform"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Favicon URL</label>
                      <input
                        type="text"
                        value={siteSettings.site_favicon || ''}
                        onChange={(e) => setSiteSettings((s) => ({ ...s, site_favicon: e.target.value }))}
                        className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Asosiy rang</label>
                      <div className="flex gap-3 items-center">
                        <input
                          type="color"
                          value={siteSettings.primary_color || '#6366f1'}
                          onChange={(e) => setSiteSettings((s) => ({ ...s, primary_color: e.target.value }))}
                          className="w-12 h-10 rounded-lg cursor-pointer border border-gray-700 bg-transparent"
                        />
                        <input
                          type="text"
                          value={siteSettings.primary_color || '#6366f1'}
                          onChange={(e) => setSiteSettings((s) => ({ ...s, primary_color: e.target.value }))}
                          className="flex-1 bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Kontakt email</label>
                      <input
                        type="email"
                        value={siteSettings.contact_email || ''}
                        onChange={(e) => setSiteSettings((s) => ({ ...s, contact_email: e.target.value }))}
                        className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                        placeholder="info@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Kontakt telefon</label>
                      <input
                        type="text"
                        value={siteSettings.contact_phone || ''}
                        onChange={(e) => setSiteSettings((s) => ({ ...s, contact_phone: e.target.value }))}
                        className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                        placeholder="+998 90 123 45 67"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Valyuta</label>
                      <select
                        value={siteSettings.currency || 'UZS'}
                        onChange={(e) => setSiteSettings((s) => ({ ...s, currency: e.target.value }))}
                        className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                      >
                        <option value="UZS">UZS (so&apos;m)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR</option>
                        <option value="RUB">RUB</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-gray-400 text-sm mb-2">To&apos;lov ko&apos;rsatmalari</label>
                      <textarea
                        value={siteSettings.payment_instructions || ''}
                        onChange={(e) => setSiteSettings((s) => ({ ...s, payment_instructions: e.target.value }))}
                        className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                        rows={4}
                        placeholder="Karta raqami, bank nomi va h.k."
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={saveSettings}
                    className="inline-flex items-center gap-2 px-6 py-3 gradient-bg rounded-xl text-white font-medium hover:opacity-90 transition"
                  >
                    <Save size={18} /> Sozlamalarni saqlash
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SUBJECTS TAB */}
          {tab === 'subjects' && (
            <div className="space-y-6">
              <div className="glass-dark rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Plus size={20} className="text-primary-400" /> Yangi fan qo&apos;shish
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Fan nomi (inglizcha)"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject((s) => ({ ...s, name: e.target.value }))}
                    className="bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Fan nomi (o'zbekcha)"
                    value={newSubject.nameUz}
                    onChange={(e) => setNewSubject((s) => ({ ...s, nameUz: e.target.value }))}
                    className="bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Tavsif"
                    value={newSubject.description}
                    onChange={(e) => setNewSubject((s) => ({ ...s, description: e.target.value }))}
                    className="bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Icon (emoji yoki URL)"
                    value={newSubject.icon}
                    onChange={(e) => setNewSubject((s) => ({ ...s, icon: e.target.value }))}
                    className="bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={createSubject}
                  className="inline-flex items-center gap-2 px-6 py-3 gradient-bg rounded-xl text-white font-medium hover:opacity-90 transition"
                >
                  <Plus size={18} /> Qo&apos;shish
                </button>
              </div>

              <div className="glass-dark rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BookOpen size={20} className="text-emerald-400" /> Mavjud fanlar
                </h3>
                {subjects.length === 0 ? (
                  <p className="text-gray-400">Hali fan qo&apos;shilmagan.</p>
                ) : (
                  <div className="space-y-3">
                    {subjects.map((subj: any) => (
                      <div key={subj.id} className="flex items-center justify-between border border-gray-700 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{subj.icon || '📚'}</span>
                          <div>
                            <p className="text-white font-medium">{subj.name} {subj.nameUz && <span className="text-gray-400">({subj.nameUz})</span>}</p>
                            {subj.description && <p className="text-gray-500 text-sm">{subj.description}</p>}
                            <p className="text-gray-500 text-xs mt-1">{subj._count?.exams ?? 0} ta test</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => toggleSubjectActive(subj.id, subj.isActive)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium ${subj.isActive ? 'bg-emerald-600/20 text-emerald-400' : 'bg-red-600/20 text-red-400'}`}
                          >
                            {subj.isActive ? 'Faol' : 'Nofaol'}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSubject(subj.id)}
                            className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PAYMENTS TAB */}
          {tab === 'payments' && (
            <div className="space-y-6">
              {/* One-time payments */}
              <div className="glass-dark rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Bir martalik to&apos;lovlar (kutilmoqda)</h3>
                {oneTimePending.length === 0 ? (
                  <p className="text-gray-400">Navbatda so&apos;rov yo&apos;q.</p>
                ) : (
                  <div className="space-y-4">
                    {oneTimePending.map((p: any) => (
                      <div key={p.id} className="border border-gray-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1 text-sm">
                          <p className="text-white font-medium">{p.user?.name} &mdash; {p.exam?.title}</p>
                          <p className="text-gray-400">{p.user?.email}</p>
                          <p className="text-emerald-400 mt-1">{p.amount?.toLocaleString()} {p.currency}</p>
                          {p.screenshotKey && (
                            <img
                              src={`/uploads/${p.screenshotKey.replace(/^uploads\//, '')}`}
                              alt="chek"
                              className="mt-2 max-h-40 rounded-lg border border-gray-600"
                            />
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => approveOneTime(p.id)} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm">Tasdiqlash</button>
                          <button type="button" onClick={() => rejectOneTime(p.id)} className="px-4 py-2 rounded-lg bg-red-600/80 text-white text-sm">Rad etish</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Manual payments (legacy) */}
              <div className="glass-dark rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Qo&apos;lda to&apos;lovlar (eski tizim)</h3>
                {pendingPayments.length === 0 ? (
                  <p className="text-gray-400">Navbatda so&apos;rov yo&apos;q.</p>
                ) : (
                  <div className="space-y-4">
                    {pendingPayments.map((p: any) => (
                      <div key={p.id} className="border border-gray-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1 text-sm">
                          <p className="text-white font-medium">{p.user?.name} &mdash; {p.exam?.title}</p>
                          <p className="text-gray-400">{p.user?.email}</p>
                          {p.amountNote && <p className="text-gray-500 mt-1">{p.amountNote}</p>}
                          <img
                            src={p.screenshotKey ? `/uploads/${p.screenshotKey.replace(/^uploads\//, '')}` : ''}
                            alt="chek"
                            className="mt-2 max-h-40 rounded-lg border border-gray-600"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => approvePayment(p.id)} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm">Tasdiqlash</button>
                          <button type="button" onClick={() => rejectPayment(p.id)} className="px-4 py-2 rounded-lg bg-red-600/80 text-white text-sm">Rad etish</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI TAB */}
          {tab === 'ai' && (
            <div className="glass-dark rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Cpu size={20} /> Groq AI usage
              </h3>
              <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400">
                      <th className="text-left p-2">Vaqt</th>
                      <th className="text-left p-2">Endpoint</th>
                      <th className="text-left p-2">Model</th>
                      <th className="text-left p-2">Token</th>
                      <th className="text-left p-2">ms</th>
                      <th className="text-left p-2">User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiUsage.map((row: any) => (
                      <tr key={row.id} className="border-b border-gray-800/80">
                        <td className="p-2 text-gray-400 whitespace-nowrap">{new Date(row.createdAt).toLocaleString()}</td>
                        <td className="p-2 text-gray-300">{row.endpoint}</td>
                        <td className="p-2 text-gray-300">{row.model}</td>
                        <td className="p-2 text-gray-300">{(row.inputTokens ?? 0) + (row.outputTokens ?? 0)}</td>
                        <td className="p-2 text-gray-300">{row.latencyMs}</td>
                        <td className="p-2 text-gray-400">{row.user?.email ?? '\u2014'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* INTEGRITY TAB */}
          {tab === 'integrity' && (
            <div className="glass-dark rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ShieldAlert size={20} className="text-amber-400" /> Yuqori shubha balli
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400">
                      <th className="text-left p-2">Sana</th>
                      <th className="text-left p-2">O&apos;quvchi</th>
                      <th className="text-left p-2">Imtihon</th>
                      <th className="text-left p-2">Ball</th>
                      <th className="text-left p-2">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suspicious.map((r: any) => (
                      <tr key={r.id} className="border-b border-gray-800">
                        <td className="p-2 text-gray-400 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
                        <td className="p-2 text-white">{r.user?.name}</td>
                        <td className="p-2 text-gray-300">{r.exam?.title}</td>
                        <td className="p-2 text-amber-300">{r.integrityScore ?? '\u2014'}</td>
                        <td className="p-2 text-gray-300">{Math.round(r.score)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
