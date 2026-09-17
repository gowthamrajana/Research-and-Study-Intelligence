const express = require("express");
const multer = require("multer");
const fs = require("fs");

const chunkText = require("../services/chunkService");
const Chunk = require("../models/Chunk");
const generateEmbedding = require("../services/embeddingService");
const extractTextFromPDF = require("../services/pdfService");
const Document = require("../models/Document");

const router = express.Router();

const upload = multer({
  dest: "uploads/"
});

router.post("/upload", upload.array("files"), async (req, res) => {
  try {
    const { studyUnitId } = req.body;

    if (!studyUnitId) {
      return res.status(400).json({
        message: "Study unit is required"
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "No PDF files uploaded"
      });
    }

    const uploadedDocuments = [];

    for (const file of req.files) {
      const text = await extractTextFromPDF(file.path);

      const chunks = chunkText(text);

      for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk);

        await Chunk.create({
          text: chunk,
          embedding,
          filename: file.originalname,
          studyUnitId
        });
      }

      await Document.create({
        originalName: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        studyUnitId
      });

      uploadedDocuments.push(file.originalname);
    }

    res.status(201).json({
      message: "PDFs processed successfully",
      documents: uploadedDocuments
    });
  } catch (error) {
    console.error("Upload error:", error);

    res.status(500).json({
      message: "Failed to process PDFs"
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const { studyUnitId } = req.query;

    if (!studyUnitId) {
      return res.status(400).json({
        message: "Study unit is required"
      });
    }

    const documents = await Chunk.distinct("filename", {
      studyUnitId
    });

    res.status(200).json({
      documents
    });
  } catch (error) {
    console.error("Document fetch error:", error);

    res.status(500).json({
      message: "Failed to fetch documents"
    });
  }
});

router.delete("/", async (req, res) => {
  try {
    const { studyUnitId, filename } = req.query;

    if (!studyUnitId || !filename) {
      return res.status(400).json({
        message: "Study unit and filename are required"
      });
    }

    const document = await Document.findOne({
      originalName: filename,
      studyUnitId
    });

    if (!document) {
      return res.status(404).json({
        message: "Document not found"
      });
    }

    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    const result = await Chunk.deleteMany({
      studyUnitId,
      filename
    });

    await Document.deleteOne({
      _id: document._id
    });

    res.status(200).json({
      message: "Document deleted successfully",
      deletedChunks: result.deletedCount
    });
  } catch (error) {
    console.error("Document deletion error:", error);

    res.status(500).json({
      message: "Failed to delete document"
    });
  }
});

module.exports = router;