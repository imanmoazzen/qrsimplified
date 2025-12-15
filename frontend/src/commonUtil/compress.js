import imageCompression from "browser-image-compression";

export const compress = async (originalFile, maxSizeMB, maxWidthOrHeight) => {
  const options = {
    maxSizeMB: maxSizeMB,
    maxWidthOrHeight: maxWidthOrHeight,
  };

  const compressedFile = await imageCompression(originalFile, options);

  return compressedFile;
};

export const getSizeInMB = (file) => {
  return file.size / 1024 / 1024;
};
