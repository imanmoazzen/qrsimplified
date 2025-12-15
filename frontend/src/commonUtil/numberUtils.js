const EPSILON = 0.0001;
export function floatEqual(a, b, eps = EPSILON) {
  return Math.abs(a - b) < eps;
}

export function clamp(min, value, max) {
  return Math.max(Math.min(value, max), min);
}
