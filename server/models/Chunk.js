const mongoose = require("mongoose");

const chunkSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true
    },

    embedding: {
      type: [Number],
      required: true
    },

    filename: {
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

module.exports = mongoose.model("Chunk", chunkSchema);