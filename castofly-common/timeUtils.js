export const getLocalTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const getTodayDateString = (timeZone = "UTC") => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
};

export const isTimestampNDaysAgoOrWithin = (timeStampInTimezone, n = 0, timeZone = "UTC", withinNDays = false) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const nowStr = formatter.format(new Date());
  const now = new Date(`${nowStr}T00:00:00`);

  const target = new Date(timeStampInTimezone);
  target.setHours(0, 0, 0, 0); // strip time portion

  const diffMs = now - target;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return withinNDays ? diffDays >= 0 && diffDays <= n : diffDays === n;
};

export const getCreationTime = (timeZone = "UTC") => new Date().toLocaleString("sv-SE", { timeZone }).replace(" ", "T");

export const extractDate = (creation_time) => creation_time?.split("T")[0] ?? null;

export const formatCreationTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();

  const isToday =
    date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();

  if (isToday) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return date.toLocaleDateString();
};

export const convertToDay = (timestamp) => {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const convertToTime = (timestamp) => {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatTime = (sec) => {
  const hrs = String(Math.floor(sec / 3600)).padStart(2, "0");
  const mins = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const secs = String(sec % 60).padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
};
