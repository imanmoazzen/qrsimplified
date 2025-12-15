import { createContext, useMemo, useState } from "react";

import { FONT_FAMILIES } from "./index.js";

const availableFonts = {};
Object.entries(FONT_FAMILIES).forEach((font) => {
  availableFonts[font[0]] = false;
});

const FontsProvider = ({ children }) => {
  const [contextState, setContextState] = useState({
    loadedFonts: availableFonts,
  });

  const state = useMemo(() => {
    const isFontLoaded = (font) => contextState.loadedFonts[font] === true;

    const setIsFontLoaded = (font) => {
      const updatedFontState = {
        ...contextState.loadedFonts,
        [font]: true,
      };
      setContextState({ ...contextState, loadedFonts: updatedFontState });
    };

    return {
      ...contextState,
      isFontLoaded,
      setIsFontLoaded,
    };
  }, [contextState]);

  return <FontsContext.Provider value={state}>{children}</FontsContext.Provider>;
};

export const FontsContext = createContext(null);
export default FontsProvider;
