'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check, Zap, BookOpen, GraduationCap } from 'lucide-react';

const packages = [
  {
    name: 'Bitta Test',
    price: '15,000',
    currency: "so'm",
    desc: 'Bitta mock testga kirish',
    icon: BookOpen,
    features: [
      '1 ta mock test',
      'AI baholash',
      'Natijalar tahlili',
      'Tushuntirish va feedback',
    ],
  },
  {
    name: '5 ta Test paketi',
    price: '60,000',
    currency: "so'm",
    desc: 'Eng mashhur tanlov',
    popular: true,
    icon: Zap,
    features: [
      '5 ta mock test',
      'AI baholash',
      'Batafsil natijalar tahlili',
      'AI Writing tekshiruvi',
      'AI Speaking tekshiruvi',
      'Progress tracking',
    ],
  },
  {
    name: '15 ta Test paketi',
    price: '150,000',
    currency: "so'm",
    desc: "To'liq tayyorlanish",
    icon: GraduationCap,
    features: [
      '15 ta mock test',
      'Barcha AI xizmatlar',
      'Batafsil natijalar tahlili',
      'Shaxsiy o\'quv reja',
      'Priority support',
      'Leaderboard kirish',
    ],
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-[#0f172a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Bir martalik <span className="gradient-text">to&apos;lov</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Obuna yo&apos;q — faqat kerakli testlarni sotib oling.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((pkg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className={`relative rounded-2xl p-8 ${pkg.popular ? 'glass-dark border-2 border-primary-500' : 'glass-dark'} card-hover`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 gradient-bg px-4 py-1 rounded-full text-sm text-white font-medium">
                  Eng mashhur
                </div>
              )}
              <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center mb-4">
                <pkg.icon size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{pkg.name}</h3>
              <p className="text-gray-400 mb-6">{pkg.desc}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{pkg.price}</span>
                <span className="text-gray-400 ml-1">{pkg.currency}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {pkg.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2 text-gray-300">
                    <Check size={18} className="text-primary-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`block text-center py-3 rounded-full font-semibold transition ${pkg.popular ? 'gradient-bg hover:gradient-bg-hover text-white' : 'glass text-white hover:bg-white/10'}`}
              >
                Sotib olish
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
