import { useEffect, useRef, useState } from "react";

let shimmerInjected = false;

export const useFadeInImage = ({ src, alt = "", extraImgStyle }) => {
  const imgRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  // Inject shimmer once
  useEffect(() => {
    if (shimmerInjected) return;

    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(style);
    shimmerInjected = true;
  }, []);

  useEffect(() => {
    setLoaded(false);

    const timeout = setTimeout(() => {
      setLoaded(true);
    }, 2000);

    if (imgRef.current?.complete) {
      setLoaded(true);
      clearTimeout(timeout);
    }

    return () => clearTimeout(timeout);
  }, [src]);

  if (!src) return null;

  return (
    <div style={{ position: "relative" }}>
      {!loaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, #f2f2f2 25%, #e8e8e8 37%, #f2f2f2 63%)",
            backgroundSize: "400% 100%",
            animation: "shimmer 1.2s ease-in-out infinite",
            borderRadius: "inherit",
          }}
        />
      )}

      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        style={{
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.25s ease",
          position: "relative",
          zIndex: 1,
          ...extraImgStyle,
        }}
      />
    </div>
  );
};
