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

// change this one later with the deployment url
// use .env for allowed origins
app.use(
  cors({
    origin: ["http://127.0.0.1:3000", "http://localhost:3000"],
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
// move secret to .env before deployment
app.use(
  session({
    secret: "cssweng-bakhita",
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: 60000 * 60, // 1 hour
      sameSite: "lax",
      secure: false, // set to true if using https
      httpOnly: false, // try changing to true later
    },
  })
);

// app.options("*", cors());
app.use("/", router);

// log tables for testing
testDynamo();

app.listen(PORT, function () {
  console.log(process.env.PORT); // REMOVE AFTER TESTING
  console.log(`Server is running on PORT ${PORT}`);
});
