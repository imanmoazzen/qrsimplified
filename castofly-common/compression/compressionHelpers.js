// Previously we used Uint8Array.from(...) to do the work that this array does here
// but it's over ten times faster to just use a for loop.
export function base64ToBytes(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function bytesToBase64(data) {
  let binary = "";
  for (let i = 0; i < data.byteLength; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

export function concatUInt8Arrays(uint8Parts) {
  const totalLengthBytes = uint8Parts.reduce((acc, part) => acc + part.byteLength, 0);
  const concatenated = new Uint8Array(totalLengthBytes);
  let bytesSoFar = 0;
  for (let i = 0; i < uint8Parts.length; i++) {
    const part = uint8Parts[i];
    concatenated.set(part, bytesSoFar);
    bytesSoFar += part.length;
  }
  return concatenated;
}

// takes a Uint8Array of compressed data, returns a Uint8Array of decompressed data
export async function decompressBytes(data) {
  //eslint-disable-next-line no-undef
  const decompressionStream = new DecompressionStream("gzip");
  const writer = decompressionStream.writable.getWriter();
  writer.write(data);
  writer.close();
  const reader = decompressionStream.readable.getReader();

  const outputChunks = [];
  //eslint-disable-next-line no-constant-condition
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    outputChunks.push(value);
  }
  const decompressedData = concatUInt8Arrays(outputChunks);
  return decompressedData;
}

// takes a Uint8Array of data, returns a Uint8Array of compressed data
export async function compressBytes(data) {
  //eslint-disable-next-line no-undef
  const compressionStream = new CompressionStream("gzip");
  const writer = compressionStream.writable.getWriter();
  writer.write(data);
  writer.close();
  const reader = compressionStream.readable.getReader();

  const outputChunks = [];
  //eslint-disable-next-line no-constant-condition
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    outputChunks.push(value);
  }
  const compressedData = concatUInt8Arrays(outputChunks);
  return compressedData;
}

export function bytesToString(data) {
  const textDecoder = new TextDecoder();
  return textDecoder.decode(data);
}

export function stringToBytes(string) {
  const textEncoder = new TextEncoder();
  return textEncoder.encode(string);
}
