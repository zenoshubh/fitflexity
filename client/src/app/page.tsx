"use client";

import React from "react";
import Footer from "@/components/LandingPage/Footer";
import HomeNavbar from "@/components/LandingPage/HomeNavbar";
import HeroSection from "@/components/LandingPage/HeroSection";
import FAQSection from "@/components/LandingPage/FAQSection";
import FeatureSection from "@/components/LandingPage/FeatureSection";

const Home = () => {
  return (
    <div className="min-h-screen bg-[#fffefc] flex flex-col relative">
      {/* Floating Header */}
      <HomeNavbar />
      {/* Hero Section */}
      <HeroSection />
      {/* Modern Feature Section */}
      <FeatureSection />
      {/* FAQ Section */}
      <FAQSection />
      {/* Footer Section */}
      <Footer />
    </div>
  );
};

export default Home;
