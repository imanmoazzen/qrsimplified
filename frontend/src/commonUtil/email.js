import { isEmailValid } from "castofly-common";

export const getCleanEmails = (recipientEmail) => {
  let temp = recipientEmail.replace(/;/g, ","); // replace ; with ,
  let emails = temp.replace(/\s/g, "").split(","); // remove space and split
  emails = emails.filter((e) => e); // remove empty elements (in case , or ; is at the end)

  return emails;
};

export const convertToOneString = (recipients) => {
  let string = "";
  recipients.forEach((recipient, index) => (string += recipient + (index !== recipients.length - 1 ? "," : "")));

  return string;
};

export const isValidEmails = (emails) => {
  let valid = emails.length > 0 ? true : false;
  emails.forEach((email) => {
    if (!isEmailValid(email)) valid = false;
  });

  return valid;
};

export const removeHTMLTags = (body) => {
  return body.replace(/<[^>]*>?/gm, "");
};
