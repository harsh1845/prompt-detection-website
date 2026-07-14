export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const marqueeTransition = {
  duration: 35,
  ease: "linear" as const,
  repeat: Infinity,
};

export function floatVariant(duration: number, delay: number) {
  return {
    y: [0, -8, 0, 6, 0],
    transition: {
      duration,
      delay,
      ease: "easeInOut" as const,
      repeat: Infinity,
    },
  };
}
