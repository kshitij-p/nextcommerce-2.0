"use client";

import { useRef, useSyncExternalStore } from "react";
import { Image } from "~/components/ui/image";
import {
  AnimatePresence,
  motion,
  type SpringOptions,
  useInView,
  useScroll,
  type UseScrollOptions,
  useSpring,
  useTransform,
} from "framer-motion";
import Link from "next/link";
import { ProductCategory, ProductGender } from "@prisma/client";
import { cn } from "~/lib/utils";
import { useMediaQuery } from "~/hooks/use-media-query";

const subscribeToScrollChange = (onChange: () => void) => {
  window.addEventListener("scroll", onChange);
  window.addEventListener("resize", onChange);
  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
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

  const acmeTitleRef = useRef<HTMLElement>(null);
  const isInView = useInView(acmeTitleRef);

  const isMobile = useMediaQuery("md");

  return (
    <>
      <AnimatePresence>
        {scrollPos2 >= 1 && !isInView ? (
          <motion.header
            className={cn(
              "fixed inset-0 z-[1000] h-16 w-full bg-black/20 backdrop-blur-[6px]",
            )}
            initial={{ opacity: 0, translateY: "-50%" }}
            animate={{ opacity: 1, translateY: "0%" }}
            exit={{ opacity: 0, translateY: "-50%" }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex h-full w-full items-center justify-center text-[max(1.5vw,20px)] font-light tracking-[max(0.4vw,4px)]">
              <span className="transition hover:scale-110">ACME</span>
            </div>
          </motion.header>
        ) : null}
      </AnimatePresence>
      <motion.section
        animate={{
          position: scrollPos2 >= 1 ? "absolute" : "fixed",
          inset: 0,
          top: scrollPos2 >= 1 ? "50vh" : "0",
        }}
        transition={{ duration: 0 }}
      >
        <motion.div className="relative">
          <motion.span
            className="absolute left-1/2 z-10 font-thin"
            initial={{
              top: isMobile ? "50%" : `calc(5% + (3% * ${scrollPos}))`,
              opacity: 0,
            }}
            animate={{
              opacity: scrollPos2 > 0.1 ? 1 : 0,
              fontSize: `calc(${initialFontSize}vw + (${scrollPos} * ${targetFontSize - initialFontSize}vw))`,
              letterSpacing: `calc(1vw + (${scrollPos} * 4vw))`,
              translateX: "-45%",
              translateY: isMobile ? "-50%" : undefined,
            }}
            ref={acmeTitleRef}
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
              bottom:
                initialBottom - (initialBottom - targetBottom) * scrollPos,
              opacity: scrollPos2 > 0.4 ? 1 : 0,
            }}
          >
            <span className="text-[max(1.5vw,_16px)] font-light italic tracking-wider">
              Acme Summer Collection 2024
            </span>
            <Link href="/products" passHref className="mx-auto" tabIndex={-1}>
              <button className="inline-flex h-12 max-w-max items-center justify-center rounded-[2px] bg-white px-8 py-2 text-lg text-black shadow-xl shadow-transparent transition-all duration-300 hover:rounded-md hover:bg-[hsl(155,15%,85%)] hover:shadow-teal-500/50 focus-visible:rounded-md focus-visible:bg-[hsl(155,15%,85%)] focus-visible:shadow-teal-500/50 focus-visible:outline-none">
                Discover More
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </motion.section>
    </>
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
    offset: ["60% end", "75% end"],
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

  return (
    <div>
      <motion.main>
        <HeroSection />
        <section
          className="mt-[150vh] flex h-[100vh] flex-col gap-2 p-[0.4vw] md:flex-row md:gap-[0.4vw]"
          ref={sectionRef}
        >
          <motion.div
            className="group relative h-full w-full"
            style={{ opacity: scrollYProgress, filter: blur1 }}
          >
            <Link
              href={`/products?${new URLSearchParams({ genders: ProductGender.FEMALE }).toString()}`}
              passHref
            >
              <Image
                className={
                  "h-full w-full rounded-sm object-cover brightness-75 transition-all duration-300 group-hover:scale-95 group-hover:rounded-lg group-hover:blur-[1px] group-hover:brightness-75 md:brightness-100"
                }
                src={"/hero-img-1.avif"}
                alt={"A model in a green dress sitting on a chair"}
              />
            </Link>
            <button className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-nowrap rounded-[2px] border border-white bg-black/25 px-4 py-4 font-medium uppercase tracking-widest text-white backdrop-blur-sm transition duration-300 group-hover:opacity-100 md:opacity-0">
              Explore Women&apos;s Collection
            </button>
          </motion.div>
          <motion.div
            className="group relative h-full w-full"
            style={{ opacity: scrollYProgress2, filter: blur2 }}
          >
            <Link
              href={`/products?${new URLSearchParams({ categories: ProductCategory.FOOTWEAR }).toString()}`}
              passHref
              tabIndex={-1}
            >
              <Image
                className={
                  "h-full w-full rounded-sm object-cover brightness-75 transition-all duration-300 group-hover:scale-95 group-hover:rounded-lg group-hover:blur-[1px] group-hover:brightness-75 md:brightness-100"
                }
                src={"/hero-img-2.webp"}
                alt={"A model in a red dress sitting on a chair"}
              />
            </Link>
            <button className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-nowrap rounded-[2px] border border-white bg-black/25 px-4 py-4 font-medium uppercase tracking-widest text-white backdrop-blur-sm transition duration-300 group-hover:opacity-100 md:opacity-0">
              Explore Shoes Collection
            </button>
          </motion.div>
        </section>
      </motion.main>
    </div>
  );
};
export default HomePage;
