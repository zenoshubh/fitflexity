"use client";

import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

const HEADER_HEIGHT = 76; // px, matches py-4 + h-16

const Navbar = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  return (
    <header
      className="fixed top-0 left-0 z-30 w-full h-16 flex items-center justify-between px-8 py-4 bg-white/70 backdrop-blur-lg border-b border-gray-200 transition-all"
      style={{ height: HEADER_HEIGHT }}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-orange-400 to-orange-600 flex items-center justify-center">
          <span className="text-white font-bold text-lg">F</span>
        </div>
        <span className="font-semibold text-xl text-gray-800 tracking-tight">
          FitFlexity
        </span>
      </div>
      <nav className="hidden md:flex gap-6">
        <Link
          href="/"
          className="text-gray-600 hover:text-orange-600 transition"
        >
          Home
        </Link>
        <Link
          href="/create-diet-plan"
          className="text-gray-600 hover:text-orange-600 transition"
        >
          Create Diet Plan
        </Link>
        <Link
          href="/view-diet-plan"
          className="text-gray-600 hover:text-orange-600 transition"
        >
          View Diet Plan
        </Link>
      </nav>
      <div className="flex items-center gap-4" ref={dropdownRef}>
        {isAuthenticated && user ? (
          <>
            <button
              className="w-10 h-10 rounded-full border-2 border-orange-200 flex items-center justify-center overflow-hidden bg-orange-50 shadow focus:outline-none"
              onClick={() => setDropdownOpen((v) => !v)}
              aria-label="User menu"
            >
              <span className="text-orange-600 font-bold text-lg">
                {user?.firstName ? user.firstName[0] : "U"}
              </span>
            </button>
            {dropdownOpen && (
              <div className="absolute right-8 top-16 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-3 z-40 animate-fade-in">
                <div className="flex flex-col">
                  <Link
                    href="/dashboard"
                    className="px-5 py-2 text-gray-700 hover:bg-orange-50 transition text-left"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Manage Profile
                  </Link>
                  <button
                    className="px-5 py-2 text-left text-red-600 hover:bg-orange-50 transition"
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <button
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2 rounded-full transition"
            onClick={login}
          >
            Sign In with Google
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;

