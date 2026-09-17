const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const documentRoutes = require("./routes/documentRoutes");
const searchRoutes = require("./routes/searchRoutes");
const studyUnitRoutes = require("./routes/studyUnitRoutes");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173"
  })
);
app.use(express.json());
app.use("/api/search", searchRoutes);
app.use("/api/study-units", studyUnitRoutes);

connectDB();

app.use("/api/documents", documentRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Research & Study Intelligence API is running"
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});