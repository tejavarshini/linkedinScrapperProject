const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Profile } = require("./models");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// POST API
app.post("/profiles", async (req, res) => {
  try {
    const profile = await Profile.create(req.body);
    res.status(201).json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET API
app.get("/profiles", async (req, res) => {
  const profiles = await Profile.findAll();
  res.json(profiles);
});
// Root Test Route
app.get("/", (req, res) => {
  res.send("Backend is working ✅");
});

app.listen(5000, () => console.log("✅ Server running on http://localhost:5000"));
