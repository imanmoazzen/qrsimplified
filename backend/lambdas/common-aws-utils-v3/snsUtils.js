import { PublishCommand } from "@aws-sdk/client-sns";

// assumes that 'message' is a string
export async function publishMessageToTopic(snsClient, message, topicArn) {
  const command = new PublishCommand({
    TopicArn: topicArn,
    Message: message,
  });
  return await snsClient.send(command);
}

export async function publishObjectToTopic(snsClient, object, topicArn) {
  return await publishMessageToTopic(snsClient, JSON.stringify(object), topicArn);
}

// for use on lambda functions which use SNS as an event source
export function snsExtractBodyFromLambdaEvent(event) {
  if (event.Records && event.Records.length === 1) {
    const record = event.Records[0];
    const { Sns } = record;
    const { Message } = Sns;
    return JSON.parse(Message);
  }
  throw Error(`This event contains 0 or more than 1 Record, which is not expected: ${event}`);
}
