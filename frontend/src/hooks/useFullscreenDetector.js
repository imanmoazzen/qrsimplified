import { useEffect, useState } from "react";

const useFullscreenDetector = (onEnter, onExit) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => {
      const flag = Boolean(document.fullscreenElement || document.webkitFullscreenElement || null);
      flag ? onEnter?.() : onExit?.();
      setIsFullscreen(flag);
    };

    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange); // Safari

    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, [onEnter, onExit]);

  return isFullscreen;
};

export default useFullscreenDetector;
