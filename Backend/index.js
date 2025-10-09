import router from "./routes/routes.js";

import express from "express";
import mongoose from "mongoose";
// import bodyParser from "body-parser";
import "dotenv/config";
import cors from "cors";

const app = express();

// change this one later with the deployment url
app.use(
  cors({
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// app.use(bodyParser.json());
app.use(express.json());

// move to .env before deployment
const MONGODB_URI = process.env.MONGODB_URI;
console.log(`Connected to MongoDB: ${mongoose.connection.name}`);

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
