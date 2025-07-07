"use client";

import { useAuth } from "@/hooks/useAuth";
import React from "react";

const Login = () => {
  const { login, isAuthenticated } = useAuth();

  // If authenticated, show message (let user manually navigate or add redirect button)
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Already Logged In</h1>
          <p className="text-gray-600 mb-6">You are already authenticated.</p>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">AI Fitness App</h1>
        <p className="text-gray-600 text-center mb-6">
          Welcome! Please sign in with your Google account to continue.
        </p>
        <button
          onClick={login}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200"
        >
          Login with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
