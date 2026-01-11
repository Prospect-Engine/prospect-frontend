"use client";

import { useState, useEffect } from "react";

const SMALL_DEVICE_BREAKPOINT = 1024;

export function useSmallDevice() {
  const [isSmallDevice, setIsSmallDevice] = useState<boolean>(false);

  useEffect(() => {
    const mql = window.matchMedia(
      `(max-width: ${SMALL_DEVICE_BREAKPOINT - 1}px)`
    );
    const onChange = () => {
      setIsSmallDevice(window.innerWidth < SMALL_DEVICE_BREAKPOINT);
    };

    mql.addEventListener("change", onChange);
    setIsSmallDevice(window.innerWidth < SMALL_DEVICE_BREAKPOINT);

    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isSmallDevice;
}
