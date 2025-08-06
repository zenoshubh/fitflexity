import Link from "next/link";
import { Dumbbell, HeartPulse, Sparkles } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative bg-[#fffefc] py-8 px-2 overflow-hidden mt-[104px]">
      {/* Decorative shapes/icons in background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <Dumbbell
          className="absolute left-2 top-8 opacity-10 text-orange-500 hidden sm:block"
          size={40}
        />
        <HeartPulse
          className="absolute right-4 top-16 opacity-10 text-orange-500 hidden sm:block"
          size={32}
        />
        <Sparkles
          className="absolute left-1/2 top-2 opacity-20 text-orange-500"
          size={18}
        />
        <Sparkles
          className="absolute right-2 bottom-2 opacity-20 text-orange-500"
          size={18}
        />
      </div>
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-2xl mx-auto px-2 sm:px-4">
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
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6 w-full">
          <Link
            href="/diet/create-diet-plan"
            className="px-5 py-2 sm:px-6 sm:py-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-base shadow-lg transition w-full sm:w-auto"
          >
            Start for Free
          </Link>
          <Link
            href="/workout/create-workout-plan"
            className="px-5 py-2 sm:px-6 sm:py-2 rounded-full bg-white border-2 border-orange-500 text-orange-500 font-semibold text-base shadow-lg hover:bg-orange-50 transition w-full sm:w-auto"
          >
            Explore Features
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;



