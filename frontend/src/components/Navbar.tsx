'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Menu, X, ChevronDown, LogOut, User, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { settings, fetchSettings } = useSettingsStore();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdown, setDropdown] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDashboardLink = () => {
    switch (user?.role) {
      case 'TEACHER': return '/teacher';
      case 'CENTER_ADMIN': return '/dashboard';
      case 'SUPER_ADMIN': return '/admin';
      default: return '/dashboard';
    }
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'glass-dark shadow-lg' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            {settings.siteLogo ? (
              <img src={settings.siteLogo} alt={settings.siteName} className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">{settings.siteName.charAt(0)}</span>
              </div>
            )}
            <span className="text-xl font-bold">
              <span className="gradient-text">{settings.siteName}</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-300 hover:text-white transition">Home</Link>
            <Link href="/#features" className="text-gray-300 hover:text-white transition">Features</Link>
            <Link href="/#pricing" className="text-gray-300 hover:text-white transition">Pricing</Link>
            <Link href="/#faq" className="text-gray-300 hover:text-white transition">FAQ</Link>
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setDropdown(!dropdown)}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition"
                >
                  <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span>{user?.name}</span>
                  <ChevronDown size={16} />
                </button>
                <AnimatePresence>
                  {dropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 glass-dark rounded-xl shadow-xl border border-gray-700 py-2"
                    >
                      <Link href={getDashboardLink()} className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 transition" onClick={() => setDropdown(false)}>
                        <LayoutDashboard size={16} /> Dashboard
                      </Link>
                      <Link href="/dashboard/profile" className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 transition" onClick={() => setDropdown(false)}>
                        <User size={16} /> Profile
                      </Link>
                      <button onClick={() => { setDropdown(false); logout(); }} className="flex items-center gap-2 w-full px-4 py-2 text-red-400 hover:bg-white/5 transition">
                        <LogOut size={16} /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-gray-300 hover:text-white transition">Login</Link>
                <Link href="/register" className="px-5 py-2 gradient-bg rounded-full text-white font-medium hover:gradient-bg-hover transition">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-dark"
          >
            <div className="px-4 py-4 space-y-3">
              <Link href="/" className="block text-gray-300 hover:text-white" onClick={() => setIsOpen(false)}>Home</Link>
              <Link href="/#features" className="block text-gray-300 hover:text-white" onClick={() => setIsOpen(false)}>Features</Link>
              <Link href="/#pricing" className="block text-gray-300 hover:text-white" onClick={() => setIsOpen(false)}>Pricing</Link>
              <Link href="/#faq" className="block text-gray-300 hover:text-white" onClick={() => setIsOpen(false)}>FAQ</Link>
              {isAuthenticated ? (
                <>
                  <Link href={getDashboardLink()} className="block text-gray-300 hover:text-white" onClick={() => setIsOpen(false)}>Dashboard</Link>
                  <button onClick={() => { setIsOpen(false); logout(); }} className="block text-red-400">Logout</button>
                </>
              ) : (
                <div className="flex gap-4 pt-2">
                  <Link href="/login" className="text-gray-300 hover:text-white" onClick={() => setIsOpen(false)}>Login</Link>
                  <Link href="/register" className="gradient-bg px-4 py-2 rounded-full text-white" onClick={() => setIsOpen(false)}>Get Started</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
