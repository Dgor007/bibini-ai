/**
 * Document Generation Utilities
 * Generates PDF and Word documents from CV content
 */

import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Parse CV markdown/text content into structured sections
 */
function parseCVContent(cvContent: string) {
  const lines = cvContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const sections: { [key: string]: string[] } = {
    header: [],
    summary: [],
    skills: [],
    experience: [],
    education: [],
    other: []
  };

  let currentSection = 'header';

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Detect section headers
    if (lowerLine.includes('summary') || lowerLine.includes('profile') || lowerLine.includes('objective')) {
      currentSection = 'summary';
      continue;
    } else if (lowerLine.includes('skill') || lowerLine.includes('certification')) {
      currentSection = 'skills';
      continue;
    } else if (lowerLine.includes('experience') || lowerLine.includes('employment') || lowerLine.includes('work history')) {
      currentSection = 'experience';
      continue;
    } else if (lowerLine.includes('education') || lowerLine.includes('qualification')) {
      currentSection = 'education';
      continue;
    }

    // Add line to current section
    if (line && !line.match(/^[=\-_]{3,}$/)) { // Skip separator lines
      sections[currentSection].push(line);
    }
  }

  return sections;
}

/**
 * Generate and download PDF from CV content
 */
export function generatePDF(cvContent: string, fileName: string = 'CV.pdf') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  const sections = parseCVContent(cvContent);

  // Helper to add text with wrapping
  const addText = (text: string, fontSize: number, isBold: boolean = false, isTitle: boolean = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');

    // Split text into lines that fit
    const splitText = doc.splitTextToSize(text, maxWidth);

    // Check if we need a new page
    if (yPosition + (splitText.length * fontSize * 0.5) > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }

    splitText.forEach((line: string) => {
      doc.text(line, margin, yPosition);
      yPosition += fontSize * 0.5;
    });

    if (isTitle) {
      yPosition += 3; // Extra spacing after titles
    }
  };

  // Header (name and contact)
  if (sections.header.length > 0) {
    addText(sections.header[0], 18, true); // Name
    yPosition += 2;
    sections.header.slice(1).forEach(line => {
      addText(line, 10, false);
    });
    yPosition += 5;
  }

  // Summary
  if (sections.summary.length > 0) {
    addText('PROFESSIONAL SUMMARY', 12, true, true);
    sections.summary.forEach(line => {
      if (!line.match(/^(SUMMARY|Professional Summary|PROFESSIONAL SUMMARY)$/i)) {
        addText(line, 10, false);
      }
    });
    yPosition += 5;
  }

  // Skills
  if (sections.skills.length > 0) {
    addText('SKILLS & CERTIFICATIONS', 12, true, true);
    sections.skills.forEach(line => {
      if (!line.match(/^(SKILLS|Skills & Certifications|SKILLS & CERTIFICATIONS)$/i)) {
        addText(line, 10, false);
      }
    });
    yPosition += 5;
  }

  // Experience
  if (sections.experience.length > 0) {
    addText('PROFESSIONAL EXPERIENCE', 12, true, true);
    sections.experience.forEach(line => {
      if (!line.match(/^(EXPERIENCE|Professional Experience|PROFESSIONAL EXPERIENCE|WORK HISTORY)$/i)) {
        // Bold job titles (lines with | separators)
        const isBold = line.includes('|');
        addText(line, 10, isBold);
      }
    });
    yPosition += 5;
  }

  // Education
  if (sections.education.length > 0) {
    addText('EDUCATION', 12, true, true);
    sections.education.forEach(line => {
      if (!line.match(/^(EDUCATION|Education|EDUCATION & QUALIFICATIONS)$/i)) {
        addText(line, 10, false);
      }
    });
  }

  // Save the PDF
  doc.save(fileName);
}

/**
 * Generate and download Word document from CV content
 */
export async function generateWord(cvContent: string, fileName: string = 'CV.docx') {
  const sections = parseCVContent(cvContent);

  const children: Paragraph[] = [];

  // Header
  if (sections.header.length > 0) {
    children.push(
      new Paragraph({
        text: sections.header[0],
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );

    sections.header.slice(1).forEach(line => {
      children.push(
        new Paragraph({
          text: line,
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        })
      );
    });

    children.push(
      new Paragraph({
        text: '',
        spacing: { after: 300 },
      })
    );
  }

  // Summary
  if (sections.summary.length > 0) {
    children.push(
      new Paragraph({
        text: 'PROFESSIONAL SUMMARY',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 200 },
      })
    );

    sections.summary.forEach(line => {
      if (!line.match(/^(SUMMARY|Professional Summary|PROFESSIONAL SUMMARY)$/i)) {
        children.push(
          new Paragraph({
            text: line,
            spacing: { after: 120 },
          })
        );
      }
    });
  }

  // Skills
  if (sections.skills.length > 0) {
    children.push(
      new Paragraph({
        text: 'SKILLS & CERTIFICATIONS',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 200 },
      })
    );

    sections.skills.forEach(line => {
      if (!line.match(/^(SKILLS|Skills & Certifications|SKILLS & CERTIFICATIONS)$/i)) {
        children.push(
          new Paragraph({
            text: line,
            spacing: { after: 100 },
          })
        );
      }
    });
  }

  // Experience
  if (sections.experience.length > 0) {
    children.push(
      new Paragraph({
        text: 'PROFESSIONAL EXPERIENCE',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 200 },
      })
    );

    sections.experience.forEach(line => {
      if (!line.match(/^(EXPERIENCE|Professional Experience|PROFESSIONAL EXPERIENCE|WORK HISTORY)$/i)) {
        const isBold = line.includes('|');
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                bold: isBold,
              }),
            ],
            spacing: { after: isBold ? 100 : 120 },
          })
        );
      }
    });
  }

  // Education
  if (sections.education.length > 0) {
    children.push(
      new Paragraph({
        text: 'EDUCATION',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 200 },
      })
    );

    sections.education.forEach(line => {
      if (!line.match(/^(EDUCATION|Education|EDUCATION & QUALIFICATIONS)$/i)) {
        children.push(
          new Paragraph({
            text: line,
            spacing: { after: 100 },
          })
        );
      }
    });
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  // Generate and save
  const blob = await Packer.toBlob(doc);
  saveAs(blob, fileName);
}
