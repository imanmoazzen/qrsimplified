let memoizedPromises = {};
let memoizedEntries = {};

export function clearPromiseMemoizerCache() {
  memoizedPromises = {};
  memoizedEntries = {};
}

export async function promiseMemoizer(targetFunction, memoKey) {
  if (memoizedPromises[memoKey]) {
    memoizedEntries[memoKey] = await memoizedPromises[memoKey];
  } else if (!memoizedEntries[memoKey]) {
    memoizedPromises[memoKey] = targetFunction();
    memoizedEntries[memoKey] = await memoizedPromises[memoKey];
  }

  return memoizedEntries[memoKey];
}

export function addMemoEntry(entry, memoKey) {
  memoizedEntries[memoKey] = entry;
}

export function logCaches() {
  console.log("PROMISE MEMOIZER CACHES:");
  console.log(" - PROMISES:");
  console.log(memoizedPromises);
  console.log(" - CACHE ENTRIES:");
  console.log(memoizedEntries);
}

export function logCacheAmounts() {
  console.log("PROMISE MEMOIZER CACHES:");
  console.log(
    `PROMISES: ${Object.keys(memoizedPromises).length}, CACHE ENTRIES: ${Object.keys(memoizedEntries).length}`
  );
}
