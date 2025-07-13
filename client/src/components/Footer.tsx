import React from "react";

const Footer = () => {
  return (
    <footer className="w-full py-6 bg-white text-center text-gray-400 text-sm">
      &copy; {new Date().getFullYear()} FitFlexity. All rights reserved.
    </footer>
  );
};

export default Footer;
