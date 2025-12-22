import { getCountryName } from "../../../../../castofly-common/countryName.js";

export function getCampaignAnalytics(visits) {
  const now = Date.now();
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const startOfToday = d.getTime();

  const byCountry = {};
  const byCity = {};

  for (const v of visits) {
    const { country = "Unknown", city = "Unknown", creation_time } = v;
    const buckets = getBuckets(creation_time, now, startOfToday);

    if (!byCountry[country]) byCountry[country] = { today: 0, last7: 0, last30: 0, all: 0 };
    if (buckets.today) byCountry[country].today++;
    if (buckets.last7) byCountry[country].last7++;
    if (buckets.last30) byCountry[country].last30++;
    if (buckets.all) byCountry[country].all++;

    const cityKey = `${city}, ${getCountryName(country)}`;
    if (!byCity[cityKey]) byCity[cityKey] = { today: 0, last7: 0, last30: 0, all: 0, country };
    if (buckets.today) byCity[cityKey].today++;
    if (buckets.last7) byCity[cityKey].last7++;
    if (buckets.last30) byCity[cityKey].last30++;
    if (buckets.all) byCity[cityKey].all++;
  }

  const countries = Object.entries(byCountry).map(([country, counts]) => ({
    label: getCountryName(country),
    country,
    ...counts,
  }));

  const cities = Object.entries(byCity).map(([label, counts]) => ({
    label,
    ...counts,
  }));

  return { countries, cities };
}

function getBuckets(timestamp, now, startOfToday) {
  const DAY = 24 * 60 * 60 * 1000;
  const diff = now - timestamp;

  return {
    today: timestamp >= startOfToday,
    last7: diff <= 7 * DAY,
    last30: diff <= 30 * DAY,
    all: true,
  };
}

export const getLeadKeys = (campaign) =>
  Object.entries(campaign?.lead ?? {})
    .filter(([, value]) => value === true)
    .map(([key]) => key);
