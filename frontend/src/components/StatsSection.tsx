'use client';

import { motion } from 'framer-motion';
import { Users, Brain, Award, Clock } from 'lucide-react';

const stats = [
  { icon: Users, value: '10,000+', label: 'Faol foydalanuvchilar' },
  { icon: Brain, value: '50,000+', label: 'AI baholashlar' },
  { icon: Award, value: '10+', label: 'Fanlar' },
  { icon: Clock, value: '500+', label: 'Mock testlar' },
];

export default function StatsSection() {
  return (
    <section className="py-16 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-14 h-14 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-4">
                <stat.icon size={28} className="text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
