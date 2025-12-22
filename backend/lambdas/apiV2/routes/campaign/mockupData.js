import { v4 as uuid } from "uuid";

import { CAMPAIGN_STATUS } from "../../../../../castofly-common/campaigns.js";
import { getCampaignAnalytics } from "./utils.js";

// THIS DATA IS GENERATED FOR IMAN'S DEMO

export const IMAN_USER_IDS_IN_BOTH_ENV = [
  "74185438-0051-70e0-b292-15eaf51fb71d",
  "c4c814d8-7091-7095-9c9a-97fc762e42a1",
]; // dev and prod

const COUNTRY_MODES = {
  US_ONLY: "US_ONLY",
  CA_ONLY: "CA_ONLY",
  MIXED: "MIXED",
};

export const generateMockupDataForDemo = () => {
  const c1 = buildMockCampaignResponse({
    name: "VMX 2025",
    visitsCount: 7012,
    leadsCount: 1,
    countryMode: COUNTRY_MODES.US_ONLY,
    creation_time: 1736208000000, // Jan 7, 2025
  });

  const c2 = buildMockCampaignResponse({
    name: "WVC 2025",
    visitsCount: 5501,
    leadsCount: 1,
    countryMode: COUNTRY_MODES.US_ONLY,
    creation_time: 1738627200000, // Feb 4, 2025
  });

  const c3 = buildMockCampaignResponse({
    name: "US Campaign 2025",
    visitsCount: 9820,
    leadsCount: 801,
    countryMode: COUNTRY_MODES.US_ONLY,
    creation_time: 1740787200000, // Mar 1, 2025
  });

  const c4 = buildMockCampaignResponse({
    name: "NAVC Ignite 2024",
    visitsCount: 2065,
    leadsCount: 1,
    countryMode: COUNTRY_MODES.MIXED,
    creation_time: 1706745600000, // Feb 1, 2024
  });

  const c5 = buildMockCampaignResponse({
    name: "CVMA 2024",
    visitsCount: 809,
    leadsCount: 1,
    countryMode: COUNTRY_MODES.CA_ONLY,
    creation_time: 1711929600000, // Apr 1, 2024
  });

  return [c1, c2, c3, c4, c5];
};

function buildMockCampaignResponse({
  name,
  visitsCount = 1200,
  leadsCount = 310,
  countryMode = COUNTRY_MODES.MIXED,
  creation_time,
}) {
  const campaign_id = uuid();
  const status = CAMPAIGN_STATUS.LIVE;

  const visitWeights = {
    US: [
      { city: "New York", w: 14 },
      { city: "Los Angeles", w: 10 },
      { city: "Chicago", w: 8 },
      { city: "Houston", w: 7 },
      { city: "Phoenix", w: 6 },
      { city: "Philadelphia", w: 5 },
      { city: "San Diego", w: 4 },
      { city: "Dallas", w: 4 },
      { city: "San Jose", w: 3 },
      { city: "Seattle", w: 3 },
    ],
    CA: [
      { city: "Toronto", w: 12 },
      { city: "Vancouver", w: 10 },
      { city: "West Vancouver", w: 6 },
      { city: "Montreal", w: 8 },
      { city: "Calgary", w: 6 },
      { city: "Edmonton", w: 4 },
      { city: "Ottawa", w: 4 },
      { city: "Winnipeg", w: 2 },
      { city: "Quebec City", w: 2 },
      { city: "Victoria", w: 1 },
    ],
  };

  // base weights (used only for MIXED)
  const BASE_COUNTRY_WEIGHTS = [
    { country: "US", w: 62 },
    { country: "CA", w: 38 },
  ];

  const COUNTRY_WEIGHTS = getCountryWeights(countryMode, BASE_COUNTRY_WEIGHTS);
  const allowedCountries = new Set(COUNTRY_WEIGHTS.map((x) => x.country));

  // optional safety: ensure the weights & cities exist
  for (const c of allowedCountries) {
    if (!visitWeights[c]) throw new Error(`Missing visitWeights for country ${c}`);
  }

  const campaign = {
    campaign_id,
    lead: { name: true, email: true },
  };

  const visits = generateVisits(visitsCount, COUNTRY_WEIGHTS, visitWeights);
  const leads = generateLeads(leadsCount);

  return {
    ...campaign,
    name,
    creation_time,
    status,
    visits: visits.length,
    analytics: getCampaignAnalytics(visits),
    leads,
  };
}

