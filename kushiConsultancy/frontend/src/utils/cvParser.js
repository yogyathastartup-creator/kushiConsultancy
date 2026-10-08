import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export const parseCVFile = async (file) => {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  let text = '';

  try {
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      text = await extractPdfText(file);
    } else if (
      fileType === 'application/msword' ||
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.doc') ||
      fileName.endsWith('.docx')
    ) {
      text = await extractDocxText(file);
    } else {
      throw new Error('Unsupported file format');
    }

    // Check if PDF is image-based (no extractable text)
    if (text.trim().length < 50) {
      return {
        email: '',
        name: '',
        phone: '',
        status: 'image_pdf',
        message: 'Unable to extract text from this PDF (appears to be scanned/image-based). Please enter your details manually.'
      };
    }

    const extracted = extractEmailAndName(text);

    // Determine extraction status
    let status = 'success';
    let message = '';

    if (!extracted.name && !extracted.email) {
      status = 'partial';
      message = 'Could not extract name and email. Please enter them manually.';
    } else if (!extracted.name) {
      status = 'partial';
      message = 'Could not extract name. Please enter it manually.';
    } else if (!extracted.email) {
      status = 'partial';
      message = 'Could not extract email. Please enter it manually.';
    }

    return {
      ...extracted,
      status,
      message
    };
  } catch (error) {
    console.error('Error parsing CV:', error);
    return {
      email: '',
      name: '',
      phone: '',
      status: 'error',
      message: 'Error parsing file. Please enter your details manually.'
    };
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

  const phoneMatch = extractPhone(text);
  const phone = phoneMatch || '';

  return { email, name, phone };
};

const extractName = (text) => {
  const candidates = [];

  // Strategy 1: Extract from lines before email (contact info section)
  const emailRegex = /[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    const emailIndex = text.indexOf(emailMatch[0]);
    const beforeEmail = text.substring(0, emailIndex).split('\n').reverse();

    for (const line of beforeEmail.slice(0, 3)) {
      const name = extractNameFromLine(line);
      if (name) {
        candidates.push({ name, score: 10 });
        break;
      }
    }
  }

  // Strategy 2: Extract from first few lines (header section)
  const lines = text.split('\n').map((line) => line.trim()).filter((line) => line);
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const name = extractNameFromLine(lines[i]);
    if (name) {
      candidates.push({ name, score: 8 - i * 0.5 });
    }
  }

  // Strategy 3: Look for lines near "Contact" or "Personal Info" sections
  const contactSectionRegex = /contact|personal\s+info|about/i;
  for (let i = 0; i < lines.length; i++) {
    if (contactSectionRegex.test(lines[i])) {
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const name = extractNameFromLine(lines[j]);
        if (name) {
          candidates.push({ name, score: 7 });
          break;
        }
      }
    }
  }

  // Return candidate with highest score
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].name;
  }

  return '';
};

const extractNameFromLine = (line) => {
  if (!line || line.length < 3) return '';

  // Clean up the line
  let cleanLine = line;
  cleanLine = cleanLine.replace(/[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '');
  cleanLine = cleanLine.replace(/https?:\/\/\S+/g, '');
  cleanLine = cleanLine.replace(/www\.\S+/g, '');
  cleanLine = cleanLine.replace(/github\.com\S+/g, '');
  cleanLine = cleanLine.replace(/linkedin\.com\S+/g, '');
  cleanLine = cleanLine.trim();

  if (!cleanLine || cleanLine.length < 3) return '';

  // Split by common delimiters
  const segments = cleanLine.split(/[\|•,]/);
  const segment = segments[0].trim();
  const words = segment.split(/\s+/).filter((w) => w.length > 0);

  // Extract up to 3 consecutive name words (first + middle + last name)
  let nameCandidate = '';
  let wordCount = 0;

  for (let j = 0; j < Math.min(words.length, 4); j++) {
    const cleanWord = words[j].replace(/[^a-zA-Z'-]/g, '');

    // Stop if not a valid name word
    if (!/^[a-zA-Z'-]+$/.test(cleanWord) || cleanWord.length < 2) {
      break;
    }

    // Limit to 3 words for name (first + middle + last)
    if (wordCount >= 3) {
      break;
    }

    nameCandidate = (nameCandidate ? nameCandidate + ' ' : '') + cleanWord;
    wordCount++;
  }

  return nameCandidate || '';
};

const extractPhone = (text) => {
  const phoneRegexes = [
    /\+?91[\s-]?[6-9]\d[\s-]?\d{4}[\s-]?\d{4}/g,
    /\+\d{1,3}[\s-]?\d[\s-]?\d{3,4}[\s-]?\d{3,4}/g,
    /(?:tel:)?[\+]?[(]?[0-9]{3}[)\s\-]?[0-9]{3}[\s\-]?[0-9]{4,6}/g
  ];

  for (const regex of phoneRegexes) {
    const match = text.match(regex);
    if (match) {
      return match[0].replace(/[\s-()]/g, '').substring(0, 20);
    }
  }

  return '';
};
