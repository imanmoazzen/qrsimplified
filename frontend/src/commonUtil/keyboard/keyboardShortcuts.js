import { detect } from "detect-browser";

/*
  A note on the definition of shortcuts here:
  Shortcuts are defined by a set of properties and values.
  When a key event is being checked if it matches, it's considered to match if all of the properties found in the 
  shortcut have matching properties in the key event.

  If a property is given an array of options, it passes the check if any of those options are present in the key event.

  So for example; DELETE: {key: ["Delete", "Backspace"]} defines a keyboard shortcut called DELETE which triggers when either 
  the "Delete" key or the "Backspace" key are pressed.
*/

// on Mac keyboards, the 'Backspace' and 'Delete' keys are both labeled "delete" so accepting both makes sense
// May as well do it on Windows too, since it isn't uncommon for applications to do that.

const KEYBOARD_SHORTCUTS_WINDOWS = {
  SELECT: { ctrlKey: true, key: "b" },
  SPLIT: { ctrlKey: true, key: "k" },
  COPY: { ctrlKey: true, key: "c" },
  CUT: { ctrlKey: true, key: "x" },
  PASTE: { ctrlKey: true, key: "v" },
  UNDO: { ctrlKey: true, key: "z" },
  REDO: { ctrlKey: true, key: "y" },
  DELETE: { key: ["Delete", "Backspace"] },
  PLAY_PAUSE: { key: " " },
  SELECT_ALL: { ctrlKey: true, key: "a" },
  AUDIO_FORWARD: { key: "ArrowRight" },
  AUDIO_BACKWARD: { key: "ArrowLeft" },
};

const KEYBOARD_SHORTCUTS_MAC = {
  ...KEYBOARD_SHORTCUTS_WINDOWS,
  SELECT: { metaKey: true, key: "b" },
  SPLIT: { ctrlKey: true, key: "k" },
  COPY: { metaKey: true, key: "c" },
  CUT: { metaKey: true, key: "x" },
  PASTE: { metaKey: true, key: "v" },
  UNDO: { metaKey: true, shiftKey: false, key: "z" },
  REDO: { metaKey: true, shiftKey: true, key: "z" },
  SELECT_ALL: { metaKey: true, key: "a" },
};

let os = "Windows/Other";
if (detect().os === "Mac OS") os = "Mac OS";

export const KEYBOARD_SHORTCUTS = {
  "Windows/Other": KEYBOARD_SHORTCUTS_WINDOWS,
  "Mac OS": KEYBOARD_SHORTCUTS_MAC,
}[os];

export const isCtrlOrCommandDown = (event) => {
  return os === "Mac OS" ? event.metaKey : event.ctrlKey;
};
