const fs = require("fs");

const { PDFParse } = require("pdf-parse");

const extractTextFromPDF = async (filePath) => {
  const pdfBuffer = fs.readFileSync(filePath);

  const parser = new PDFParse({
    data: pdfBuffer
  });

  const pdfData = await parser.getText();

  await parser.destroy();

  return pdfData.text;
};

module.exports = extractTextFromPDF;