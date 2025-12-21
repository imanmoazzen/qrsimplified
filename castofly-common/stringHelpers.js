export const toSafeKey = (string) => {
  return String(string)
    .normalize("NFKD") // normalize accents
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars
    .replace(/\s+/g, "-") // spaces → -
    .replace(/-+/g, "-"); // collapse multiple -
};

export const getBase36 = (length = 2) => Array.from({ length }, () => Math.random().toString(36)[2]).join("");
