/* eslint-disable no-useless-escape */
export const EMAIL_VALIDATION_REGEX = /^[\w-\.\+]+@([\w-]+\.)+[\w-]{2,4}$/;

export const isEmailValid = (email) => {
  if (email === undefined || email === null || email.length === 0) return false;
  return Boolean(email.match(EMAIL_VALIDATION_REGEX));
};

export const getDomain = (email) => {
  let domain;
  const parts = email.split("@");
  if (parts.length > 1 && parts[1].trim() !== "") domain = parts[1];

  return domain;
};

export const isValidCompanyDomain = (domain) => {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
  if (!domainRegex.test(domain)) return false;

  const personalEmailDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com"];
  if (personalEmailDomains.includes(domain.toLowerCase())) return false;

  return true;
};

export const validateEmailAddresses = (emailString) => {
  if (!emailString) return null;

  const emails = emailString.split(/[\s,;]+/);
  const results = {};

  emails.forEach((email) => {
    if (email.trim() !== "") results[email] = EMAIL_VALIDATION_REGEX.test(email);
  });

  return results;
};
