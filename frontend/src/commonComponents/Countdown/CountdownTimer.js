import { useEffect, useState } from "react";

import styles from "./CountdownTimer.module.scss";

export default function CountdownTimer({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      const updated = getTimeLeft(targetDate);
      setTimeLeft(updated);

      if (updated.total <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.total <= 0) return null;

  return (
    <span className={styles["main-container"]}>
      {pad(timeLeft.days)}d : {pad(timeLeft.hours)}h : {pad(timeLeft.minutes)}m : {pad(timeLeft.seconds)}s
    </span>
  );
}

function getTimeLeft(dateString) {
  const total = new Date(dateString).getTime() - Date.now();

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / 1000 / 60 / 60) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { total, days, hours, minutes, seconds };
}

function pad(num) {
  return num.toString().padStart(2, "0");
}
