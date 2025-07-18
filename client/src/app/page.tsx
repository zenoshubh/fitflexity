"use client";

import Link from "next/link";
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const HEADER_HEIGHT = 76; // px, matches py-4 + h-16
const FOOTER_HEIGHT = 56; // px, matches py-3 + h-14

const Home = () => {
  return (
    <div
      className="min-h-screen bg-[#F7F7F9] flex flex-col relative"
      style={{
        // Dotted pattern using radial-gradient
        backgroundImage:
          "radial-gradient(circle, #e5e7eb 1.5px, transparent 1.5px), radial-gradient(circle, #e5e7eb 1.5px, transparent 1.5px)",
        backgroundSize: "28px 28px",
        backgroundPosition: "0 0, 14px 14px",
      }}
    >
      {/* Floating Header */}
      <Navbar />

      {/* Hero Section */}
      <main
        className="flex-1 flex flex-col items-center justify-center px-8 py-12 md:py-20 max-w-3xl mx-auto w-full"
        style={{
          paddingTop: `${HEADER_HEIGHT}px`, // header height only
          paddingBottom: `${FOOTER_HEIGHT + 32}px`, // footer height + margin
        }}
      >
        <div className="flex flex-col items-center justify-center gap-8 w-full">
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight tracking-tight mb-2 text-center">
            Fitness &amp;
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-700">
              Health Training
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 max-w-xl mb-4 text-center">
            FitFlexity is your modern, intuitive fitness and nutrition
            companion.
            <br />
            Personalized plans, AI-powered tracking, and a vibrant community—
            trusted by thousands to achieve their health goals.
          </p>
          <Link
            href="/diet/create-diet-plan"
            className="inline-block w-fit bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg px-8 py-3 rounded-full shadow-lg transition"
          >
            Get Started
          </Link>
          <div className="flex gap-8 mt-8 justify-center">
            <div>
              <span className="text-2xl font-bold text-gray-900">3.2k+</span>
              <div className="text-gray-500 text-sm">Happy Users</div>
            </div>
            <div>
              <span className="text-2xl font-bold text-gray-900">350k</span>
              <div className="text-gray-500 text-sm">Workouts Logged</div>
            </div>
            <div>
              <span className="text-2xl font-bold text-gray-900">100+</span>
              <div className="text-gray-500 text-sm">Diet Types</div>
            </div>
          </div>
        </div>
      </main>

      {/* Modern Static Footer */}
      <Footer />
    </div>
  );
};

export default Home;
           