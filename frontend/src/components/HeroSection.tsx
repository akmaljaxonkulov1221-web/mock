'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles, Brain, Shield } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0f172a]">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-transparent to-accent-900/20" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark text-sm text-gray-300 mb-8">
            <Sparkles size={16} className="text-primary-400" />
            AI-Powered Mock Exams
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Master Your English with{' '}
            <span className="gradient-text">AI</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Practice CEFR and IELTS exams with AI-powered speaking, writing, reading, and listening evaluations. Get instant feedback and track your progress.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-4 gradient-bg rounded-full text-white font-semibold text-lg hover:gradient-bg-hover transition flex items-center gap-2 group"
            >
              Start Free Trial
              <ArrowRight size={20} className="group-hover:translate-x-1 transition" />
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 glass-dark rounded-full text-gray-300 font-semibold text-lg hover:text-white transition"
            >
              See Features
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
            {[
              { icon: Brain, title: 'AI Analysis', desc: 'Smart evaluation of your speaking and writing skills' },
              { icon: Shield, title: 'Mock Exams', desc: 'Real CEFR and IELTS simulation tests' },
              { icon: Sparkles, title: 'Progress Tracking', desc: 'Detailed analytics and personalized roadmap' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                className="glass-dark rounded-2xl p-6 card-hover"
              >
                <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center mb-4">
                  <item.icon size={24} className="text-white" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
