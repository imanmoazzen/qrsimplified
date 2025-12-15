import { useEffect, useState } from "react";

import { debounce } from "../commonUtil/debounce.js";

const useResizeObserver = (elementRef, debounceMs = 0) => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    let handleResize = () => {
      if (!elementRef.current) return;

      setSize({
        width: elementRef.current.offsetWidth,
        height: elementRef.current.offsetHeight,
      });
    };
    if (debounceMs) handleResize = debounce(handleResize, debounceMs);

    const observer = new ResizeObserver(handleResize);
    observer.observe(elementRef.current);
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return size;
};

export default useResizeObserver;
