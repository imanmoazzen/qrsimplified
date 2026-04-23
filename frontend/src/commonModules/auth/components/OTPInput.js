import { useEffect, useRef, useState } from "react";

import styles from "./OTPInput.module.scss";

export default function OTPInput({ setCode, length = 6 }) {
  const [values, setValues] = useState(Array(length).fill(""));
  const inputs = useRef([]);

  useEffect(() => {
    setValues(Array(length).fill(""));
    inputs.current = [];
  }, [length]);

  const updateValues = (next) => {
    setValues(next);
    setCode?.(next.join(""));
  };

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;

    const next = [...values];
    next[i] = val;
    updateValues(next);

    if (val && i < length - 1) {
      inputs.current[i + 1]?.focus();
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !values[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();

    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);

    if (!paste) return;

    const next = paste.split("");
    const filled = [...next, ...Array(length - next.length).fill("")];

    updateValues(filled);

    filled.forEach((v, i) => {
      if (inputs.current[i]) inputs.current[i].value = v;
    });

    inputs.current[Math.min(paste.length - 1, length - 1)]?.focus();
  };

  return (
    <div className={styles["main-container"]} onPaste={handlePaste}>
      {values.map((v, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={v}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={styles["input"]}
        />
      ))}
    </div>
  );
}
