import { useState } from "react";
import { v4 as uuid } from "uuid";

import DecoratedButton from "../../../../commonComponents/DecoratedButton/DecoratedButton.js";
import { fileSelector } from "../../../../commonComponents/FileSelector/FileSelector.js";
import { useFadeInImage } from "../../../../hooks/useFadeInImage.js";
import { DEFAULT_BRANDING } from "../../store/uiReducer.js";
import { getSizeFromScale, transferQRCodeFileToS3 } from "../../utils.js";
import styles from "./QRCodeAndLogo.module.scss";

const QRCodeAndLogo = ({ qrCode, branding = DEFAULT_BRANDING, onBrandingChanged, onError }) => {
  const [isUploading, setIsUploading] = useState(false);
  const { logo, logo_scale } = branding;
  const size = getSizeFromScale(logo_scale);

  const logoImg = useFadeInImage({
    src: logo,
    alt: "logo for the business",
    extraImgStyle: { width: `${size}px` },
  });

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

  return (
    <div className={styles["main-container"]}>
      <span className={styles["moving-bar"]}></span>
      <img className={styles["qr-code-image"]} src={qrCode} alt="QR code for the campaign" />

      {!logo && (
        <DecoratedButton
          buttonText={isUploading ? "Uploading..." : "Upload Logo"}
          icon="upload"
          onClick={upload}
          isBusy={isUploading}
          extraContainerClasses={styles["upload-button-container"]}
        />
      )}

      <div className={styles["logo"]}>{logoImg}</div>
    </div>
  );
};

export default QRCodeAndLogo;
