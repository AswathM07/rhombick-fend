import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toWords } from 'number-to-words'; // Install with: npm install number-to-words
import logo from '../assets/Rhombick.png'; // Ensure you have a logo image in your assets

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString; // Return original string if formatting fails
  }
};

export const generateInvoicePdf = (invoice: any) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Add Company Logo (Base64 PNG or JPEG)
    const img = new Image();
    img.src = logo;
    img.onload = () => {
  doc.addImage(img, 'PNG', 10, 10, 30, 15);
};
    // 2. Add Header
    doc.addImage(img, 'PNG', 20, 13, 35, 35);
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.setFont('Helvetica', 'bold');
    doc.text('TAX INVOICE', pageWidth / 2, 15, { align: 'center' });

    // 3. Add Company Info
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'bold'); 
    doc.text('Rhombick Technologies', pageWidth / 3, 25);
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'normal'); 
    doc.text('Sy NO 1, Kanchanayakanahalli, Near SBI', pageWidth / 3, 30);
    doc.text('Bommasandra Industrial Area, Bangalore - 560105', pageWidth / 3, 35);
    doc.text(`Email: techrhom@gmail.com`, pageWidth / 3, 40);
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'bold'); 
    doc.text(`PAN: CLEPP3514M`, pageWidth / 1.5 , 25);
    doc.text(`GSTIN: 29CLEPP3514M1ZP`, pageWidth /1.5, 30);
    doc.text(`Phone: 8073540347`, pageWidth / 1.5 ,35);



    // 5. Add Invoice Info Table
    autoTable(doc, {
      startY: 50,
      head: [['Billing To:', '', '', 'Invoice Details']],
      body: [
        [invoice.customer.customerName, '', '', `Invoice No: ${invoice.invoiceNo}`],
        [`${invoice.customer.address.street}`, '', '', `Date: ${invoice.invoiceDate}`],
        [`${invoice.customer.address.city}, ${invoice.customer.address.state} - ${invoice.customer.address.zip}`, '', '', `PO No: ${invoice.poNo || '-'}`],
        [`Email: ${invoice.customer.email}`, '', '', `PO Date: ${invoice.poDate || '-'}`],
        [`Ph No ${invoice.customer.phoneNumber}`, '', '', `DC No: ${invoice.dcNo || '-'}`],
        [`GST No: ${invoice.customer.gstNumber}`, '', '', `DC Date: ${invoice.dcDate || '-'}`]
      ],
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 1 },
      headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 'auto' }, 3: { cellWidth: 'auto' } }
    });

    // 6. Add Items Table
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['SL', 'Description', 'HSN', 'Qty', 'Rate', 'Amount']],
      body: invoice.items.map((item: any, index: number) => [
        index + 1,
        item.description,
        item.hsnSac,
        `${item.quantity} NOS`,
        `${item.rate.toFixed(2)}`,
        `${(item.quantity * item.rate).toFixed(2)}`
      ]),
      foot: [
        ['', '', '', 'Subtotal', '', `${invoice.subtotal.toFixed(2)}`],
        ['', '', '', 'IGST (18%)', '', `${invoice.taxAmount.toFixed(2)}`],
        ['', '', '', 'TOTAL', '', `${invoice.totalAmount.toFixed(2)}`]
      ],
      theme: 'grid',
  styles: { 
    fontSize: 8, // Smaller font to fit better
    cellPadding: 2,
    lineColor: [0, 0, 0],
    lineWidth: 0.1,
    overflow: 'linebreak' // Handle text overflow
  },
  headStyles: { 
    fillColor: [220, 220, 220], 
    textColor: [0, 0, 0], 
    fontStyle: 'bold',
    lineColor: [0, 0, 0],
    lineWidth: 0.2,
    fontSize: 8,
    cellPadding: 2
  },
  bodyStyles: {
    fontSize: 8,
    fontStyle:'Helvetica',
    textColor: [0, 0, 0],
    cellPadding: 2,
    lineColor: [0, 0, 0],
    lineWidth: 0.1
  },
  footStyles:{
    fillColor: [220, 220, 220], 
    textColor: [0, 0, 0], 
    fontStyle: 'bold',
    lineColor: [0, 0, 0],
    lineWidth: 0.2,
    fontSize: 8,
    cellPadding: 2
  },
  columnStyles: {
    0: { cellWidth: 10, halign: 'center' },  // S.L.No - smaller width
    1: { cellWidth: 65, halign: 'left' },    // Description - adjusted width
    2: { cellWidth: 20, halign: 'center' },  // HSN/SAC - smaller width
    3: { cellWidth: 20, halign: 'center' },  // Qty - smaller width
    4: { cellWidth: 22, halign: 'left' },   // Rate
    5: { cellWidth: 50, halign: 'left' }    // Amount
  },
  margin: { left: 10, right: 10 }, // Reduced margins
  tableWidth: 'wrap', // Auto-adjust table width
  overflow: 'linebreak',
  showHead: 'everyPage' // Show header on every page if table spans multiple pages
    });

    // 7. Add Footer
    const finalY = (doc as any).lastAutoTable.finalY || 120;
    doc.setFontSize(10);
    doc.text(`Amount in words: ${convertToWords(invoice.totalAmount)}`, 14, finalY + 15);
    doc.text('Authorized Signatory', 30, doc.internal.pageSize.height - 20);
    doc.text('For Rhombick Technologies', 160, doc.internal.pageSize.height - 20, { align: 'right' });

    // 8. Return PDF as Blob URL
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    return pdfUrl;
  } catch (error) {
    console.error('PDF generation failed:', error);
    return null;
  }
};

// ✅ Convert number to words
const convertToWords = (num: number): string => {
  return toWords(num).replace(/,/g, '') + ' only';
};
