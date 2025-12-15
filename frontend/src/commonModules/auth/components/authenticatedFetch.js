import { getAccessToken } from "./cognitoUtils.js";

/**
 *
 * @param {String} url
 * @param {Object} params
 * @returns
 */
const authenticatedFetch = async (url, params) => {
  const accessToken = await getAccessToken();
  try {
    const res = await fetch(url, {
      ...params,
      headers: {
        Authorization: accessToken,
      },
    });

    if (res.ok) return res;

    // response not OK, try to respond to the possible causes:
    throw new Error("response not ok, unhandled status code in authenticatedFetch.");
  } catch (err) {
    // Some other kind of network error
    console.log(err);
  }
};

export default authenticatedFetch;
