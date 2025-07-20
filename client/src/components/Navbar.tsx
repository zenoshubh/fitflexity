"use client";

import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";
import {
  Home,
  Salad,
  ClipboardList,
  Dumbbell,
  FileText,
  User,
  LogOut,
  LogIn,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/diet/create-diet-plan", label: "Create Diet", icon: Salad },
  { href: "/diet/view-diet-plan", label: "View Diet", icon: ClipboardList },
  { href: "/workout/create-workout-plan", label: "Create Workout", icon: Dumbbell },
  { href: "/workout/view-workout-plan", label: "View Workout", icon: FileText },
];

const Navbar = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

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
    <aside
      className="fixed top-0 left-0 z-30 h-screen w-20 flex flex-col justify-between items-center shadow-xl"
      style={{ background: "#181C23" }} // Use the same dark color as in the image
    >
      {/* Logo */}
      <div className="flex flex-col items-center mt-6 mb-2">
        <div className="w-12 h-12 rounded-lg bg-[#FF7A1A] flex items-center justify-center shadow">
          <span className="text-white font-bold text-2xl">F</span>
        </div>
      </div>
      {/* Nav links */}
      <nav className="flex flex-col gap-2 flex-1 items-center mt-2">
        {NAV_LINKS.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center gap-1 w-full py-3 transition
                ${
                  active
                    ? "bg-[#232834] text-white font-bold rounded-r-2xl w-[88%] ml-2 shadow-lg scale-105"
                    : "text-[#A3A9B7] hover:bg-[#232834] rounded-xl"
                }`}
              style={active ? { boxShadow: "2px 0 16px 0 #23283422" } : {}}
            >
              <Icon size={28} strokeWidth={2.2} className="mb-1" />
              <span className={`text-xs font-medium ${active ? "text-white" : "text-[#A3A9B7]"}`}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>
      {/* User menu */}
      <div className="flex flex-col items-center mb-6" ref={dropdownRef}>
        {isAuthenticated && user ? (
          <div className="relative">
            <button
              className="w-12 h-12 rounded-full border-2 border-[#232834] flex items-center justify-center overflow-hidden bg-[#232834] shadow focus:outline-none"
              onClick={() => setDropdownOpen((v) => !v)}
              aria-label="User menu"
            >
              <span className="text-[#A3A9B7] font-bold text-xl">
                {user?.firstName ? user.firstName[0] : "U"}
              </span>
            </button>
            {dropdownOpen && (
              <div className="absolute left-14 bottom-0 ml-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-3 z-40 animate-fade-in">
                <div className="flex flex-col">
                  <Link
                    href="/user/dashboard"
                    className="flex items-center gap-2 px-5 py-2 text-gray-700 hover:bg-orange-50 transition text-left"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User size={18} /> Manage Profile
                  </Link>
                  <button
                    className="flex items-center gap-2 px-5 py-2 text-left text-red-600 hover:bg-orange-50 transition"
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                    }}
                  >
                    <LogOut size={18} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            className="w-12 h-12 flex flex-col items-center justify-center bg-[#232834] hover:bg-[#232834]/80 text-[#A3A9B7] font-semibold rounded-full transition shadow"
            onClick={login}
          >
            <LogIn size={26} />
            <span className="text-[10px] font-medium mt-1">Sign In</span>
          </button>
        )}
      </div>
    </aside>
  );
};

export default Navbar;
