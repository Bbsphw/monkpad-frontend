import SiteHeader from "@/components/site/site-header";
import HeroSection from "@/components/sections/home/hero-section";
import FeatureSection from "@/components/sections/home/feature-section";
import HowItWorks from "@/components/sections/home/how-it-works";
import TestimonialsSection from "@/components/sections/home/testimonials-section";
import CtaSection from "@/components/sections/home/cta-section";
import SiteFooter from "@/components/site/site-footer";

export default function Home() {
  return (
    <>
      {/* Header */}
      <SiteHeader />
      <main>
        {/* Hero Section */}
        <HeroSection />
        {/* feature Content */}
        <FeatureSection />
        {/* How it works */}
        <HowItWorks />
        {/* Testimonials */}
        <TestimonialsSection />
        {/* Call to action */}
        <CtaSection />
      </main>
      {/* Footer */}
      <SiteFooter />
    </>
  );
}
