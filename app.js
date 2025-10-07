import express from "express";
import { engine } from "express-handlebars";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configure Handlebars
app.engine("hbs", engine({
  extname: ".hbs",
  helpers: {
    assetPath: (filePath) => `/${filePath}`
  }
}));
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Route
app.get("/login", (req, res) => {
  res.render("login", { title: "Login Page" });
});

// Start server
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
