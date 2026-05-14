'use client';

import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import StatsSection from '@/components/StatsSection';
import FeaturesSection from '@/components/FeaturesSection';
import PricingSection from '@/components/PricingSection';
import FAQSection from '@/components/FAQSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="bg-[#0f172a]">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <PricingSection />
      <FAQSection />
      <Footer />
    </main>
  );
}
