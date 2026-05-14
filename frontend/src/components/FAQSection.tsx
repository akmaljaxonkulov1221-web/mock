'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  { q: 'What is MockCEFR?', a: 'MockCEFR is an AI-powered mock exam platform for CEFR and IELTS preparation. It offers speaking, writing, reading, and listening practice with intelligent feedback.' },
  { q: 'Is this an official certification?', a: 'No, MockCEFR is NOT an official certification platform. It is a practice and preparation tool to help you improve your English skills.' },
  { q: 'How does AI evaluation work?', a: 'Our AI analyzes your speaking (pronunciation, fluency, grammar) and writing (vocabulary, coherence, grammar) to provide instant feedback and CEFR level estimates.' },
  { q: 'Can I use it for IELTS preparation?', a: 'Yes! We offer mock IELTS exams and AI-powered practice for all sections: Reading, Listening, Writing, and Speaking.' },
  { q: 'Is there a free plan?', a: 'Yes, we offer a free plan with 3 mock exams and limited AI evaluations. Upgrade to Pro for unlimited access.' },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              viewport={{ once: true }}
              className="glass-dark rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full px-6 py-4 flex items-center justify-between text-left text-white font-medium hover:bg-white/5 transition"
              >
                {faq.q}
                <ChevronDown size={20} className={`transition ${openIndex === i ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 pb-4"
                  >
                    <p className="text-gray-400">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
