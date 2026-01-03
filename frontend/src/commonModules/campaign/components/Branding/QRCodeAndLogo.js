import { API_RESPONSE_TYPES } from "castofly-common";
import { useState } from "react";
import { v4 as uuid } from "uuid";

import DecoratedButton from "../../../../commonComponents/DecoratedButton/DecoratedButton.js";
import { fileSelector } from "../../../../commonComponents/FileSelector/FileSelector.js";
import { useFadeInImage } from "../../../../hooks/useFadeInImage.js";
import { server } from "../../../../index.js";
import { DEFAULT_BRANDING } from "../../store/uiReducer.js";
import { getSizeFromScale } from "../../utils.js";
import styles from "./QRCodeAndLogo.module.scss";

const QRCodeAndLogo = ({ qrCode, branding = DEFAULT_BRANDING, onBrandingChanged, onError }) => {
  const [isUploading, setIsUploading] = useState(false);
  const { logo, logo_scale } = branding;
  const size = getSizeFromScale(logo_scale);

  const logoImg = useFadeInImage({
    src: logo,
    alt: "logo for the company",
    extraImgStyle: { width: `${size}px` },
  });

  const upload = () => {
    fileSelector.choose("image/*", () => {
      fileSelector.getImages().forEach(async (file) => {
        try {
          setIsUploading(true);

          const signRes = await server.requestFromApiv2("/assets/sign", {
            method: "POST",
            data: { name: uuid(), type: file.type, folder: "logos" },
          });

          if (signRes?.data?.message !== API_RESPONSE_TYPES.SUCCESS) throw new Error("failed to get signed url");

          const { signedURL, publicURL } = signRes.data ?? {};

          if (!signedURL) throw new Error("signed url missing");

          const putRes = await fetch(signedURL, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });

          if (!putRes.ok) throw new Error(`S3 upload failed: ${putRes.status}`);

          onBrandingChanged?.({ ...branding, logo: publicURL });
        } catch (error) {
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
