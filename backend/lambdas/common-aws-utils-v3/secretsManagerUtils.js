import { GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

export async function getSecret(secretsManagerClient, secretId) {
  const cmd = new GetSecretValueCommand({
    SecretId: secretId,
  });
  let response;
  try {
    response = await secretsManagerClient.send(cmd);
    return JSON.parse(response.SecretString);
  } catch (err) {
    // assume that the JSON was not parseable- so the secret might just be plaintext:
    return response?.SecretString;
  }
}
