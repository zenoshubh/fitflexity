"use client";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import withAuth from "@/components/withAuth";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FaDumbbell, FaAppleAlt, FaHeartbeat, FaFireAlt } from "react-icons/fa";
import { MdOutlineEmojiEvents } from "react-icons/md";
import axios from "axios";
import api from "@/lib/api";
import WeightLog from "@/components/WeightLog";

const HEADER_HEIGHT = 76;
const FOOTER_HEIGHT = 56;

const fitnessFacts = [
  {
    icon: <FaDumbbell className="text-orange-500 text-2xl" />,
    title: "Strength",
    fact: "Muscle burns more calories at rest than fat.",
  },
  {
    icon: <FaAppleAlt className="text-green-500 text-2xl" />,
    title: "Nutrition",
    fact: "Eating enough protein helps with muscle recovery.",
  },
  {
    icon: <FaHeartbeat className="text-pink-500 text-2xl" />,
    title: "Heart Health",
    fact: "30 min of daily activity reduces heart disease risk.",
  },
  {
    icon: <FaFireAlt className="text-red-500 text-2xl" />,
    title: "Metabolism",
    fact: "HIIT workouts can boost your metabolism for hours.",
  },
  {
    icon: <MdOutlineEmojiEvents className="text-yellow-500 text-2xl" />,
    title: "Consistency",
    fact: "Small, consistent habits lead to big results.",
  },
];

const Dashboard = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      router.replace("/");
    }
  }, [isAuthenticated]);

  if (!isAuthenticated || !user) {
    return <Loader />;
  }

  // Placeholder data for weight and goals (replace with real user data)
  const currentWeight = user.weightInKgs ?? "72 kg";
  const goals = [
    { label: "Lose 5 kg", progress: 40 },
    { label: "Run 5K", progress: 70 },
  ];

  return (
    <div
      className="min-h-screen flex flex-col relative bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#f7f7f9]"
      style={{
        backgroundImage:
          "radial-gradient(circle, #e5e7eb 1.5px, transparent 1.5px), radial-gradient(circle, #e5e7eb 1.5px, transparent 1.5px)",
        backgroundSize: "28px 28px",
        backgroundPosition: "0 0, 14px 14px",
      }}
    >
      <Navbar />
      <main
        className="flex-1 flex flex-col items-center justify-start px-4 py-8 md:py-16 max-w-7xl mx-auto w-full"
        style={{
          paddingTop: `${HEADER_HEIGHT}px`,
          paddingBottom: `${FOOTER_HEIGHT + 32}px`,
        }}
      >
        {/* User Summary Card */}
        <div className="w-full max-w-3xl bg-white/70 backdrop-blur-2xl border border-gray-200 rounded-3xl shadow-2xl p-8 flex flex-col md:flex-row items-center gap-8 mb-10 mt-4 glassmorphism">
          <div className="flex flex-col items-center md:items-start gap-3 flex-1">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-400 to-pink-400 flex items-center justify-center shadow-lg mb-2">
              <span className="text-4xl font-bold text-white">
                {user.firstName?.[0] ?? "U"}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 text-center md:text-left">
              Welcome, {user.firstName}!
            </h1>
            <div className="text-gray-500 text-base md:text-lg text-center md:text-left">
              <div>
                <span className="font-medium text-gray-700">{user.email}</span>
              </div>
              <div>
                Provider:{" "}
                <span className="font-medium text-gray-700">Google</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-6 flex-1 w-full">
            <div className="flex flex-row gap-6 justify-center md:justify-end">
              {/* Current Weight */}
              <div className="bg-white/80 border border-gray-100 rounded-2xl px-6 py-4 flex flex-col items-center shadow-md glassmorphism">
                <span className="text-xs text-gray-500">Current Weight</span>
                <span className="text-2xl font-bold text-orange-500">
                  {currentWeight}
                </span>
              </div>
              {/* Goals */}
              <div className="bg-white/80 border border-gray-100 rounded-2xl px-6 py-4 flex flex-col items-center shadow-md glassmorphism min-w-[120px]">
                <span className="text-xs text-gray-500">Goals</span>
                <div className="flex flex-col gap-2 mt-1 w-full">
                  {goals.map((goal, idx) => (
                    <div key={idx} className="w-full">
                      <span className="text-sm font-semibold text-gray-700">
                        {goal.label}
                      </span>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-gradient-to-r from-orange-400 to-pink-400 h-2 rounded-full transition-all"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-3xl flex flex-col md:flex-row gap-4 mb-10">
          <Button
            asChild
            className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold text-lg px-8 py-4 rounded-2xl shadow-lg transition"
          >
            <Link href="/diet/create-diet-plan">Create Diet Plan</Link>
          </Button>
          <Button
            asChild
            className="flex-1 bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-white font-semibold text-lg px-8 py-4 rounded-2xl shadow-lg transition"
          >
            <Link href="/create-workout-plan">Create Workout Plan</Link>
          </Button>
        </div>

        {/* Weight Log Section */}
        <WeightLog />

        {/* Fitness Facts Carousel */}
        <div className="w-full max-w-5xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 ml-2">
            Fitness & Health Facts
          </h2>
          <div className="flex gap-6 overflow-x-auto pb-2 hide-scrollbar">
            {fitnessFacts.map((fact, idx) => (
              <div
                key={idx}
                className="min-w-[260px] bg-white/80 border border-gray-100 rounded-2xl p-6 flex flex-col items-center shadow-md glassmorphism"
                style={{
                  backdropFilter: "blur(8px)",
                }}
              >
                <div className="mb-2">{fact.icon}</div>
                <div className="font-semibold text-gray-700 mb-1">
                  {fact.title}
                </div>
                <div className="text-gray-500 text-sm text-center">
                  {fact.fact}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
      <style jsx global>{`
        .glassmorphism {
          background: rgba(255, 255, 255, 0.7);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
          backdrop-filter: blur(12px);
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default withAuth(Dashboard);
