import { jsPDF } from "jspdf";

export function downloadPdf(content: string, filename: string) {
  const doc = new jsPDF();
  
  doc.setFont("courier");
  doc.setFontSize(10);

  // The 'splitTextToSize' method is useful for handling line breaks
  const lines = doc.splitTextToSize(content, 180); // 180 is the max width in mm
  doc.text(lines, 10, 10);
  
  doc.save(filename);
}
