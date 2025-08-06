"use client";

import React from "react";
import Footer from "@/components/Footer";
import HomeNavbar from "@/components/HomeNavbar";
import HeroSection from "@/components/HeroSection";

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
