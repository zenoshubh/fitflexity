import React from "react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Updated FAQ content based on projectOV.notes.txt
const faqs = [
  {
    question: "How does Fitflexity personalize my diet and workout plans?",
    answer:
      "Fitflexity uses AI to generate fully personalized meal and exercise plans based on your fitness goals, dietary preferences, and activity level. Your plan is balanced, practical, and aligned with your target timeline.",
  },
  {
    question: "Can I edit my plan if I dislike a meal or workout?",
    answer:
      "Yes! Simply click Edit, describe your preferences in plain language, and the AI will instantly update your plan without disrupting the rest of it.",
  },
  {
    question: "How does progress tracking work?",
    answer:
      "Log your weight daily and track your journey toward your target. If your progress deviates from your goal, the AI will regenerate updated plans while keeping your existing preferences intact.",
  },
  {
    question: "Will my plans adjust as I progress?",
    answer:
      "Absolutely. Your plans, activity recommendations, and targets are continuously optimized based on your weight trends and performance.",
  },
  {
    question: "Can I ask questions about my current diet or workout?",
    answer:
      "Yes! You can ask anything about your current diet or workout—recipes, exercise form, healthy alternatives, nutrition facts—and get precise, contextual answers.",
  },
  {
    question: "What is Flexity and how does it help me?",
    answer:
      "Flexity is your conversational fitness coach powered by Agentic-RAG. It has access to your personal details, nutrition data, activity levels, and current fitness plans, providing deeply personalized, data-backed answers for your fitness and nutrition queries.",
  },
  {
    question: "Is my data secure and private?",
    answer:
      "Yes. Your data is owned and controlled by you. Fitflexity uses industry-standard encryption and does not permanently store sensitive information. Your privacy and security are a top priority.",
  },
];

const FAQSection = () => {
  return (
    <section className="py-20 bg-[#fffefc] relative overflow-hidden">
      {/* Decorative shapes/icons in background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Use similar icons/colors as HeroSection if desired */}
        {/* ...you can add Dumbbell, HeartPulse, Sparkles here if you want... */}
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-orange-500">
            Everything you need to know about Fitflexity
          </p>
        </motion.div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.1, delay: index * 0.05 }}
            >
              <AccordionItem
                value={`item-${index}`}
                className="bg-gradient-to-br from-[#fffefc]/80 to-[#fff7ed]/50 border-orange-400/10 rounded-lg px-4"
              >
                <AccordionTrigger className="text-orange-500 hover:text-orange-600 hover:no-underline font-semibold text-base sm:text-lg">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-sm sm:text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
