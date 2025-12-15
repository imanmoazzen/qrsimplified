import { useEffect, useState } from "react";

import { useSound } from "../../../hooks/useSound.js";

// circula progress bar mainly copied from chatgpt without refactoring
export default function PlayWithCircularProgress({
  voice,
  size = 26,
  strokeWidth = 2,
  padding = 4,
  trackColor = "#eee",
  progressColor = "#4335e6",
  showLabel = true,
}) {
  const [value, setValue] = useState(65);
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  const { play, pause, currentTime, duration, isPlaying } = useSound(voice);

  useEffect(() => {
    if (!duration) return;

    setValue(Math.round((currentTime * 100) / duration));
  }, [currentTime, duration]);

  useEffect(() => {
    play();

    return () => pause();
  }, []);

  return (
    <div
      style={{
        width: size + 2 * padding,
        height: size + 2 * padding,
        padding,
        position: "relative",
        cursor: "pointer",
      }}
      role="img"
      aria-label={`Progress: ${clamped}%`}
    >
      <svg width={size} height={size}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {/* Track */}
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={progressColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.2s ease" }}
          />
        </g>
      </svg>

      {showLabel && (
        <span
          className="material-symbols-outlined"
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            fontSize: isPlaying ? 20 : 22,
          }}
          onClick={() => {
            isPlaying ? pause() : play();
          }}
        >
          {isPlaying ? "pause" : "play_arrow"}
        </span>
      )}
    </div>
  );
}
