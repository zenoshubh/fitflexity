"use client";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import withAuth from "@/components/withAuth";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const HEADER_HEIGHT = 76;
const FOOTER_HEIGHT = 56;

const Dashboard = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      router.replace("/login");
    }
  }, [isAuthenticated]);

  if (!isAuthenticated || !user) {
    return <Loader />;
  }

  return (
    <div
      className="min-h-screen flex flex-col relative bg-[#F7F7F9]"
      style={{
        backgroundImage:
          "radial-gradient(circle, #e5e7eb 1.5px, transparent 1.5px), radial-gradient(circle, #e5e7eb 1.5px, transparent 1.5px)",
        backgroundSize: "28px 28px",
        backgroundPosition: "0 0, 14px 14px",
      }}
    >
      <Navbar />
      <main
        className="flex-1 flex flex-col items-center justify-center px-8 py-12 md:py-20 max-w-7xl mx-auto w-full"
        style={{
          paddingTop: `${HEADER_HEIGHT}px`,
          paddingBottom: `${FOOTER_HEIGHT + 32}px`,
        }}
      >
        <div className="w-full max-w-xl bg-white/80 backdrop-blur-lg border border-gray-200 rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2 text-center">
            Welcome, {user.firstName}!
          </h1>
          <div className="text-gray-500 text-lg text-center mb-4">
            <div>
              Email:{" "}
              <span className="font-medium text-gray-700">{user.email}</span>
            </div>
            <div>
              Provider:{" "}
              <span className="font-medium text-gray-700">
                {"Google"}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-4 w-full">
            <Button
              asChild
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg px-8 py-3 rounded-full shadow-lg transition"
            >
              <Link href="/create-diet-plan">Create Diet Plan</Link>
            </Button>
            <Button
              asChild
              className="w-full bg-orange-400 hover:bg-orange-500 text-white font-semibold text-lg px-8 py-3 rounded-full shadow-lg transition"
            >
              <Link href="/create-workout-plan">Create Workout Plan</Link>
            </Button>
            <Button
              onClick={logout}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-lg px-8 py-3 rounded-full shadow transition"
            >
              Logout
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default withAuth(Dashboard);
