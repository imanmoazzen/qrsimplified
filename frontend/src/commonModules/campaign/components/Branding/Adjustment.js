import { useState } from "react";

import ColorPicker from "../../../../commonComponents/ColorPicker/ColorPicker.js";
import DecoratedButton from "../../../../commonComponents/DecoratedButton/DecoratedButton.js";
import SimpleSwitch from "../../../../commonComponents/SimpleSwitch/SimpleSwitch.js";
import { DEFAULT_BRANDING } from "../../store/uiReducer.js";
import styles from "./Adjustment.module.scss";

const Adjustment = ({ branding = DEFAULT_BRANDING, onBrandingChanged, onError }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const { logo, logo_scale, color, background, isTransparent } = branding;

  const remove = async () => {
    try {
      setIsDeleting(true);
      await onBrandingChanged?.({ ...branding, logo: null });
    } catch (error) {
      onError?.();
    } finally {
      setIsDeleting(false);
    }
  };

  const scale = (e) => onBrandingChanged?.({ ...branding, logo_scale: e.target.value });

  const updateColor = (newColor) => onBrandingChanged?.({ ...branding, color: newColor });

  const updateBackground = (newColor) => onBrandingChanged?.({ ...branding, background: newColor });

  const updateOpacity = async () => {
    const newOpacity = !isTransparent;
    const newBackground = newOpacity ? "#0000" : background !== "#0000" ? background : "#000000";
    onBrandingChanged?.({ ...branding, isTransparent: newOpacity, background: newBackground });
  };

  return (
    <div className={styles["main-container"]}>
      {logo && (
        <div className={styles["resize-container"]}>
          <div className={styles["resize-slider"]}>
            <section>
              <label>Resize Logo:</label>
              <input
                type="range"
                min="1"
                max="11"
                value={logo_scale}
                step={1}
                onChange={scale}
                className={styles["slider"]}
              />
            </section>
            <DecoratedButton
              buttonText={isDeleting ? "Removing..." : "Remove Logo"}
              icon="delete"
              onClick={remove}
              isBusy={isDeleting}
            />
          </div>
          <div className={`${styles["scan-to-check-message"]} ${logo_scale > 4 && styles["visible"]}`}>
            <span className="material-symbols-outlined">mobile_hand</span>
            <span>
              Scan the QR code with your phone to make sure it still works with the larger logo. If not, make the logo
              smaller.
            </span>
          </div>
        </div>
      )}

      <ColorPicker currentColor={color} setCurrentColor={updateColor} label="Color:" />

      <div className={styles["background-color-container"]}>
        {!isTransparent && (
          <ColorPicker currentColor={background} setCurrentColor={updateBackground} label="Background Color:" />
        )}
        <SimpleSwitch
          leftLabel="Transparent"
          rightLabel="Solid Background"
          isKnobOnLeft={isTransparent}
          onFlip={updateOpacity}
        />
      </div>
    </div>
  );
};

export default Adjustment;
