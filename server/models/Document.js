const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true
    },

    fileName: {
      type: String,
      required: true
    },

    filePath: {
      type: String,
      required: true
    },

    studyUnitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyUnit",
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Document = mongoose.model("Document", documentSchema);

module.exports = Document;