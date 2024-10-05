"use client";

import { useRef, useSyncExternalStore } from "react";
import { Image } from "~/components/ui/image";
import {
  motion,
  type SpringOptions,
  useScroll,
  type UseScrollOptions,
  useSpring,
  useTransform,
} from "framer-motion";
import Link from "next/link";

const subscribeToScrollChange = (onChange: () => void) => {
  window.addEventListener("scroll", onChange);
  return () => window.removeEventListener("scroll", onChange);
};

const subscribeToResize = (onChange: () => void) => {
  window.addEventListener("resize", onChange);
  return () => window.addEventListener("resize", onChange);
};

const initialBottom = 80;
const targetBottom = 20;

const targetFontSize = 12;
const initialFontSize = 8;

const HeroSection = () => {
  const screenHeight = useSyncExternalStore(
    subscribeToResize,
    () => window.innerHeight,
    () => 0,
  );

  const scrollPos = useSyncExternalStore(
    subscribeToScrollChange,
    () => {
      return Math.min(+(window.scrollY / (screenHeight / 6)).toFixed(5), 1);
    },
    () => 0,
  );
  const scrollPos2 = useSyncExternalStore(
    subscribeToScrollChange,
    () => {
      return Math.min(+(window.scrollY / (screenHeight / 2)).toFixed(5), 1);
    },
    () => 0,
  );

  return (
    <motion.section
      animate={{
        position: scrollPos2 >= 1 ? "absolute" : "fixed",
        inset: 0,
        top: scrollPos2 >= 1 ? "50vh" : "0",
      }}
      transition={{ duration: 0 }}
    >
      <motion.div
        className="relative"
        // animate={{ translateY: `calc(101vh * ${scrollPos2})` }}
      >
        <motion.span
          className="absolute left-1/2 z-10 -translate-x-1/2 font-thin"
          initial={{ top: `calc(5% + (3% * ${scrollPos}))`, opacity: 0 }}
          animate={{
            opacity: scrollPos2 > 0.1 ? 1 : 0,
            fontSize: `calc(${initialFontSize}vw + (${scrollPos} * ${targetFontSize - initialFontSize}vw))`,
            letterSpacing: `calc(1vw + (${scrollPos} * 4vw))`,
          }}
        >
          ACME
        </motion.span>
        <motion.video
          tabIndex={-1}
          className="h-screen w-full object-cover brightness-75"
          src={"/hero.mp4"}
          autoPlay={true}
          loop
          muted
          style={{
            filter: `blur(calc(${scrollPos2} * 8px)) brightness(calc(100% - (25% * ${scrollPos2})))`,
          }}
        />
        <motion.div
          className="absolute left-1/2 z-10 mb-16 flex w-max -translate-x-1/2 flex-col gap-4"
          initial={{ opacity: 0 }}
          animate={{
            bottom: initialBottom - (initialBottom - targetBottom) * scrollPos,
            opacity: scrollPos2 > 0.4 ? 1 : 0,
          }}
        >
          <span className="text-[max(1.5vw,_16px)] font-semibold italic tracking-wider">
            Acme Summer Collection 2024
          </span>
          <Link
            href="/products"
            passHref
            className="mx-auto inline-flex h-12 max-w-max items-center justify-center rounded-[2px] bg-white px-8 py-2 text-xl text-black transition-all hover:rounded-md"
          >
            <button>Discover More</button>
          </Link>
        </motion.div>
      </motion.div>
    </motion.section>
  );
};

const useScrollYProgressWithSpring = (
  options: UseScrollOptions & SpringOptions,
) => {
  const { scrollYProgress } = useScroll(options);
  return useSpring(scrollYProgress, options);
};

const HomePage = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollYProgress = useScrollYProgressWithSpring({
    target: sectionRef,
    offset: ["25% end", "60% end"],
  });
  const scrollYProgress2 = useScrollYProgressWithSpring({
    target: sectionRef,
    offset: ["60% end", "90% end"],
  });

  const blur1 = useTransform(
    scrollYProgress,
    [0, 1],
    ["blur(10px)", "blur(0px)"],
  );

  const blur2 = useTransform(
    scrollYProgress2,
    [0, 1],
    ["blur(10px)", "blur(0px)"],
  );

  // console.log(scrollYProgress.);

  return (
    <div>
      <style>
        {`* {
          scroll-behavior: smooth;
        }`}
      </style>
      <motion.main>
        <HeroSection />
        <section
          className="mt-[150vh] flex h-[100vh] gap-[0.4vw] p-[0.8vw]"
          ref={sectionRef}
        >
          <motion.div
            className="h-full w-full"
            style={{ opacity: scrollYProgress, filter: blur1 }}
          >
            <Link href={"/products"} passHref>
              <Image
                className={
                  "h-full w-full rounded-sm object-cover transition-all duration-300 hover:scale-95 hover:rounded-lg hover:blur-[1px] hover:brightness-75"
                }
                src={"/hero-img-1.avif"}
                alt={"A model in a green dress sitting on a chair"}
              />
            </Link>
          </motion.div>
          <motion.div
            className="h-full w-full"
            style={{ opacity: scrollYProgress2, filter: blur2 }}
          >
            <Link href={"/products"} passHref>
              <Image
                className={
                  "h-full w-full rounded-sm object-cover transition-all duration-300 hover:scale-95 hover:rounded-lg hover:blur-[1px] hover:brightness-75"
                }
                src={"/hero-img-2.avif"}
                alt={"A model in a red dress sitting on a chair"}
              />
            </Link>
          </motion.div>
        </section>
      </motion.main>
    </div>
  );
};
export default HomePage;
