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
import UserSummaryCard from "@/components/UserSummaryCard";

const HEADER_HEIGHT = 76;
const FOOTER_HEIGHT = 56;

const Dashboard = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const [currentWeight, setCurrentWeight] = useState(
    user?.currentWeightInKgs ?? "72 kg");

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      router.replace("/");
    }
  }, [isAuthenticated]);

  if (!isAuthenticated || !user) {
    return <Loader />;
  }

  useEffect(() => {
    setCurrentWeight(user?.currentWeightInKgs);
  }, [user?.currentWeightInKgs]);

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

        <UserSummaryCard currentWeight={typeof currentWeight === "string" ? parseFloat(currentWeight) : currentWeight} />
        {/* Weight Log Section */}
        <WeightLog onWeightLogged={setCurrentWeight} />
        
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
