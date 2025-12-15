// e.g. converts strings like "fooBar", "foo-bar", and "foo_bar" into "Foo bar".
function humanizeString(str) {
  let parts = [str];
  parts = parts.flatMap((part) => part.split("-"));
  parts = parts.flatMap((part) => part.split("_"));

  function splitCamelCase(str) {
    if (str.length <= 1) return [str];
    let parts = [];
    let lastSplit = 0;
    for (let i = 1; i < str.length; i++) {
      const prevChar = str[i - 1];
      const currChar = str[i];
      if (isLowerCase(prevChar) && isUpperCase(currChar)) {
        parts.push(str.substring(lastSplit, i));
        lastSplit = i;
      }
    }
    parts.push(str.substring(lastSplit));
    return parts;
  }
  parts = parts.flatMap((part) => splitCamelCase(part));
  parts = parts.map((part) => part.toLowerCase());
  parts[0] = parts[0][0].toUpperCase() + parts[0].substring(1);
  return parts.join(" ");
}

function isUpperCase(str) {
  return str === str.toUpperCase() && str !== str.toLowerCase();
}

function isLowerCase(str) {
  return str === str.toLowerCase() && str !== str.toUpperCase();
}

export default humanizeString;
