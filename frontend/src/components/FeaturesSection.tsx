'use client';

import { motion } from 'framer-motion';
import { Mic, PenLine, BookOpen, Headphones, BarChart3, Route } from 'lucide-react';

const features = [
  { icon: Mic, title: 'AI Speaking', desc: 'Speak and get instant feedback on pronunciation, fluency, and grammar with AI evaluation.' },
  { icon: PenLine, title: 'AI Writing', desc: 'Write essays and receive detailed analysis on grammar, vocabulary, and coherence.' },
  { icon: BookOpen, title: 'Mock Reading', desc: 'Practice reading comprehension with authentic CEFR and IELTS passages.' },
  { icon: Headphones, title: 'Mock Listening', desc: 'Train your listening skills with audio exercises and timed tests.' },
  { icon: BarChart3, title: 'Analytics', desc: 'Track your progress with detailed charts, heatmaps, and performance insights.' },
  { icon: Route, title: 'AI Roadmap', desc: 'Get a personalized study plan based on your weak areas and goals.' },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-[#0f172a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Everything You Need to <span className="gradient-text">Succeed</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            AI-powered tools and real mock exams to help you achieve your target CEFR or IELTS score.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="glass-dark rounded-2xl p-6 card-hover group"
            >
              <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <feature.icon size={24} className="text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
