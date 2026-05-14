'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '0',
    desc: 'Perfect for getting started',
    features: ['3 Mock Exams', 'Basic Analytics', 'AI Writing (2x)', 'AI Speaking (2x)', 'Progress Tracking'],
  },
  {
    name: 'Pro',
    price: '29',
    desc: 'For serious learners',
    popular: true,
    features: ['Unlimited Mock Exams', 'Advanced Analytics', 'Unlimited AI Writing', 'Unlimited AI Speaking', 'AI Roadmap', 'Personalized Study Plan', 'Priority Support'],
  },
  {
    name: 'Enterprise',
    price: '99',
    desc: 'For learning centers',
    features: ['Everything in Pro', 'Teacher Panel', 'Student Management', 'Center Analytics', 'Custom Exams', 'API Access', 'Dedicated Support'],
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
            Simple <span className="gradient-text">Pricing</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Choose the plan that fits your needs. Upgrade anytime.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className={`relative rounded-2xl p-8 ${plan.popular ? 'glass-dark border-2 border-primary-500' : 'glass-dark'} card-hover`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 gradient-bg px-4 py-1 rounded-full text-sm text-white font-medium">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
              <p className="text-gray-400 mb-6">{plan.desc}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">${plan.price}</span>
                <span className="text-gray-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2 text-gray-300">
                    <Check size={18} className="text-primary-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`block text-center py-3 rounded-full font-semibold transition ${plan.popular ? 'gradient-bg hover:gradient-bg-hover text-white' : 'glass text-white hover:bg-white/10'}`}
              >
                Get Started
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
