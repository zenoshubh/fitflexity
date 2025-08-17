import React from "react";
import Image from "next/image";

const dietImg = "/DietHero.png";
const workoutImg = "/WorkoutHero.png";
const flexityImg = "/FlexityHero.png";

const features = {
  diet: {
    short: "Personalized meal plans, instant edits, and adaptive updates.",
    full: "Get fully personalized, AI-generated meal plans tailored to your goals, preferences, and lifestyle. Instantly edit any meal with natural language, track your progress, and receive adaptive updates. Ask for recipes, nutrition facts, and healthy alternatives anytime.",
  },
  workout: {
    short: "Custom routines, easy edits, and progress tracking.",
    full: "Receive custom workout routines designed for your unique goals and fitness level. Effortlessly edit exercises and routines, track your progress, and enjoy adaptive workout plans. Get expert guidance on form, alternatives, and more whenever you need.",
  },
  flexity: {
    short: "Your AI fitness coach for instant, personalized answers.",
    full: "Flexity is your conversational fitness coach powered by AI. It knows your goals, plans, and progress, and answers any question about your fitness journey with deeply personalized, data-backed insights. Always available, always relevant.",
  },
};

const sections = [
  {
    key: "diet",
    title: "Personalized Diet Planning",
    graphic: (
      <Image
        src={dietImg}
        alt="Diet Plan"
        width={300}
        height={300}
        className="object-contain"
        draggable={false}
        priority
      />
    ),
    description: features.diet,
    bg: "from-orange-100 to-orange-50",
  },
  {
    key: "workout",
    title: "Custom Workout Routines",
    graphic: (
      <Image
        src={workoutImg}
        alt="Workout Activities"
        width={300}
        height={300}
        className="object-contain"
        draggable={false}
        priority
      />
    ),
    description: features.workout,
    bg: "from-orange-200 to-orange-100",
  },
  {
    key: "flexity",
    title: "Flexity: Your AI Fitness Coach",
    graphic: (
      <Image
        src={flexityImg}
        alt="Flexity AI Coach"
        width={300}
        height={300}
        className="object-contain"
        draggable={false}
        priority
      />
    ),
    description: features.flexity,
    bg: "from-orange-300 to-orange-100",
  },
];

const FeatureHero = ({
  title,
  graphic,
  description,
  bg,
  index,
}: {
  title: string;
  graphic: React.ReactNode;
  description: { short: string; full: string };
  bg: string;
  index: number;
}) => {
  // Section 0: image left, text right; 1: image right, text left; 2: image left, text right
  const isReverse = index === 1;
  return (
    <section className="relative bg-[#fffefc] py-8 px-2 sm:py-10 sm:px-4 overflow-hidden">
      <div
        className="relative z-10 max-w-[90vw] mx-auto flex flex-col md:flex-row items-center gap-8"
        style={{
          display: "flex",
          flexDirection: isReverse ? "row-reverse" : "row",
        }}
      >
        <div className="w-full flex flex-col md:flex-row items-center justify-between md:items-center">
          {/* Image Section */}
          <div className="w-full md:w-1/2 flex justify-center items-center mb-4 md:mb-0">
            <div className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] md:w-[300px] md:h-[300px] flex items-center justify-center">
              {graphic}
            </div>
          </div>
          {/* Text Section */}
          <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left justify-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-orange-500 mb-3 leading-tight">
              {title}
            </h2>
            <p className="text-gray-500 text-sm sm:hidden leading-relaxed">
              {description.short}
            </p>
            <p className="text-gray-500 pr-25 text-base md:text-lg leading-relaxed hidden sm:block">
              {description.full}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureSection = () => {
  return (
    <>
      {sections.map((section, idx) => (
        <FeatureHero
          key={section.key}
          title={section.title}
          graphic={section.graphic}
          description={section.description}
          bg={section.bg}
          index={idx}
        />
      ))}
    </>
  );
};

export default FeatureSection;
        