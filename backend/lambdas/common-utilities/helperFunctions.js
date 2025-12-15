export function isUndefinedOrNull(value) {
  return Object.is(undefined, value) || Object.is(null, value);
}

export function isUndefinedOrNullOrEmptyString(value) {
  return isUndefinedOrNull(value) || (typeof value === "string" && value === "");
}

export function validateParameters(params) {
  const invalid = [];
  Object.keys(params).forEach((key) => {
    if (isUndefinedOrNullOrEmptyString(params[key])) {
      invalid.push(`Parameter ${key} must be provided.`);
    }
  });
  if (invalid.length > 0) {
    return { isValid: false, error: invalid.join(", ") };
  }
  return { isValid: true };
}
