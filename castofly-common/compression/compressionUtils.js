import {
  base64ToBytes,
  bytesToBase64,
  bytesToString,
  compressBytes,
  concatUInt8Arrays,
  decompressBytes,
  stringToBytes,
} from "./compressionHelpers.js";

export async function compressData(input) {
  const isString = typeof input === "string";
  const raw = isString ? input : JSON.stringify(input);
  const data = stringToBytes(raw);
  const compressedData = await compressBytes(data);
  return bytesToBase64(compressedData);
}

export async function decompressData(base64String) {
  const data = base64ToBytes(base64String);
  const decompressedData = await decompressBytes(data);
  const decoded = bytesToString(decompressedData);

  try {
    return JSON.parse(decoded);
  } catch {
    return decoded;
  }
}

export async function decompressDataParts(stringParts) {
  const uint8Parts = stringParts.map(base64ToBytes);
  const data = concatUInt8Arrays(uint8Parts);
  const decompressedData = await decompressBytes(data);
  const decodedJSON = bytesToString(decompressedData);
  return JSON.parse(decodedJSON);
}

export function getSizeInKB(str) {
  const bytes = new TextEncoder().encode(str).length;
  return (bytes / 1024).toFixed(2);
}
