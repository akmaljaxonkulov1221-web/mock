'use client';

import { motion } from 'framer-motion';
import { Mic, PenLine, BookOpen, Headphones, BarChart3, Route, GraduationCap } from 'lucide-react';

const features = [
  { icon: Mic, title: 'AI Speaking', desc: 'Talaffuz, ravonlik va grammatikani AI baholashi bilan gapiring va tezkor fikr-mulohaza oling.' },
  { icon: PenLine, title: 'AI Writing', desc: 'Insho yozing va grammatika, lug\'at va izchillik bo\'yicha batafsil tahlil oling.' },
  { icon: BookOpen, title: 'Mock Reading', desc: 'CEFR va IELTS o\'qish tushunish mashqlari bilan mashq qiling.' },
  { icon: Headphones, title: 'Mock Listening', desc: 'Audio mashqlar va vaqt belgilangan testlar bilan tinglash qobiliyatini rivojlantiring.' },
  { icon: BarChart3, title: 'Analitika', desc: 'Batafsil grafiklar va natijalar tahlili bilan rivojlanishingizni kuzating.' },
  { icon: GraduationCap, title: 'Universal Testlar', desc: 'IELTS, CEFR, DTM va boshqa fanlar bo\'yicha mock testlar. Matematika, Tarix, Fizika va h.k.' },
  { icon: Route, title: 'AI Roadmap', desc: 'Zaif tomonlaringiz asosida shaxsiy o\'quv rejasini oling.' },
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
            Muvaffaqiyat uchun <span className="gradient-text">kerakli vositalar</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            AI bilan mock imtihonlar va testlar — CEFR, IELTS, DTM va boshqa fanlar bo&apos;yicha tayyorlaning.
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
