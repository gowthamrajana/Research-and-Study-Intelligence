const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const generateAnswer = async (question, chunks) => {
  const context = chunks
    .map((chunk, index) => {
      return `Source ${index + 1} — ${chunk.filename}:\n${chunk.text}`;
    })
    .join("\n\n");

  const prompt = `
You are a study assistant.

Answer the student's question using only the study material provided below.

The study material may come from multiple documents.

If the question asks for a comparison, difference, similarity, or relationship,
use information from the relevant documents and clearly explain the comparison.

Keep the answer clear and useful for exam preparation.

Do not invent information that is not present in the study material.

If the answer cannot be found in the study material, say:
"I couldn't find this information in the uploaded documents."

Study material:
${context}

Student question:
${question}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt
  });

  return response.text;
};

module.exports = generateAnswer;