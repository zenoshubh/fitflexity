"use client";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import withAuth from "@/components/withAuth";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const Dashboard = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      router.replace("/login");
    }
  }, [isAuthenticated]);

  return !isAuthenticated || !user ? (
    <Loader />
  ) : (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">
            Welcome, {user.firstName}!
          </h2>
          <p className="text-gray-600">Email: {user.email}</p>
          <p className="text-gray-600">Provider: {user.firstName}</p>
        </div>

        <Button
          asChild
          className="cursor-pointer w-full bg-green-500 hover:bg-green-600 text-white font-bold mb-2 py-2 px-4 rounded"
        >
          <Link href="/create-diet-plan">Create Diet Plan</Link>
        </Button>
        <Button
          asChild
          className="cursor-pointer w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold mb-2 py-2 px-4 rounded"
        >
          <Link href="/create-workout-plan">Create Workout Plan</Link>
        </Button>

        <Button
          onClick={logout}
          className="cursor-pointer w-full bg-red-500 hover:bg-red-600 text-white font-bold mb-2 py-2 px-4 rounded"
        >
          Logout
        </Button>
      </div>
    </div>
  );
};

export default withAuth(Dashboard);
