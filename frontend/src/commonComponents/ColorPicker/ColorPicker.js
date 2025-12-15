import { useEffect, useState } from "react";
import { MaterialPicker } from "react-color";

import styles from "./ColorPicker.module.scss";

export const COLOR_PICKER_OPTIONS = [
  "#B80000",
  "#DB3E00",
  "#FEB72D",
  "#008B02",
  "#006B76",
  "#635bff",
  "#886ce7",
  "#EB9694",
  "#FAD0C3",
  "#FEF3BD",
  "#C1E1C5",
  "#BEDADC",
  "#D4C4FB",
  "#000000",
  "#FFFFFF",
];

const ColorPicker = ({ currentColor, setCurrentColor, customColors = COLOR_PICKER_OPTIONS, label = "Color:" }) => {
  const [isMaterialPickerOpen, setIsMaterialPickerOpen] = useState(false);
  const [colors, setColors] = useState(customColors);

  const handleChange = (color) => setCurrentColor(color);

  useEffect(() => {
    if (!customColors.includes(currentColor)) {
      const temp = [...colors];
      temp[0] = currentColor;
      setColors(temp);
    } else {
      setColors(customColors);
    }
  }, [currentColor, customColors]);

  return (
    <div className={styles["color-picker"]}>
      <span className={styles["label"]}>{label}</span>

      <div className={styles["palette"]}>
        {colors.map((color, index) => (
          <span
            className={`${styles["color"]}  ${currentColor === "#FFFFFF" ? styles["white"] : ""}`}
            onClick={() => handleChange(color)}
            key={index}
            style={{ backgroundColor: color }}
          >
            {color === currentColor && <span className="material-symbols-outlined">check</span>}
          </span>
        ))}
        <span
          onClick={() => setIsMaterialPickerOpen(!isMaterialPickerOpen)}
          className={`material-symbols-outlined ${styles["custom-color"]}`}
        >
          palette
        </span>
        {isMaterialPickerOpen && (
          <div className={styles["color-picker__popover"]}>
            <span
              onClick={() => setIsMaterialPickerOpen(false)}
              className={`${styles["close-botton"]} material-symbols-outlined`}
            >
              Close
            </span>
            <MaterialPicker color={currentColor} onChange={(color) => handleChange(color.hex)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorPicker;
