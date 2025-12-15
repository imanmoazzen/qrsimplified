import { useEffect } from "react";

import Emitter from "./Emitter.js";

// shortcut: an object containing key/values to check that the keyboard event has.
// for example: shortcut = {ctrlKey: true, key: "c"}
// or another: shortcut = {shiftKey: true, altKey: true, ctrlKey: false, key: "A"}

const useKeyboardShortcut = ({ eventName, shortcut, handler }) => {
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.type !== "keydown") return;
      for (const key in shortcut) {
        if (shortcut[key] instanceof Array) {
          // accept multiple possible options
          if (e[key] === undefined || shortcut[key].indexOf(e[key]) === -1) {
            return;
          }
        } else {
          if (e[key] === undefined || e[key] !== shortcut[key]) {
            return;
          }
        }
      }

      handler(e);
    };

    Emitter.on(eventName, handleKeyPress);
    return () => {
      Emitter.off(eventName, handleKeyPress);
    };
  }, [eventName, shortcut, handler]);
};

export default useKeyboardShortcut;
