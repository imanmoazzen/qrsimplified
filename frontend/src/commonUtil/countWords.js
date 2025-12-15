export const countWords = (text) => {
  if (!text || typeof text !== "string") return 0;

  const words = text.split(/\s+/);
  const filteredWords = words.filter(function (word) {
    return word.length > 0;
  });

  return filteredWords.length;
};
