import { useState } from "react";

export default function StarRating({ onChange }) {
  const [rating, setRating] = useState(0);

  const handleClick = (value) => {
    setRating(value);
    onChange?.(value);
  };

  return (
    <div>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          style={{
            fontSize: "32px",
            color: star <= rating ? "#f5b301" : "#ccc",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}
