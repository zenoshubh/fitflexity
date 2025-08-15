"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
  MapPin,
} from "lucide-react";
import Link from "next/link";

const socialLinks = [
  {
    name: "github",
    icon: Github,
    url: "https://github.com/zenoshubh",
  },
  {
    name: "twitter",
    icon: Twitter,
    url: "https://x.com/zenoshubh",
  },
  {
    name: "linkedin",
    icon: Linkedin,
    url: "https://linkedin.com/in/zenoshubh",
  }
];

const quickLinks = [
  { label: "Home", route: "/" },
  { label: "Privacy Policy", route: "/privacy-policy" },
  { label: "Terms of Service", route: "/terms-of-service" },
];

const Footer = () => {
  return (
    <footer className="bg-[#fffefc] text-[#232834] border-t border-orange-100 pt-12 pb-6">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <Link
              href="/"
              className="text-2xl font-black bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent cursor-pointer"
            >
              FitFlexity
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed">
              Your personal fitness companion. Build, track, and achieve your health goals with smart diet and workout plans.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="space-y-4"
          >
            <h4 className="text-lg font-semibold text-orange-500">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <Link
                  href={link.route}
                  key={link.label}
                  className="text-gray-500 hover:text-orange-500 transition-colors duration-200 flex items-center space-x-2 group cursor-pointer"
                >
                  <span className="w-1 h-1 bg-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="space-y-4"
          >
            <h4 className="text-lg font-semibold text-orange-500">
              Contact Us
            </h4>
            <ul className="space-y-3">
              <li
                className="flex items-center space-x-3 text-gray-500 hover:text-orange-500 transition-colors cursor-pointer"
                onClick={() =>
                  (window.location.href = "mailto:zenoshubh@gmail.com")
                }
              >
                <Mail className="h-4 w-4" />
                <span>zenoshubh@gmail.com</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-500 hover:text-orange-500 transition-colors">
                <MapPin className="h-4 w-4" />
                <span>India</span>
              </li>
            </ul>
          </motion.div>

          {/* Social Media */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="space-y-4"
          >
            <h4 className="text-lg font-semibold text-orange-500">
              Follow Us
            </h4>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-[#fffefc]/70 backdrop-blur-sm rounded-lg text-gray-500 hover:text-orange-500 hover:bg-orange-50 transition-all duration-200 border border-orange-100 cursor-pointer"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-orange-100 mt-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} FitFlexity. All rights reserved.
            </p>
            <div className="hidden md:flex space-x-6">
              {["/terms-of-service", "/privacy-policy"].map((route) => (
                <Link
                  href={route}
                  key={route}
                  className="text-sm text-gray-400 hover:text-orange-500 transition-colors cursor-pointer"
                >
                  {route === "/terms-of-service"
                    ? "Terms of Service"
                    : "Privacy Policy"}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