function getCountryWeights(mode, base) {
  if (mode === COUNTRY_MODES.US_ONLY) return [{ country: "US", w: 1 }];
  if (mode === COUNTRY_MODES.CA_ONLY) return [{ country: "CA", w: 1 }];
  return base; // MIXED
}

function generateVisits(count, COUNTRY_WEIGHTS, visitWeights) {
  const now = Date.now();
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const startOfToday = d.getTime();

  const DAY = 24 * 60 * 60 * 1000;
  const start30 = now - 30 * DAY;

  // ✅ guarantee at least 3% today (min 1)
  const minToday = Math.max(1, Math.ceil(count * 0.03));
  const remaining = count - minToday;

  const visits = new Array(count);
  let idx = 0;

  // 1) today
  for (let i = 0; i < minToday; i++) {
    const chosenCountry = weightedPick(COUNTRY_WEIGHTS); // { country }
    const chosenCity = weightedPick(visitWeights[chosenCountry.country]);

    visits[idx++] = {
      visit_id: `v_${idx.toString().padStart(5, "0")}`,
      country: chosenCountry.country,
      city: chosenCity.city,
      creation_time: randInt(startOfToday, now),
    };
  }

  // 2) last 30 days before today
  for (let i = 0; i < remaining; i++) {
    const chosenCountry = weightedPick(COUNTRY_WEIGHTS);
    const chosenCity = weightedPick(visitWeights[chosenCountry.country]);

    visits[idx++] = {
      visit_id: `v_${idx.toString().padStart(5, "0")}`,
      country: chosenCountry.country,
      city: chosenCity.city,
      creation_time: randInt(start30, startOfToday - 1),
    };
  }

  shuffleInPlace(visits);
  return visits;
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function generateLeads(count) {
  const firstNames = [
    "Ava",
    "Olivia",
    "Emma",
    "Liam",
    "Noah",
    "Ethan",
    "Mia",
    "Sophia",
    "Isabella",
    "Amelia",
    "Charlotte",
    "Harper",
    "Evelyn",
    "Abigail",
    "Emily",
    "Ella",
    "Avery",
    "Scarlett",
    "Grace",
    "Chloe",
    "Jack",
    "Henry",
    "Lucas",
    "Mason",
    "Logan",
    "James",
    "Benjamin",
    "Jacob",
    "Michael",
    "Daniel",
    "Alexander",
    "William",
    "Matthew",
    "Samuel",
    "David",
    "Joseph",
    "Carter",
    "Owen",
    "Wyatt",
    "John",
    "Zoe",
    "Layla",
    "Hannah",
    "Nora",
    "Riley",
    "Aria",
    "Lily",
    "Ellie",
    "Sofia",
    "Leah",
  ];

  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Anderson",
    "Thomas",
    "Taylor",
    "Moore",
    "Jackson",
    "Martin",
    "Lee",
    "Perez",
    "Thompson",
    "White",
    "Harris",
    "Sanchez",
    "Clark",
    "Ramirez",
    "Lewis",
    "Robinson",
    "Walker",
    "Young",
    "Allen",
    "King",
    "Wright",
    "Scott",
    "Torres",
    "Nguyen",
    "Hill",
    "Flores",
    "Green",
    "Adams",
    "Nelson",
    "Baker",
    "Hall",
    "Rivera",
    "Campbell",
    "Mitchell",
    "Carter",
    "Roberts",
  ];

  const domains = [
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "icloud.com",
    "proton.me",
    "aol.com",
    "live.com",
  ];

  const usedEmails = new Set();
  const leads = [];

  for (let i = 0; i < count; i++) {
    const first = pick(firstNames);
    const last = pick(lastNames);

    const base = `${first}.${last}`;
    const domain = pick(domains);

    let email = "";
    for (let tries = 0; tries < 10; tries++) {
      const suffix = String(randInt(1, 999));
      const candidate = `${base}${suffix}@${domain}`;
      if (!usedEmails.has(candidate)) {
        email = candidate;
        usedEmails.add(candidate);
        break;
      }
    }
    if (!email) email = `${base}${Date.now()}@${domain}`;

    leads.push({
      lead_id: `l_${(i + 1).toString().padStart(4, "0")}`,
      name: `${first} ${last}`,
      email,
      creation_time: Date.now() - randInt(0, 30) * 24 * 60 * 60 * 1000,
    });
  }

  return leads;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function weightedPick(items) {
  const total = items.reduce((s, it) => s + (it.w ?? 1), 0);
  let r = Math.random() * total;
  for (const it of items) {
    r -= it.w ?? 1;
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}
