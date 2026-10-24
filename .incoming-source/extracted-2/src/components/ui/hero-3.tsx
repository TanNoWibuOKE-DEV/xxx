"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Props interface for the component
export interface AnimatedMarqueeHeroProps {
  tagline: string;
  title: React.ReactNode;
  description: string;
  ctaText?: string;
  images: string[];
  className?: string;
  onCtaClick?: () => void;
  ctaElement?: React.ReactNode;
}

// Reusable Button component styled like in the image with AutoQuest shine & physics
const ActionButton = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="btn-action-top mt-8 px-8 py-3.5 rounded-full text-white font-semibold shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:ring-opacity-75"
    style={{
      background: "linear-gradient(135deg, #5865F2 0%, #4752C4 100%)",
      boxShadow: "0 10px 30px -6px rgba(88, 101, 242, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
      fontSize: "15px",
    }}
  >
    {children}
  </motion.button>
);

// The main hero component
export const AnimatedMarqueeHero: React.FC<AnimatedMarqueeHeroProps> = ({
  tagline,
  title,
  description,
  ctaText = "Get Started",
  images,
  className,
  onCtaClick,
  ctaElement,
}) => {
  // Animation variants for the text content
  const FADE_IN_ANIMATION_VARIANTS = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 100, damping: 20 },
    },
  };

  // Duplicate images for a seamless loop
  const duplicatedImages = [...images, ...images];

  return (
    <section
      className={cn(
        "relative w-full min-h-[92vh] overflow-hidden bg-background flex flex-col items-center justify-center text-center px-4 pt-16 pb-24",
        className
      )}
    >
      {/* Background ambient radial glow */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 900px 500px at 50% 25%, rgba(88, 101, 242, 0.16) 0%, rgba(88, 101, 242, 0.03) 50%, transparent 75%)",
          filter: "blur(60px)",
        }}
      />

      <div className="z-10 flex flex-col items-center max-w-4xl mx-auto">
        {/* Tagline */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={FADE_IN_ANIMATION_VARIANTS}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(88,101,242,0.35)] bg-[rgba(88,101,242,0.12)] px-4 py-1.5 text-xs md:text-sm font-medium text-[#c7cdff] backdrop-blur-md shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-[#5865f2] shadow-[0_0_8px_#5865f2]" />
          {tagline}
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.08,
              },
            },
          }}
          className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.08]"
          style={{ letterSpacing: "-0.03em" }}
        >
          {typeof title === "string" ? (
            title.split(" ").map((word, i) => (
              <motion.span
                key={i}
                variants={FADE_IN_ANIMATION_VARIANTS}
                className="inline-block"
              >
                {word}&nbsp;
              </motion.span>
            ))
          ) : (
            title
          )}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial="hidden"
          animate="show"
          variants={FADE_IN_ANIMATION_VARIANTS}
          transition={{ delay: 0.4 }}
          className="mt-6 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed"
          style={{ color: "#9ca3af" }}
        >
          {description}
        </motion.p>

        {/* Call to Action Button */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={FADE_IN_ANIMATION_VARIANTS}
          transition={{ delay: 0.55 }}
        >
          {ctaElement ? (
            <div className="mt-8">{ctaElement}</div>
          ) : (
            <ActionButton onClick={onCtaClick}>{ctaText}</ActionButton>
          )}
        </motion.div>
      </div>

      {/* Animated Image Marquee */}
      <div
        className="absolute bottom-0 left-0 w-full h-[32%] md:h-[38%] pointer-events-none"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
        }}
      >
        <motion.div
          className="flex gap-5 items-center"
          animate={{
            x: ["-100%", "0%"],
            transition: {
              ease: "linear",
              duration: 38,
              repeat: Infinity,
            },
          }}
          style={{ width: "max-content" }}
        >
          {duplicatedImages.map((src, index) => (
            <div
              key={index}
              className="relative aspect-[3/4] h-40 md:h-56 flex-shrink-0 transition-transform duration-300 hover:scale-105 pointer-events-auto"
              style={{
                transform: `rotate(${index % 2 === 0 ? -2.5 : 4.5}deg)`,
              }}
            >
              <img
                src={src}
                alt={`Showcase image ${index + 1}`}
                className="w-full h-full object-cover rounded-2xl shadow-2xl border border-white/10"
                loading="lazy"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default AnimatedMarqueeHero;
