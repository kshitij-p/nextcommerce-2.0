import { useEffect, useState } from "react";

// Tailwind default breakpoints
const breakpoints = {
  sm: {
    query: "(max-width: 640px)",
  },
  md: {
    query: "(max-width: 768px)",
  },

  lg: {
    query: "(max-width: 1024px)",
  },

  xl: {
    query: "(max-width: 1280px)",
  },

  "2xl": {
    query: "(max-width: 1536px)",
  },
} as const;
type Breakpoint = keyof typeof breakpoints;

export const useMediaQuery = (value: Breakpoint) => {
  const [matches, setMatches] = useState(
    window.matchMedia(breakpoints[value].query).matches,
  );

  useEffect(() => {
    const handler = () => {
      setMatches(window.matchMedia(breakpoints[value].query).matches);
    };
    window.addEventListener("resize", handler);

    return function cleanup() {
      window.removeEventListener("resize", handler);
    };
  }, [setMatches, value]);

  return matches;
};
