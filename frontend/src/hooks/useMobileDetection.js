import { useEffect, useState } from "react";

const THRESHOLD_IN_PIXELS = 767;

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const resized = () => setIsMobile(window.innerWidth < THRESHOLD_IN_PIXELS);
    resized();

    window.addEventListener("resize", resized);
    return () => window.removeEventListener("resize", resized);
  }, []);

  return isMobile;
};

export default useMobileDetection;
