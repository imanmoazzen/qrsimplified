import { useEffect, useState } from "react";

const useActiveIndex = (numberOfItems, switchTimeInMs) => {
  const [counter, setCounter] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setCounter((curr) => curr + 1), switchTimeInMs);
    return () => clearInterval(interval);
  }, [numberOfItems, switchTimeInMs]);

  useEffect(() => {
    setActiveIndex(counter % numberOfItems);
  }, [numberOfItems, counter]);

  return activeIndex;
};

export default useActiveIndex;
