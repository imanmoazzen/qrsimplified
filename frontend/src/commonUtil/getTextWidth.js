// code based on work from https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript

let canvas; // Re-use the canvas object for better performance

export default function getTextWidth(text, referenceElement) {
  if (!canvas) canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = getCanvasFont(referenceElement);
  const metrics = context.measureText(text);
  return metrics.width;
}

function getCanvasFont(el) {
  let style = "normal 16px Times New Roman";

  try {
    const computedStyle = getComputedStyle(el);
    const fontWeight = computedStyle.getPropertyValue("font-weight") || "normal";
    const fontSize = computedStyle.getPropertyValue("font-size") || "16px";
    const fontFamily = computedStyle.getPropertyValue("font-family") || "Times New Roman";
    style = `${fontWeight} ${fontSize} ${fontFamily}`;
  } catch (error) {
    console.log(error);
  }

  return style;
}
