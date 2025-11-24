import router from "./routes/routes.js";
import { engine } from "express-handlebars";
import express from "express";
import "dotenv/config";
import cors from "cors";
import path from "path";
import session from "express-session";
import { fileURLToPath } from "url";

// for testing
import { testDynamo } from "./services/testdynamo.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT;

// for testing, move values to .env
app.use(
  cors({
    origin: [
      process.env.LOCAL_HOST_1,
      process.env.LOCAL_HOST_2,
      process.env.LOCAL_WEBSITE_URL,
    ],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

const hbs = engine({
  extname: ".hbs",
  defaultLayout: "main",
  layoutsDir: path.join(__dirname, "../Frontend/HBS/layouts"),
  partialsDir: path.join(__dirname, "../Frontend/HBS/partials"),
});

app.engine("hbs", hbs);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "../Frontend/HBS"));

app.use(express.static(path.join(__dirname, "../Frontend")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// sessions
/*
  secure: true and httponly: true causes error
*/
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: 60000 * 60, // 1 hour
      sameSite: "lax",
      secure: false,
      httpOnly: false,
    },
  })
);

// delete after
console.log("Secret: ", process.env.SESSION_SECRET);

app.use("/", router);

// log tables for testing
testDynamo();

app.listen(PORT, function () {
  console.log(`Server is running on PORT ${PORT}`);
});
