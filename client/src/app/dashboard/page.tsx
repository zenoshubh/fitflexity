"use client";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import React, { useEffect } from "react";

const Dashboard = () => {
  const { user, isAuthenticated, logout } = useAuth();

  // If not authenticated, show message with login button
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            Please log in to access the dashboard.
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">
            Welcome, {user.firstName}!
          </h2>
          <p className="text-gray-600">Email: {user.email}</p>
          <p className="text-gray-600">Provider: {user.provider}</p>
        </div>
        <button
          onClick={logout}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
