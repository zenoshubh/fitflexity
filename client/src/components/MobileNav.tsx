"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Salad,
  Dumbbell,
  Bot,
  User,
  LogOut,
  LogIn,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Loader from "./Loader";

const NAV_LINKS = [
  {
    href: "/",
    label: "Home",
    icon: Home,
  },
  {
    href: "/diet",
    label: "Diet",
    icon: Salad,
  },
  {
    href: "/workout",
    label: "Workout",
    icon: Dumbbell,
  },
  {
    href: "/coach",
    label: "Coach",
    icon: Bot,
  }
];

function MobileNav() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleNavigation = (route: string) => {
    if (route === pathname) return;
    setLoading(true);
    router.push(route);
  };

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

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
    <>
      {loading && <Loader />}
      <div className="md:hidden bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-yellow-400/10 z-1000">
        <div className="flex items-center justify-around py-2 px-2">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => handleNavigation(link.href)}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 transition rounded-lg ${
                  active ? "bg-[#111315] font-bold" : "hover:bg-[#111315]"
                }`}
              >
                <Icon
                  size={24}
                  strokeWidth={2.2}
                  className={`mb-0.5 transition-colors ${
                    active
                      ? "text-[#fffefc]"
                      : "text-[#b6b6b6] hover:text-orange-50"
                  }`}
                />
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    active
                      ? "text-[#fffefc] font-bold"
                      : "text-[#b6b6b6] hover:text-orange-50"
                  }`}
                >
                  {link.label}
                </span>
              </Link>
            );
          })}
          <div ref={dropdownRef} className="relative flex items-center">
            {isAuthenticated && user ? (
              <>
                <button
                  className="w-8 h-8 rounded-full border-2 border-[#232834] flex items-center justify-center overflow-hidden bg-[#232834] shadow focus:outline-none"
                  onClick={() => setDropdownOpen((v) => !v)}
                  aria-label="User menu"
                >
                  <span className="text-[#fffefc] font-bold text-sm">
                    {user?.firstName ? user.firstName[0] : "U"}
                  </span>
                </button>
                {dropdownOpen && (
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-40 animate-fade-in">
                    <Link
                      href="/user/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-orange-50 transition text-left"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User size={16} /> Manage Profile
                    </Link>
                    <button
                      className="flex items-center gap-2 px-4 py-2 text-left text-red-600 hover:bg-orange-50 transition w-full"
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                      }}
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                className="w-8 h-8 flex flex-col items-center justify-center bg-[#232834] hover:bg-[#232834]/80 text-[#fffefc] font-semibold rounded-full transition shadow"
                onClick={login}
              >
                <LogIn size={18} />
                <span className="text-[8px] font-medium">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default MobileNav;
       