export const QR_CAPTION_MAX_LENGTH = 40;
let measurementContext;

export const renderQRCaption = (value, size, color, margin) => {
  const text = typeof value === "string" ? value.slice(0, QR_CAPTION_MAX_LENGTH).replace(/\s+/g, " ").trim() : "";
  if (!text) return { height: size, markup: "" };

  const unit = size / 256;
  const centerY = size - margin / 2;
  const height = size;
  // Match the QR pattern's width, excluding the padding on both sides.
  const availableWidth = size - margin * 2;
  if (!measurementContext && typeof document !== "undefined") {
    measurementContext = document.createElement("canvas").getContext("2d");
  }
  if (measurementContext) measurementContext.font = "600 13px Arial, sans-serif";
  const measuredWidth = measurementContext?.measureText(text).width ?? Array.from(text).length * 13;
  const fontSize = 13 * unit * Math.min(1, availableWidth / (measuredWidth * unit));
  const escapeXml = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const markup = `<text x="${
    size / 2
  }" y="${centerY}" fill="${color}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="500" text-anchor="middle" dominant-baseline="central">${escapeXml(
    text
  )}</text>`;
  return { height, markup };
};
