import { useId, useState } from "react";
import { v4 as uuid } from "uuid";

import ColorPicker from "../../../../commonComponents/ColorPicker/ColorPicker.js";
import DecoratedButton from "../../../../commonComponents/DecoratedButton/DecoratedButton.js";
import { fileSelector } from "../../../../commonComponents/FileSelector/FileSelector.js";
import SimpleSwitch from "../../../../commonComponents/SimpleSwitch/SimpleSwitch.js";
import useLocalStorage from "../../../../hooks/useLocalStorage.js";
import { QR_CAPTION_MAX_LENGTH } from "../../qrCaption.js";
import { QR_SHAPES } from "../../qrCode.js";
import { DEFAULT_BRANDING } from "../../store/uiReducer.js";
import { transferQRCodeFileToS3 } from "../../utils.js";
import styles from "./Adjustment.module.scss";

const isSolidColor = (value) => typeof value === "string" && /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value);

const Adjustment = ({ branding = DEFAULT_BRANDING, onBrandingChanged, onError }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const shapeGroupName = useId();

  const { logo, logo_scale, color, background, isTransparent } = branding;
  const [lastSolidBackground, setLastSolidBackground] = useLocalStorage("qr-last-solid-background", "#000000");

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

  const upload = () => {
    fileSelector.choose("image/*", () => {
      fileSelector.getImages().forEach(async (file) => {
        try {
          setIsUploading(true);
          const s3URL = await transferQRCodeFileToS3(file, "logos", uuid());
          onBrandingChanged?.({ ...branding, logo: s3URL });
        } catch (error) {
          console.log(error);
          onError?.();
        } finally {
          setIsUploading(false);
        }
      });
    });
  };

  const scale = (e) => onBrandingChanged?.({ ...branding, logo_scale: e.target.value });

  const updateColor = (newColor) => onBrandingChanged?.({ ...branding, color: newColor });
  const updateCaption = (event) =>
    onBrandingChanged?.({ ...branding, caption: event.target.value.slice(0, QR_CAPTION_MAX_LENGTH) });

  const updateBackground = (newColor) => {
    if (isSolidColor(newColor)) setLastSolidBackground(newColor);
    onBrandingChanged?.({ ...branding, background: newColor });
  };

  const updateOpacity = async () => {
    const newOpacity = !isTransparent;
    if (newOpacity && isSolidColor(background)) setLastSolidBackground(background);
    const restoredBackground = isSolidColor(lastSolidBackground) ? lastSolidBackground : "#000000";
    const newBackground = newOpacity ? "#0000" : isSolidColor(background) ? background : restoredBackground;
    onBrandingChanged?.({ ...branding, isTransparent: newOpacity, background: newBackground });
  };

  return (
    <div className={styles["main-container"]}>
      <div className={styles["shape-selector"]}>
        <span id={`${shapeGroupName}-label`} className={styles["field-label"]}>
          Shape:
        </span>
        <div className={styles["shape-options"]} role="radiogroup" aria-labelledby={`${shapeGroupName}-label`}>
          {Object.entries(QR_SHAPES).map(([value, label]) => (
            <label
              key={value}
              className={`${styles["shape-option"]} ${styles[value]} ${
                (branding.shape ?? "square") === value ? styles["selected"] : ""
              }`}
              style={{ "--shape-color": color ?? DEFAULT_BRANDING.color }}
              title={label}
            >
              <input
                type="radio"
                name={shapeGroupName}
                value={value}
                aria-label={label}
                checked={(branding.shape ?? "square") === value}
                onChange={(event) => onBrandingChanged?.({ ...branding, shape: event.target.value })}
              />
              <span className={`${styles["shape-preview"]} ${styles[value]}`} aria-hidden="true" />
            </label>
          ))}
        </div>
      </div>

      <div className={styles["background-switch"]} role="group" aria-labelledby={`${shapeGroupName}-background-type`}>
        <span id={`${shapeGroupName}-background-type`} className={styles["field-label"]}>
          Background Type:
        </span>
        <SimpleSwitch
          leftLabel="Transparent"
          rightLabel="Solid Color"
          isKnobOnLeft={isTransparent}
          onFlip={updateOpacity}
        />
      </div>

      {!isTransparent && (
        <ColorPicker
          currentColor={background}
          setCurrentColor={updateBackground}
          label="Background Color:"
          extraClasses={styles["color-picker"]}
          labelClassName={styles["field-label"]}
        />
      )}

      <ColorPicker
        currentColor={color}
        setCurrentColor={updateColor}
        label="QR Code Color:"
        extraClasses={styles["color-picker"]}
        labelClassName={styles["field-label"]}
      />

      {logo && (
        <div className={styles["resize-container"]}>
          <div className={styles["resize-slider"]}>
            <section>
              <label className={styles["field-label"]} htmlFor={`${shapeGroupName}-logo-scale`}>
                Logo Size:
              </label>
              <input
                id={`${shapeGroupName}-logo-scale`}
                type="range"
                min="1"
                max="11"
                value={logo_scale}
                step={1}
                onChange={scale}
                className={styles["slider"]}
              />
            </section>
          </div>
        </div>
      )}
      <div className={styles["caption-row"]}>
        <label className={styles["field-label"]} htmlFor={`${shapeGroupName}-caption`}>
          Text (optional):
        </label>
        <div className={styles["caption-control"]}>
          <input
            id={`${shapeGroupName}-caption`}
            type="text"
            value={branding.caption ?? ""}
            placeholder="Scan Me"
            maxLength={QR_CAPTION_MAX_LENGTH}
            onChange={updateCaption}
            aria-describedby={`${shapeGroupName}-caption-count`}
          />
        </div>
        <span id={`${shapeGroupName}-caption-count`} className={styles["caption-count"]}>
          {(branding.caption ?? "").length >= QR_CAPTION_MAX_LENGTH && "Max characters reached — "}
          {(branding.caption ?? "").length}/{QR_CAPTION_MAX_LENGTH}
        </span>
      </div>
      <div className={styles["logo-actions"]}>
        <DecoratedButton
          buttonText={isUploading ? "Uploading..." : logo ? "Replace Logo" : "Upload Logo"}
          icon="upload"
          onClick={upload}
          isBusy={isUploading}
          extraContainerClasses={styles["logo-action"]}
          extraClasses={styles["logo-button"]}
        />
        {logo && (
          <DecoratedButton
            buttonText={isDeleting ? "Removing..." : "Remove Logo"}
            icon="delete"
            onClick={remove}
            isBusy={isDeleting}
            extraContainerClasses={styles["logo-action"]}
            extraClasses={styles["logo-button"]}
          />
        )}
      </div>
    </div>
  );
};

export default Adjustment;
