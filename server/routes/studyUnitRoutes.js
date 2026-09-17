const express = require("express");
const StudyUnit = require("../models/StudyUnit");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Study unit name is required"
      });
    }

    const studyUnit = await StudyUnit.create({
      name: name.trim(),
      description: description || ""
    });

    res.status(201).json({
      message: "Study unit created successfully",
      studyUnit
    });
  } catch (error) {
    console.error("Study unit creation error:", error);

    res.status(500).json({
      message: "Failed to create study unit"
    });
  }
});

module.exports = router;