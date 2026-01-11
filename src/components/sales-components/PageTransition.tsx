"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    // Start transition out
    setIsTransitioning(true);

    // After transition out, update children and transition in
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsTransitioning(false);
    }, 150); // Shorter transition for better UX

    return () => clearTimeout(timer);
  }, [pathname, children]);

  return (
    <div
      className={`content-transition-container ${
        isTransitioning ? "content-exit" : "content-enter"
      }`}
    >
      {displayChildren}
    </div>
  );
};

export default PageTransition;
