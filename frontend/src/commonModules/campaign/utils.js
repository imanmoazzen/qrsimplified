import { API_RESPONSE_TYPES } from "castofly-common";
import { v4 as uuid } from "uuid";

import { base64ToFile } from "../../commonUtil/stringUtils.js";
import { server } from "../../index.js";
import { generateQRCodeAsSvgURL } from "./qrCode.js";
import { getLogoClearRects } from "./logoBoundary.js";

export { generateQRCodeAsSvgURL } from "./qrCode.js";

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]); // remove prefix
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function downloadImage(url, fileName = "image.png") {
  let noCacheUrl = url;
  if (url.startsWith("https://")) noCacheUrl = `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;

  const res = await fetch(noCacheUrl);

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

    const svg = new DOMParser().parseFromString(decodeURIComponent(qrSvgString.split(",")[1]), "image/svg+xml");
    const moduleCount = Number(svg.documentElement.getAttribute("data-qr-modules"));
    const margin = Number(svg.documentElement.getAttribute("data-qr-margin"));
    if (moduleCount > 0) {
      const mask = document.createElement("canvas");
      mask.width = Math.max(1, Math.round(logoTargetWidth / upscaling));
      mask.height = Math.max(1, Math.round(logoTargetHeight / upscaling));
      const maskCtx = mask.getContext("2d");
      maskCtx.drawImage(logoImg, 0, 0, mask.width, mask.height);
      const pixels = maskCtx.getImageData(0, 0, mask.width, mask.height);
      const clearRects = getLogoClearRects(pixels, moduleCount, margin, frontEndSize);
      ctx.fillStyle = svg.querySelector("svg > path")?.getAttribute("fill") ?? "#0000";
      for (const { x, y, size } of clearRects) {
        ctx.clearRect(x * upscaling, y * upscaling, size * upscaling, size * upscaling);
        ctx.fillRect(x * upscaling, y * upscaling, size * upscaling, size * upscaling);
      }
    }
    ctx.drawImage(logoImg, logoX, logoY, logoTargetWidth, logoTargetHeight);
  }

  return canvas.toDataURL("image/png");
}

export const generateReferralQRCode = async () => {
  const creationRes = await server.requestFromApiv2(`/campaign/referral`, {
    method: "POST",
    mode: "cors",
  });

  const campaign = creationRes.data.item;
  const svgCode = await generateQRCodeAsSvgURL(campaign.tracking_link);

  const data = await mergeQrAndLogo(svgCode, "/logo/logo-app.png", 9);
  const file = base64ToFile(data, uuid());
  const s3URL = await transferQRCodeFileToS3(file, "qr-codes");

  await Promise.all([
    server.requestFromApiv2(`/campaign`, {
      method: "PUT",
      mode: "cors",
      data: {
        campaign_id: campaign.campaign_id,
        fieldsToSet: { s3URL },
      },
    }),
    server.requestFromApiv2("/user/updateInfo", {
      method: "POST",
      mode: "cors",
      data: { referral_id: campaign.campaign_id },
    }),
  ]);

  return { ...campaign, s3URL };
};

export const transferQRCodeFileToS3 = async (file, folder, name) => {
  const signRes = await server.requestFromApiv2("/assets/sign", {
    method: "POST",
    data: { name: name ?? file.name, type: file.type, folder },
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

  return publicURL;
};
