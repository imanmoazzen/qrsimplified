import { useMemo } from "react";

export const useClassNames = (styles, ...classes) =>
  useMemo(() => {
    return classes
      .filter(Boolean)
      .map((cls) => styles?.[cls] || cls)
      .join(" ");
  }, [styles, ...classes]);
