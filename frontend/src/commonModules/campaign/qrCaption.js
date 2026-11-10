export const QR_CAPTION_MAX_LENGTH = 40;

export const renderQRCaption = (value, size, color, margin) => {
  const text = typeof value === "string" ? value.slice(0, QR_CAPTION_MAX_LENGTH).replace(/\s+/g, " ").trim() : "";
  if (!text) return { height: size, markup: "" };

  // Wrap at a word boundary when both halves fit, otherwise split long words.
  const characters = Array.from(text);
  const lines = [];
  if (characters.length <= 20) {
    lines.push(text);
  } else {
    const minimumBreak = characters.length - 20;
    let split = 20;
    for (let i = 20; i >= minimumBreak; i--) {
      if (characters[i] === " ") {
        split = i;
        break;
      }
    }
    lines.push(characters.slice(0, split).join("").trim(), characters.slice(split).join("").trim());
  }

  const unit = size / 256;
  const lineHeight = (lines.length > 1 ? 10 : 15) * unit;
  const centerY = size - margin / 2;
  const height = size;
  const escapeXml = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const markup = lines
    .map(
      (line, index) =>
        `<text x="${size / 2}" y="${
          centerY + (index - (lines.length - 1) / 2) * lineHeight
        }" fill="${color}" font-family="Arial, sans-serif" font-size="${
          Math.min(lines.length > 1 ? 9 : 13, 224 / Array.from(line).length) * unit
        }" font-weight="600" text-anchor="middle" dominant-baseline="central">${escapeXml(line)}</text>`
    )
    .join("");
  return { height, markup };
};
