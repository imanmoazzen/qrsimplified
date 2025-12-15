export const hexToRgba = (hexColor, opacity) => {
  const isHex = /^#([0-9A-F]{3}){1,2}$/i;
  if (!isHex.test(hexColor)) return hexColor;

  hexColor = hexColor.replace("#", "");
  let r = parseInt(hexColor.substring(0, 2), 16);
  let g = parseInt(hexColor.substring(2, 4), 16);
  let b = parseInt(hexColor.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
