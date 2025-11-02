import router from "./routes/routes.js";
import { engine } from "express-handlebars";
import express from "express";
import "dotenv/config";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// for testing
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
// import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"; 
// import { docClient } from "./config/dynamodb.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// change this one later with the deployment url
app.use(
  cors({
    origin: ["http://127.0.0.1:3000", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

const hbs = engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, '../Frontend/HBS/layouts'),
  partialsDir: path.join(__dirname, '../Frontend/HBS/partials'),
});

app.engine('hbs', hbs);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '../Frontend/HBS'));

app.use(express.static(path.join(__dirname, '../Frontend')));

// app.use(bodyParser.json());
app.use(express.json());

// removed mongodb code

// dynamo start
// config/dynamodb.js
console.log("Connected to DynamoDB");
// dynamo end

// app.options("*", cors());
app.use("/", router);

async function testDynamo() {
  try {
    const client = new DynamoDBClient({ region: process.env.AWS_REGION || "ap-southeast-1" });
    const data = await client.send(new ListTablesCommand({}));
    console.log("Connected to DynamoDB. Tables:", data.TableNames);
  } catch (err) {
    console.error("DynamoDB connection failed:", err);
  }
}

testDynamo();

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log(`Server is running on PORT ${PORT}`);
});