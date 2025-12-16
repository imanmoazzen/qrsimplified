// QRCodeStyling can be used for styling down the road https://qr-code-styling.com/

import QRCode from "qrcode";
import { v4 as uuid } from "uuid";

import appSettings from "../../appSettings.js";
import { removeDataBase64 } from "../../commonUtil/stringUtils.js";
import { server } from "../../index.js";

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]); // remove prefix
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function downloadImage(url, fileName = "image.png") {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch image");

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(blobUrl);
}

export const getCountryName = (country) => {
  try {
    if (!country || typeof country !== "string") return "Unknown";

    const code = country.trim().toUpperCase();
    if (code.length !== 2) return "Unknown";

    const name = new Intl.DisplayNames(["en"], { type: "region" }).of(code);
    return name || "Unknown";
  } catch {
    return "Unknown";
  }
};

export const generateQRCodeAsSVG = async (text, color, background) => {
  const svg = await QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: "H",
  });

  const svgDataUrl = "data:image/svg+xml;utf8," + encodeURIComponent(svg);

  return recolorSvgDataUrl(svgDataUrl, color, background);
};

export const recolorSvgDataUrl = (dataUrl, color = "#000000", background = "#0000") => {
  const [prefix, encoded] = dataUrl.split(",");
  let svg = decodeURIComponent(encoded);

  // Update foreground (modules)
  svg = svg.replace(/stroke="[#A-Fa-f0-9]+"/g, `stroke="${color}"`);
  svg = svg.replace(/fill="[#A-Fa-f0-9]+"/g, (match) => {
    // Only replace module fills, not the background
    return match.includes("M0 0h") ? match : `fill="${color}"`;
  });

  // Update background rectangle
  svg = svg.replace(/<path fill="[#A-Fa-f0-9]+" d="M0 0h[\s\S]*?\/>/, `<path fill="${background}" d="M0 0h73v73H0z"/>`);

  return `${prefix},${encodeURIComponent(svg)}`;
};

export const getSizeFromScale = (scale, minSize = 32, maxSize = 200, minScale = 1, maxScale = 11) => {
  const t = (scale - minScale) / (maxScale - minScale);
  return minSize + t * (maxSize - minSize);
};

const loadSvgToImage = (svgString) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = svgString;
  });
};

const loadFileToImage = (image) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => resolve(img);
    img.onerror = reject;

    if (image instanceof File || image instanceof Blob) {
      img.src = URL.createObjectURL(image);
    } else {
      img.src = image;
    }
  });

export async function mergeQrAndLogo(qrSvgString, logoImage, scale) {
  const qrImg = await loadSvgToImage(qrSvgString);

  const frontEndSize = 256;
  const exportSize = 1024;
  const upscaling = exportSize / frontEndSize;

  const canvas = document.createElement("canvas");
  canvas.width = exportSize;
  canvas.height = exportSize;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(qrImg, 0, 0, exportSize, exportSize);

  if (logoImage) {
    const logoImg = await loadFileToImage(logoImage);
    const logoWidthPreview = getSizeFromScale(scale);
    const logoTargetWidth = logoWidthPreview * upscaling;
    const logoTargetHeight = logoTargetWidth * (logoImg.height / logoImg.width);
    const logoX = (exportSize - logoTargetWidth) / 2;
    const logoY = (exportSize - logoTargetHeight) / 2;
    ctx.drawImage(logoImg, logoX, logoY, logoTargetWidth, logoTargetHeight);
  }

  return canvas.toDataURL("image/png");
}

export const generateReferralQRCode = async (userId) => {
  const tracking_link = getTrackingLink(userId);
  const svgCode = await generateQRCodeAsSVG(tracking_link);
  const data = await mergeQrAndLogo(svgCode, "/logo/logo-app.png", 9);
  const sanitizedForS3 = removeDataBase64(data);

  const res = await server.requestFromApiv2("/assets/upload", {
    method: "POST",
    mode: "cors",
    data: {
      file: sanitizedForS3,
      name: uuid(),
      type: "image/png",
      folder: "qr-codes",
    },
  });

  return await server.requestFromApiv2(`/campaign/referral`, {
    method: "POST",
    mode: "cors",
    data: { tracking_link, s3URL: res.data.url },
  });
};

export const getTrackingLink = (userId, campaignId) => {
  if (!campaignId) return `${appSettings.get("app_base_url")}/qr?id=${userId}`;
  return `${appSettings.get("app_base_url")}/qr?id=${userId}:${campaignId}`;
};

export const getIds = (trackingId) => {
  const [user_id, campaign_id] = trackingId?.split(":") || [];
  return [user_id, campaign_id];
};
