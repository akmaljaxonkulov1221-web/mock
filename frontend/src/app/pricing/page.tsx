'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PricingSection from '@/components/PricingSection';
import FAQSection from '@/components/FAQSection';

export default function PricingPage() {
  return (
    <main className="bg-[#0f172a]">
      <Navbar />
      <div className="pt-24">
        <PricingSection />
        <FAQSection />
      </div>
      <Footer />
    </main>
  );
}
