// Work in preview pixels so the clearing area is identical at every export resolution.
export const getLogoClearRects = ({ data, width, height }, moduleCount, margin, previewSize = 256) => {
  const stride = width + 1;
  const alphaSum = new Uint32Array(stride * (height + 1));
  // A convex envelope closes open outlines and spans disconnected logo strokes.
  // For an opaque logo, the same envelope is the full image rectangle.
  const points = [];
  for (let y = 0; y < height; y++) {
    let first = width;
    let last = -1;
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] >= 16) {
        first = Math.min(first, x);
        last = x;
      }
    }
    if (last >= 0) points.push([first, y], [last + 1, y], [first, y + 1], [last + 1, y + 1]);
  }
  if (!points.length) return [];
  points.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const chain = (ordered) => {
    const result = [];
    for (const point of ordered) {
      while (result.length > 1 && cross(result[result.length - 2], result[result.length - 1], point) <= 0) result.pop();
      result.push(point);
    }
    result.pop();
    return result;
  };
  const hull = [...chain(points), ...chain([...points].reverse())];
  for (let y = 0; y < height; y++) {
    const scanY = y + 0.5;
    let start = width;
    let end = 0;
    for (let i = 0; i < hull.length; i++) {
      const a = hull[i];
      const b = hull[(i + 1) % hull.length];
      if ((a[1] <= scanY && b[1] > scanY) || (b[1] <= scanY && a[1] > scanY)) {
        const x = a[0] + ((scanY - a[1]) * (b[0] - a[0])) / (b[1] - a[1]);
        start = Math.min(start, Math.floor(x));
        end = Math.max(end, Math.ceil(x));
      }
    }
    let rowSum = 0;
    for (let x = 0; x < width; x++) {
      rowSum += x >= start && x < end ? 1 : 0;
      alphaSum[(y + 1) * stride + x + 1] = alphaSum[y * stride + x + 1] + rowSum;
    }
  }

  const left = (previewSize - width) / 2;
  const top = (previewSize - height) / 2;
  const cellSize = previewSize / (moduleCount + margin * 2);
  const buffer = 1;
  const rects = [];
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      // Keep the three finder markers intact.
      if ((row < 7 && (col < 7 || col >= moduleCount - 7)) || (row >= moduleCount - 7 && col < 7)) continue;
      const x = (col + margin) * cellSize;
      const y = (row + margin) * cellSize;
      const x0 = Math.max(0, Math.floor(x - left - buffer));
      const y0 = Math.max(0, Math.floor(y - top - buffer));
      const x1 = Math.min(width, Math.ceil(x + cellSize - left + buffer));
      const y1 = Math.min(height, Math.ceil(y + cellSize - top + buffer));
      if (x1 <= x0 || y1 <= y0) continue;

      // Opaque images fill the rectangle; transparent images fill their outer envelope.
      const intersects =
        alphaSum[y1 * stride + x1] -
          alphaSum[y0 * stride + x1] -
          alphaSum[y1 * stride + x0] +
          alphaSum[y0 * stride + x0] >
        0;
      if (intersects) rects.push({ x, y, size: cellSize });
    }
  }
  return rects;
};
