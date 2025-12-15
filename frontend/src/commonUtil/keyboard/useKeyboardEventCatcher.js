import { useEffect } from "react";

import Emitter from "./Emitter.js";

// used on any element we want to catch and re-emit keyboard events with
const useKeyboardEventCatcher = (elementRef, eventName) => {
  useEffect(() => {
    const emitKeyboardEvent = (e) => {
      Emitter.emit(eventName, e);
    };

    const element = elementRef.current;
    element.addEventListener("keydown", emitKeyboardEvent);
    return () => {
      element.removeEventListener("keydown", emitKeyboardEvent);
    };
  }, []);
};

export default useKeyboardEventCatcher;
