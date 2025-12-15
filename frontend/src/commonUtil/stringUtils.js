export function capitalize(text) {
  const formattedText = text.charAt(0).toUpperCase() + text.slice(1);
  return formattedText;
}

export function levenshtein(str1, str2) {
  const dp = Array.from({ length: str1.length + 1 }, () => Array(str2.length + 1).fill(0));

  for (let i = 0; i <= str1.length; i++) dp[i][0] = i;
  for (let j = 0; j <= str2.length; j++) dp[0][j] = j;

  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] =
          1 +
          Math.min(
            dp[i - 1][j], // delete
            dp[i][j - 1], // insert
            dp[i - 1][j - 1] // substitute
          );
      }
    }
  }
  return dp[str1.length][str2.length];
}

//  Normalized Levenshtein Distance
export const calculateChangeScore = (str1 = "", str2 = "") =>
  !str1.length && !str2.length ? 0 : levenshtein(str1, str2) / Math.max(str1.length, str2.length);

export const convertToValidAttributeForDB = (string) =>
  string
    .trim()
    .replace(/\s+/g, "_") // any whitespace → single underscore
    .replace(/[^a-zA-Z0-9_]/g, "") // remove invalid chars
    .toLowerCase();

export const formatPhoneNumber = (number) => {
  const length = number.length;
  if (length < 4) return number;
  if (length < 7) return `(${number.slice(0, 3)}) ${number.slice(3)}`;
  return `(${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6, 10)}`;
};

export const splitPhoneNumber = (phone) => {
  const areaCode = phone.slice(0, 3);
  const centralOffice = phone.slice(3, 6);
  const lineNumber = phone.slice(6);

  return { areaCode, centralOffice, lineNumber };
};

export const createProjectTitle = (clientName, patientName) => {
  return [clientName, patientName]
    .filter(Boolean)
    .map((s) => s.trim().replace(/\s+/g, "-"))
    .join("-");
};

export const removeNonDigitCharacters = (text) => text.replace(/[^\d]/g, "");

export const removeDataBase64 = (string) => string.substring(string.indexOf(",") + 1);

export const isValidHttpsUrl = (stringAddress) => {
  try {
    const u = new URL(stringAddress);
    return u.protocol === "https:";
  } catch {
    return false;
  }
};
