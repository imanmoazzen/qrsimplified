export const getLogoClearRects = ({ width, height }, moduleCount, margin, previewSize = 256) => {
  const left = (previewSize - width) / 2;
  const top = (previewSize - height) / 2;
  const cellSize = previewSize / (moduleCount + margin * 2);
  const logoMargin = cellSize;
  const right = left + width + logoMargin;
  const bottom = top + height + logoMargin;
  const paddedLeft = left - logoMargin;
  const paddedTop = top - logoMargin;
  const rects = [];

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if ((row < 7 && (col < 7 || col >= moduleCount - 7)) || (row >= moduleCount - 7 && col < 7)) continue;

      const x = (col + margin) * cellSize;
      const y = (row + margin) * cellSize;
      if (x >= paddedLeft && y >= paddedTop && x + cellSize <= right && y + cellSize <= bottom) {
        rects.push({ x, y, size: cellSize });
      }
    }
  }

  return rects;
};
