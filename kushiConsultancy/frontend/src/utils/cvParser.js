import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const parseCVFile = async (file) => {
  const fileType = file.type;
  let text = '';

  try {
    if (fileType === 'application/pdf') {
      text = await extractPdfText(file);
    } else if (
      fileType === 'application/msword' ||
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      text = await extractDocxText(file);
    } else {
      throw new Error('Unsupported file format');
    }

    const extracted = extractEmailAndName(text);
    return extracted;
  } catch (error) {
    console.error('Error parsing CV:', error);
    return { email: '', name: '', error: error.message };
  }
};

const extractPdfText = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';

  for (let i = 0; i < pdf.numPages; i++) {
    const page = await pdf.getPage(i + 1);
    const textContent = await page.getTextContent();
    text += textContent.items.map((item) => item.str).join(' ');
    text += '\n';
  }

  return text;
};

const extractDocxText = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

const extractEmailAndName = (text) => {
  const emailRegex = /[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const emailMatch = text.match(emailRegex);
  const email = emailMatch ? emailMatch[0] : '';

  const nameMatch = extractName(text);
  const name = nameMatch || '';

  return { email, name };
};

const extractName = (text) => {
  const lines = text.split('\n').map((line) => line.trim()).filter((line) => line);

  for (const line of lines) {
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4) {
      const isLikelyName = words.every((word) => /^[a-zA-Z'-]+$/.test(word));
      if (isLikelyName) {
        return words.join(' ');
      }
    }
  }

  return '';
};
