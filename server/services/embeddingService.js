const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const generateEmbedding = async (text) => {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-2",
    contents: text,
    config: {
      outputDimensionality: 768
    }
  });

  return response.embeddings[0].values;
};

module.exports = generateEmbedding;