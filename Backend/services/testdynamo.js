import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";

export const testDynamo = async () => {
  try {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION,
    });
    const data = await client.send(new ListTablesCommand({}));
    // console.log(process.env.AWS_REGION);
    // console.log("Connected to DynamoDB. Tables:", data.TableNames);
  } catch (err) {
    console.error("DynamoDB connection failed:", err);
  }
};
