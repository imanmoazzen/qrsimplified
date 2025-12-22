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
