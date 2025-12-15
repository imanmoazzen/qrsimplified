export const convertToHumanReadableDate = (date) => {
  return date ? new Date(date * 1000).toISOString().split("T")[0] : null;
};
