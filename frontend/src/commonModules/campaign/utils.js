import { API_RESPONSE_TYPES } from "castofly-common";
import { CAMPAIGN_STATUS } from "castofly-common/campaigns.js";
import { v4 as uuid } from "uuid";

import { base64ToFile } from "../../commonUtil/stringUtils.js";
import { server } from "../../index.js";
import { generateQRCodeAsSvgURL } from "./qrCode.js";
import { getLogoClearRects } from "./logoBoundary.js";

export { generateQRCodeAsSvgURL } from "./qrCode.js";

export async function archiveCampaigns(campaignIds, request) {
  const ids = [...new Set(campaignIds)];
  const results = await Promise.allSettled(
    ids.map(async (campaign_id) => {
      const response = await request("/campaign", {
        method: "PUT",
        mode: "cors",
        data: { campaign_id, fieldsToSet: { status: CAMPAIGN_STATUS.ARCHIVED } },
      });
      if (response?.data?.message !== API_RESPONSE_TYPES.SUCCESS) throw new Error("Unable to archive QR code.");
    })
  );
  return {
    archivedIds: ids.filter((_, index) => results[index].status === "fulfilled"),
    failedIds: ids.filter((_, index) => results[index].status === "rejected"),
  };
}

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

const logoImageCache = new Map();

const loadFileToImage = (image) => {
  if (logoImageCache.has(image)) return logoImageCache.get(image);
  const pending = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    let objectUrl;

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = (error) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      logoImageCache.delete(image);
      reject(error);
    };

    if (image instanceof File || image instanceof Blob) {
      objectUrl = URL.createObjectURL(image);
      img.src = objectUrl;
    } else {
      img.src = image;
    }
  });
  logoImageCache.set(image, pending);
  if (logoImageCache.size > 8) logoImageCache.delete(logoImageCache.keys().next().value);
  return pending;
};

export async function mergeQrAndLogo(qrSvgString, logoImage, scale) {
  const qrImg = await loadSvgToImage(qrSvgString);
  const svg = new DOMParser().parseFromString(decodeURIComponent(qrSvgString.split(",")[1]), "image/svg+xml");
  const [, , svgWidth, svgHeight] = (svg.documentElement.getAttribute("viewBox") ?? "0 0 1 1").split(/\s+/).map(Number);

  const frontEndSize = 256;
  const exportSize = 1024;
  const upscaling = exportSize / frontEndSize;

  const canvas = document.createElement("canvas");
  canvas.width = exportSize;
  canvas.height = Math.round(exportSize * (svgHeight / svgWidth));
  const ctx = canvas.getContext("2d");
  ctx.drawImage(qrImg, 0, 0, exportSize, canvas.height);

  if (logoImage) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, exportSize, exportSize);
    ctx.clip();
    const logoImg = await loadFileToImage(logoImage);
    const logoWidthPreview = getSizeFromScale(scale);
    const logoTargetWidth = logoWidthPreview * upscaling;
    const logoTargetHeight = logoTargetWidth * (logoImg.height / logoImg.width);
    const logoX = (exportSize - logoTargetWidth) / 2;
    const logoY = (exportSize - logoTargetHeight) / 2;

    const moduleCount = Number(svg.documentElement.getAttribute("data-qr-modules"));
    const margin = Number(svg.documentElement.getAttribute("data-qr-margin"));
    if (moduleCount > 0) {
      const clearRects = getLogoClearRects(
        { width: logoTargetWidth / upscaling, height: logoTargetHeight / upscaling },
        moduleCount,
        margin,
        frontEndSize
      );
      ctx.save();
      ctx.beginPath();
      for (const { x, y, size } of clearRects) {
        ctx.rect(x * upscaling, y * upscaling, size * upscaling, size * upscaling);
      }
      ctx.globalCompositeOperation = "destination-out";
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = svg.querySelector("svg > path")?.getAttribute("fill") ?? "#0000";
      ctx.fill();
      ctx.restore();
    }
    ctx.drawImage(logoImg, logoX, logoY, logoTargetWidth, logoTargetHeight);
    ctx.restore();
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
