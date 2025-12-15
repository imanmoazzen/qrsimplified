import axios from "axios";
import { sleep } from "castofly-common";

// exponential backoff algorithm that retries request in the event of non-auth-related failure
export default async function requestWithRetry(params, initialDelay = 500, maxTries = 1) {
  let tries = 0;
  let lastError;
  while (tries < maxTries) {
    try {
      return await axios(params);
    } catch (err) {
      console.log(err?.response);
      if ([401, 403].includes(err?.response?.status)) throw Error("Request failed: Bad auth", { cause: err });
      // sleep for twice as long with each additional try:
      // e.g. 500ms, 1000ms, 2000ms, 4000ms...
      await sleep(initialDelay * 2 ** tries);
      tries++;
      lastError = err;
    }
  }
  throw Error("Request failed: Exceeded maximum retries.", { cause: lastError });
}
