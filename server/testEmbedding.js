require("dotenv").config();

const generateEmbedding = require("./services/embeddingService");

const test = async () => {
  try {
    const text = "Deadlock occurs when processes wait for resources.";

    const embedding = await generateEmbedding(text);

    console.log("Embedding generated successfully.");
    console.log("Number of dimensions:", embedding.length);
    console.log("First 5 values:", embedding.slice(0, 5));
  } catch (error) {
    console.error("Embedding failed:", error.message);
  }
};

test();