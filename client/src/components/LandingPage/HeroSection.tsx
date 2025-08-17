import Link from "next/link";
import { Dumbbell, HeartPulse, Sparkles } from "lucide-react";
import Image from "next/image";

const HeroSection = () => {
  return (
    <section className="relative bg-[#fffefc] py-8 px-2 overflow-hidden mt-[60px]">
      {/* Decorative shapes/icons in background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* ...existing code... */}
      </div>
      {/* Main Content */}
      <div className="relative z-10 max-w-[90vw] mx-auto px-2 sm:px-4 flex flex-col md:flex-row items-center gap-8">
        {/* Mobile: image above text, Desktop: image right, text left */}
        <div className="w-full flex flex-col-reverse md:flex-row items-center justify-between md:items-center">
          {/* Text Section */}
          <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left justify-center">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight mb-3">
              Advance Your Fitness with{" "}
              <span className="bg-gradient-to-r from-orange-500 to-orange-700 bg-clip-text text-transparent">
                FitFlexity
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-500 mb-6">
              Personalized diet & workout plans, AI-powered tracking, and a vibrant
              community.
              <br className="hidden sm:block" />
              Achieve your health goals with modern tools and real results.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-6 w-full">
              <Link
                href="/user/dashboard"
                className="px-4 py-2 sm:px-6 sm:py-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm sm:text-base shadow-lg transition w-full sm:w-auto"
              >
                Start for Free
              </Link>
              <Link
                href="/workout"
                className="px-4 py-2 sm:px-6 sm:py-2 rounded-full bg-white border-2 border-orange-500 text-orange-500 font-semibold text-sm sm:text-base shadow-lg hover:bg-orange-50 transition w-full sm:w-auto"
              >
                Explore Features
              </Link>
            </div>
          </div>
          {/* Image Section */}
          <div className="w-full md:w-1/2 flex justify-center items-center mb-4 md:mb-0">
            <div className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] md:w-[420px] md:h-[420px] flex items-center justify-center">
              <Image
                src="/HeroImg.png"
                alt="FitFlexity Hero"
                width={700}
                height={700}
                className="object-contain w-full h-full"
                draggable={false}
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;



