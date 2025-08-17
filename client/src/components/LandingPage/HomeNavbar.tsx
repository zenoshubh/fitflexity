import Image from "next/image";
import Link from "next/link";
import { Sun, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useRef, useEffect } from "react";

const HomeNavbar = () => {
  const { user, login, logout } = useAuth();
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
    <nav
      className="fixed top-4 left-2 right-2 z-50 flex items-center justify-between px-4 py-3 rounded-xl
        bg-[#fffefc] backdrop-blur-lg shadow-lg
        md:top-6 md:left-6 md:right-6 md:px-8 md:py-4 md:rounded-2xl"
      style={{
        minHeight: 64,
        boxShadow: "0 4px 32px 0 rgba(0,0,0,0.08)",
      }}
    >
      {/* Left: Logo and brand */}
      <div className="flex items-center gap-2 md:gap-3">
        <Image
          src="/logo.png"
          alt="Fitflexity Logo"
          width={36}
          height={36}
          className="w-9 h-9 md:w-11 md:h-11"
        />
        <span className="font-extrabold text-base md:text-xl tracking-tight text-[#232834] uppercase" style={{ letterSpacing: "0.04em" }}>
          Fitflexity
        </span>
      </div>
      {/* Right: Theme toggle and user icon or Get Started */}
      <div className="flex items-center gap-2 md:gap-4 relative">
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-100 flex items-center justify-center focus:outline-none"
              onClick={() => setDropdownOpen((open) => !open)}
              aria-label="User menu"
            >
              <User size={24} className="text-[#232834] md:size-8" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50">
                <Link
                  href="/user/dashboard"
                  className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition font-medium"
                  onClick={() => setDropdownOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition font-medium"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            className="px-4 py-1.5 md:px-6 md:py-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm md:text-base transition"
            onClick={() => {
              if (typeof window !== "undefined") {
                // @ts-ignore
                if (typeof login === "function") login();
              }
            }}
          >
            Get Started
          </button>
        )}
      </div>
    </nav>
  );
};

export default HomeNavbar;
