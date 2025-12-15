// takes a time in seconds and produces a formatted string
// i.e. formatTime(137) -> "2:17"
export function formatTime(timeSeconds) {
  timeSeconds = Math.floor(timeSeconds);
  const seconds = String(timeSeconds % 60);
  const minutes = String(Math.floor(timeSeconds / 60) % 60);
  const hours = String(Math.floor(timeSeconds / 3600));
  if (hours === "0") {
    return minutes + ":" + seconds.padStart(2, "0");
  }
  return hours + ":" + minutes.padStart(2, "0") + ":" + seconds.padStart(2, "0");
}

// takes a time (unix timestamp) and returns a formatted date/time like "Jul 25, 2023, 3:08 PM"
export function nicelyFormattedDate(timestamp) {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  return Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function nicelyFormattedDateNoTime(date) {
  const isNumber = typeof date === "number" && !isNaN(date);
  if (!isNumber) return date;

  const string = new Date(date);
  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

  return formatter.format(string);
}

export function relativePostedDate(timestamp) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const formatter = new Intl.RelativeTimeFormat("en");
  const unitRanges = {
    years: 3600 * 24 * 365,
    months: 3600 * 24 * 30,
    weeks: 3600 * 24 * 7,
    days: 3600 * 24,
    hours: 3600,
    minutes: 60,
    seconds: 1,
  };
  const secondsElapsed = (date.getTime() - Date.now()) / 1000;
  for (let key in unitRanges) {
    if (unitRanges[key] < Math.abs(secondsElapsed)) {
      const delta = secondsElapsed / unitRanges[key];
      return formatter.format(Math.round(delta), key);
    }
  }
}

export default formatTime;
