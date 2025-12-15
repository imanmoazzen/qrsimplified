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

    if (!byCity[city]) byCity[city] = { today: 0, last7: 0, last30: 0, all: 0 };
    if (buckets.today) byCity[city].today++;
    if (buckets.last7) byCity[city].last7++;
    if (buckets.last30) byCity[city].last30++;
    if (buckets.all) byCity[city].all++;
  }
  return {
    countries: Object.entries(byCountry).map(([country, counts]) => ({
      country,
      ...counts,
    })),
    cities: Object.entries(byCity).map(([city, counts]) => ({
      city,
      ...counts,
    })),
  };
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
