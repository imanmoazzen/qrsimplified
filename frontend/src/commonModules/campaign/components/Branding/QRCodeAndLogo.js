import { useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";

import DecoratedButton from "../../../../commonComponents/DecoratedButton/DecoratedButton.js";
import { fileSelector } from "../../../../commonComponents/FileSelector/FileSelector.js";
import { DEFAULT_BRANDING } from "../../store/uiReducer.js";
import { mergeQrAndLogo, transferQRCodeFileToS3 } from "../../utils.js";
import styles from "./QRCodeAndLogo.module.scss";

const QRCodeAndLogo = ({ qrCode, branding = DEFAULT_BRANDING, onBrandingChanged, onError }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [composite, setComposite] = useState(null);
  const errorHandler = useRef(onError);
  errorHandler.current = onError;
  const { logo, logo_scale } = branding;
  // Keep the last complete preview visible while its replacement is being rendered.
  const preview = composite && composite.logo === logo ? composite.url : null;

  useEffect(() => {
    let cancelled = false;
    if (qrCode && logo) {
      mergeQrAndLogo(qrCode, logo, logo_scale)
        .then(async (url) => {
          const image = new Image();
          image.src = url;
          await image.decode();
          if (!cancelled) setComposite({ qrCode, logo, scale: logo_scale, url });
        })
        .catch(() => {
          if (!cancelled) errorHandler.current?.();
        });
    }
    return () => {
      cancelled = true;
    };
  }, [qrCode, logo, logo_scale]);

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
      <img
        className={styles["qr-code-image"]}
        src={logo && preview ? preview : qrCode}
        alt="QR code for the campaign"
      />

      {!logo && (
        <DecoratedButton
          buttonText={isUploading ? "Uploading..." : "Upload Logo"}
          icon="upload"
          onClick={upload}
          isBusy={isUploading}
          extraContainerClasses={styles["upload-button-container"]}
        />
      )}
    </div>
  );
};

export default QRCodeAndLogo;
