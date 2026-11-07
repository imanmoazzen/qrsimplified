import QRCode from "qrcode";

export const QR_SHAPES = {
  square: "Rectangle",
  rounded: "Rounded",
  liquid: "Liquid",
  dots: "Dots",
  diamonds: "Diamonds",
  sparkles: "Sparkles",
};

export const createQRCodeSvgURL = (text, branding = {}) => {
  const { shape = "square", color = "#000000", background = "#0000", padding = 4 } = branding;
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "H" });
  const margin = Number.isFinite(Number(padding)) ? Math.max(0, Math.min(12, Math.round(Number(padding)))) : 4;
  const size = modules.size + margin * 2;
  const squares = [];
  const shapedModules = [];
  const hasRoundedShapes = ["rounded", "dots", "liquid"].includes(shape);
  const hasDiamondShape = shape === "diamonds";
  // Keep rendering support for previously saved five-point Star codes.
  const starPoints =
    shape === "star"
      ? [
          [0.5, 0],
          [0.635, 0.314],
          [0.976, 0.345],
          [0.719, 0.571],
          [0.794, 0.905],
          [0.5, 0.73],
          [0.206, 0.905],
          [0.281, 0.571],
          [0.024, 0.345],
          [0.365, 0.314],
        ]
      : shape === "sparkles"
      ? [
          [0.5, 0],
          [0.64, 0.36],
          [1, 0.5],
          [0.64, 0.64],
          [0.5, 1],
          [0.36, 0.64],
          [0, 0.5],
          [0.36, 0.36],
        ]
      : null;
  const finderPositions = [
    [0, 0],
    [modules.size - 7, 0],
    [0, modules.size - 7],
  ];
  // Only accept hex colors when inserting branding values into SVG markup.
  const svgColor = (value, fallback) => (/^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(value) ? value : fallback);
  const isDark = (row, col) =>
    row >= 0 && col >= 0 && row < modules.size && col < modules.size && Boolean(modules.get(row, col));

  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (!modules.get(row, col)) continue;
      const isFinder = finderPositions.some(([x, y]) => col >= x && col < x + 7 && row >= y && row < y + 7);
      if (hasRoundedShapes && isFinder) {
        continue;
      }

      const x = col + margin;
      const y = row + margin;
      if (shape === "liquid") {
        // Inset exposed edges for wider gaps, keeping connected modules joined.
        const top = isDark(row - 1, col);
        const right = isDark(row, col + 1);
        const bottom = isDark(row + 1, col);
        const left = isDark(row, col - 1);
        const x0 = x + (left ? 0 : 0.08);
        const x1 = x + (right ? 1 : 0.92);
        const y0 = y + (top ? 0 : 0.08);
        const y1 = y + (bottom ? 1 : 0.92);
        const tl = !top && !left ? 0.42 : 0;
        const tr = !top && !right ? 0.42 : 0;
        const br = !bottom && !right ? 0.42 : 0;
        const bl = !bottom && !left ? 0.42 : 0;
        squares.push(
          `M${x0 + tl} ${y0}H${x1 - tr}Q${x1} ${y0} ${x1} ${y0 + tr}` +
            `V${y1 - br}Q${x1} ${y1} ${x1 - br} ${y1}` +
            `H${x0 + bl}Q${x0} ${y1} ${x0} ${y1 - bl}` +
            `V${y0 + tl}Q${x0} ${y0} ${x0 + tl} ${y0}z`
        );
      } else if (starPoints && !isFinder) {
        shapedModules.push(`<polygon points="${starPoints.map(([dx, dy]) => `${x + dx},${y + dy}`).join(" ")}"/>`);
      } else if (hasDiamondShape && !isFinder) {
        shapedModules.push(
          `<polygon points="${x + 0.5},${y} ${x + 1},${y + 0.5} ${x + 0.5},${y + 1} ${x},${y + 0.5}"/>`
        );
      } else if (!hasRoundedShapes) {
        squares.push(`M${x} ${y}h1v1h-1z`);
      } else if (shape === "dots") {
        shapedModules.push(`<circle cx="${x + 0.5}" cy="${y + 0.5}" r="0.5"/>`);
      } else {
        shapedModules.push(`<rect x="${x + 0.1}" y="${y + 0.1}" width="0.8" height="0.8" rx="0.2"/>`);
      }
    }
  }

  if (hasRoundedShapes) {
    for (const [col, row] of finderPositions) {
      const x = col + margin;
      const y = row + margin;
      if (shape === "dots") {
        shapedModules.push(
          `<circle cx="${x + 3.5}" cy="${y + 3.5}" r="3" fill="none" stroke="${svgColor(
            color,
            "#000000"
          )}" stroke-width="1"/><circle cx="${x + 3.5}" cy="${y + 3.5}" r="1.5"/>`
        );
        continue;
      }
      // Draw a continuous rounded ring with a transparent opening and a rounded center.
      shapedModules.push(
        `<rect x="${x + 0.5}" y="${y + 0.5}" width="6" height="6" rx="1.5" fill="none" stroke="${svgColor(
          color,
          "#000000"
        )}" stroke-width="1"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="0.75"/>`
      );
    }
  }

  const gridAttributes = `data-qr-modules="${modules.size}" data-qr-margin="${margin}"`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" ${gridAttributes} viewBox="0 0 ${size} ${size}"><path fill="${svgColor(
    background,
    "#0000"
  )}" d="M0 0h${size}v${size}H0z"/><g fill="${svgColor(color, "#000000")}"><path d="${squares.join(
    ""
  )}"/>${shapedModules.join("")}</g></svg>`;

  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
};

export const generateQRCodeAsSvgURL = async (text, branding) => createQRCodeSvgURL(text, branding);
