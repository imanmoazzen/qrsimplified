import { API_RESPONSE_TYPES, HTTP_STATUS_CODES } from "../../../../castofly-common/commonConstants.js";

export function accessDeniedResponse(info = "", extra) {
  return {
    message: API_RESPONSE_TYPES.ACCESS_DENIED,
    info,
    ...extra,
  };
}

export function errorResponse(info = "", extra) {
  return {
    message: API_RESPONSE_TYPES.ERROR,
    info,
    ...extra,
  };
}

export function successResponse(info = "", extra) {
  return {
    message: API_RESPONSE_TYPES.SUCCESS,
    info,
    ...extra,
  };
}

export function redirectResponse(location) {
  return {
    statusCode: HTTP_STATUS_CODES.TEMPORARY_REDIRECT,
    headers: { "Location": location, "Content-Type": "text/html" },
  };
}

export function notFoundResponse(info = "", extra) {
  return {
    message: API_RESPONSE_TYPES.NOT_FOUND,
    statusCode: HTTP_STATUS_CODES.NOT_FOUND,
    info,
    ...extra,
  };
}

export function forbiddenResponse(info = "", extra) {
  return {
    message: API_RESPONSE_TYPES.FORBIDDEN,
    statusCode: HTTP_STATUS_CODES.FORBIDDEN,
    info,
    ...extra,
  };
}
