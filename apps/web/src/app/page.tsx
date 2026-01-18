'use client';

import { Navbar } from '../components/landing/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { ScenariosSection } from '../components/landing/ScenariosSection';
import { PricingSection } from '../components/landing/PricingSection';
import { Footer } from '../components/landing/Footer';
import { ReviewerModal } from '../components/landing/ReviewerModal';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 scroll-smooth">
      <ReviewerModal />
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ScenariosSection />
        <PricingSection />
        <Footer />
      </main>
    </div>
  );
}
