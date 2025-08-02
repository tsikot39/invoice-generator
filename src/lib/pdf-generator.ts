import jsPDF from 'jspdf';
import { Invoice, Client } from '@/types';
import { formatCurrency } from './utils-invoice';

export interface InvoicePDFData {
  invoice: Invoice;
  client: Client;
  companyInfo: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    website?: string;
  };
}

export function generateInvoicePDF(data: InvoicePDFData): jsPDF {
  const { invoice, client, companyInfo } = data;

  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Set font
  doc.setFont('arial');

  // Colors
  const primaryColor: [number, number, number] = [52, 152, 219]; // Blue
  const textColor: [number, number, number] = [44, 62, 80]; // Dark gray
  const lightGray: [number, number, number] = [236, 240, 241]; // Light gray

  // Page dimensions
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;

  let yPosition = margin;

  // Header - Company Info
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.text(companyInfo.name, margin, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.text(companyInfo.address, margin, yPosition);
  yPosition += 5;

  if (companyInfo.phone) {
    doc.text(`Phone: ${companyInfo.phone}`, margin, yPosition);
    yPosition += 5;
  }

  if (companyInfo.email) {
    doc.text(`Email: ${companyInfo.email}`, margin, yPosition);
    yPosition += 5;
  }

  // Invoice Title
  yPosition += 10;
  doc.setFontSize(32);
  doc.setTextColor(...primaryColor);
  doc.text('INVOICE', pageWidth - margin - doc.getTextWidth('INVOICE'), yPosition);

  // Invoice Details
  yPosition += 15;
  doc.setFontSize(12);
  doc.setTextColor(...textColor);

  const invoiceDetailsX = pageWidth - margin - 60;
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, invoiceDetailsX, yPosition);
  yPosition += 6;
  doc.text(
    `Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`,
    invoiceDetailsX,
    yPosition
  );
  yPosition += 6;
  doc.text(
    `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`,
    invoiceDetailsX,
    yPosition
  );
  yPosition += 6;

  // Status with color
  const statusColors: Record<string, [number, number, number]> = {
    draft: [149, 165, 166],
    sent: [52, 152, 219],
    paid: [46, 204, 113],
    overdue: [231, 76, 60],
    void: [127, 140, 141],
  };

  doc.setTextColor(...(statusColors[invoice.status] || statusColors.draft));
  doc.text(`Status: ${invoice.status.toUpperCase()}`, invoiceDetailsX, yPosition);

  // Client Information
  yPosition += 20;
  doc.setFontSize(14);
  doc.setTextColor(...textColor);
  doc.text('Bill To:', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(12);
  doc.text(client.name, margin, yPosition);
  yPosition += 6;

  if (client.company) {
    doc.text(client.company, margin, yPosition);
    yPosition += 6;
  }
  doc.text(client.email, margin, yPosition);
  yPosition += 6;

  if (client.phone) {
    doc.text(client.phone, margin, yPosition);
    yPosition += 6;
  }

  // Address
  if (client.address) {
    const address = client.address;
    if (address.street) {
      doc.text(address.street, margin, yPosition);
      yPosition += 6;
    }

    const cityStateZip = [address.city, address.state, address.zipCode].filter(Boolean).join(', ');
    if (cityStateZip) {
      doc.text(cityStateZip, margin, yPosition);
      yPosition += 6;
    }

    if (address.country) {
      doc.text(address.country, margin, yPosition);
      yPosition += 6;
    }
  }

  // Items Table
  yPosition += 15;

  // Table headers
  const tableHeaders = ['Description', 'Qty', 'Unit Price', 'Tax Rate', 'Total'];
  const columnWidths = [80, 20, 30, 25, 30];
  const tableStartX = margin;
  const tableStartY = yPosition;

  // Header background
  doc.setFillColor(...lightGray);
  doc.rect(tableStartX, tableStartY - 3, pageWidth - 2 * margin, 8, 'F');

  // Header text
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.setFont('arial', 'bold');

  let currentX = tableStartX;
  tableHeaders.forEach((header, index) => {
    doc.text(header, currentX + 2, tableStartY + 2);
    currentX += columnWidths[index];
  });

  yPosition += 10;

  // Table rows
  doc.setFont('arial', 'normal');

  invoice.items.forEach((item, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    currentX = tableStartX;

    // Alternate row background
    if (index % 2 === 1) {
      doc.setFillColor(248, 249, 250);
      doc.rect(tableStartX, yPosition - 3, pageWidth - 2 * margin, 8, 'F');
    }

    // Item data
    const rowData = [
      item.name + (item.description ? ` - ${item.description}` : ''),
      item.quantity.toString(),
      formatCurrency(item.unitPrice),
      `${item.taxRate}%`,
      formatCurrency(item.total),
    ];

    rowData.forEach((data, colIndex) => {
      const cellWidth = columnWidths[colIndex];

      if (colIndex === 0) {
        // Description might be long, handle text wrapping
        const lines = doc.splitTextToSize(data, cellWidth - 4);
        doc.text(lines, currentX + 2, yPosition + 2);
      } else {
        // Right align numbers
        const textWidth = doc.getTextWidth(data);
        doc.text(data, currentX + cellWidth - textWidth - 2, yPosition + 2);
      }

      currentX += cellWidth;
    });

    yPosition += 8;
  });

  // Totals
  yPosition += 10;
  const totalsX = pageWidth - margin - 60;

  doc.setFont('arial', 'normal');
  doc.text(`Subtotal: ${formatCurrency(invoice.subtotal)}`, totalsX, yPosition);
  yPosition += 6;

  doc.text(`Tax: ${formatCurrency(invoice.taxAmount)}`, totalsX, yPosition);
  yPosition += 6;

  if (invoice.discountAmount && invoice.discountAmount > 0) {
    doc.text(`Discount: -${formatCurrency(invoice.discountAmount)}`, totalsX, yPosition);
    yPosition += 6;
  }

  // Total line
  doc.setLineWidth(0.5);
  doc.line(totalsX, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  doc.setFont('arial', 'bold');
  doc.setFontSize(14);
  doc.text(`Total: ${formatCurrency(invoice.total)}`, totalsX, yPosition);

  // Notes
  if (invoice.notes) {
    yPosition += 20;
    doc.setFont('arial', 'bold');
    doc.setFontSize(12);
    doc.text('Notes:', margin, yPosition);
    yPosition += 8;

    doc.setFont('arial', 'normal');
    doc.setFontSize(10);
    const noteLines = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin);
    doc.text(noteLines, margin, yPosition);
    yPosition += noteLines.length * 5;
  }

  // Terms and Conditions
  if (invoice.termsAndConditions) {
    yPosition += 10;
    doc.setFont('arial', 'bold');
    doc.setFontSize(12);
    doc.text('Terms and Conditions:', margin, yPosition);
    yPosition += 8;

    doc.setFont('arial', 'normal');
    doc.setFontSize(10);
    const termLines = doc.splitTextToSize(invoice.termsAndConditions, pageWidth - 2 * margin);
    doc.text(termLines, margin, yPosition);
  }

  // Footer
  const footerY = pageHeight - 20;
  doc.setFontSize(8);
  doc.setTextColor(127, 140, 141);
  doc.text('Thank you for your business!', pageWidth / 2, footerY, {
    align: 'center',
  });

  return doc;
}

export function downloadInvoicePDF(data: InvoicePDFData, filename?: string): void {
  const doc = generateInvoicePDF(data);
  const finalFilename = filename || `invoice-${data.invoice.invoiceNumber}.pdf`;
  doc.save(finalFilename);
}

export function getInvoicePDFBlob(data: InvoicePDFData): Blob {
  const doc = generateInvoicePDF(data);
  return doc.output('blob');
}
