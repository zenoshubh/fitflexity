"use client";

import React from "react";
import Footer from "@/components/LandingPage/Footer";
import HomeNavbar from "@/components/LandingPage/HomeNavbar";
import HeroSection from "@/components/LandingPage/HeroSection";

const Home = () => {
  return (
    <div className="min-h-screen bg-[#fffefc] flex flex-col relative">
      {/* Floating Header */}
      <HomeNavbar />
      {/* Hero Section */}
      <HeroSection />
      {/* Modern Static Footer */}
      <Footer />
    </div>
  );
};

export default Home;
