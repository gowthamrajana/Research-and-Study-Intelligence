const express = require("express");
const generateEmbedding = require("../services/embeddingService");
const Chunk = require("../models/Chunk");
const generateAnswer = require("../services/answerService");
const mongoose = require("mongoose");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { question, studyUnitId } = req.body;

    if (!question || !studyUnitId) {
      return res.status(400).json({
        message: "Question and study unit are required"
      });
    }

    const questionEmbedding = await generateEmbedding(question);

    const results = await Chunk.aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: questionEmbedding,
          numCandidates: 100,
          limit: 5,
          filter: {
            studyUnitId: new mongoose.Types.ObjectId(studyUnitId)
          }
        }
      },
      {
        $project: {
          _id: 0,
          text: 1,
          filename: 1,
          studyUnitId: 1,
          score: {
            $meta: "vectorSearchScore"
          }
        }
      }
    ]);
const answer = await generateAnswer(question, results);

    res.json({
      question,
      answer,
      sources: results.map((result) => ({
        text: result.text,
        filename: result.filename,
        score: result.score
      }))
    });

  } catch (error) {
    console.error("Search failed:", error.message);

    res.status(500).json({
      message: "Search failed"
    });
  }
});

module.exports = router;