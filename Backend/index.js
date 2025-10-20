import router from "./routes/routes.js";
import { engine } from "express-handlebars";
import express from "express";
import mongoose from "mongoose";
// import bodyParser from "body-parser";
import "dotenv/config";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

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

// move to .env before deployment
const MONGODB_URI = process.env.MONGODB_URI;

// mongoose implementation
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log(`Connected to MongoDB: ${mongoose.connection.name}`))
  .catch((err) => console.error("MongoDB connection error:", err.message));

// stop (remove after testing)

// app.options("*", cors());
app.use("/", router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log(`Server is running on PORT ${PORT}`);
});