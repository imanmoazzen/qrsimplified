import { SendEmailCommand } from "@aws-sdk/client-ses";

export async function sendEmail(sesClient, message) {
  const cmd = new SendEmailCommand(message);
  await sesClient.send(cmd);
}
