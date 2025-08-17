import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toWords } from 'number-to-words'; // Install with: npm install number-to-words
import logo from '../assets/logo.jpeg'; // Ensure you have a logo image in your assets

export const generateInvoicePdf = (invoice: any) => {
  try {
    const doc = new jsPDF();

    // 1. Add Company Logo (Base64 PNG or JPEG)
    const img = new Image();
img.src = logo;
img.onload = () => {
  doc.addImage(img, 'PNG', 10, 10, 30, 15);
};
    // 2. Add Header
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('TAX INVOICE', 105, 20, { align: 'center' });

    // 3. Add Company Info
    doc.setFontSize(10);
    doc.text('Rhombick Technologies', 105, 30, { align: 'center' });
    doc.text('Sy NO 1, Kanchanayakanahalli, Near SBI', 105, 35, { align: 'center' });
    doc.text('Bommasandra Industrial Area, Bangalore - 560105', 105, 40, { align: 'center' });

    // 4. Format Customer Address
    const customerAddress = invoice.customer.address;
    const formattedAddress = [
      customerAddress.street,
      `${customerAddress.city}, ${customerAddress.state}`,
      `PIN: ${customerAddress.postalCode}`
    ].filter(Boolean).join('\n');

    // 5. Add Invoice Info Table
    autoTable(doc, {
      startY: 50,
      head: [['Billing To:', '', '', 'Invoice Details']],
      body: [
        [invoice.customer.customerName, '', '', `No: ${invoice.invoiceNo}`],
        [formattedAddress, '', '', `Date: ${invoice.invoiceDate}`],
        [invoice.customer.email, '', '', `PO No: ${invoice.poNo || '-'}`],
        [invoice.customer.phoneNumber, '', '', `DC No: ${invoice.dcNo || '-'}`],
        [invoice.customer.gstNumber, '', '', ' ']
      ],
      theme: 'plain',
      styles: { fontSize: 10 }
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
        `₹${item.rate.toFixed(2)}`,
        `₹${(item.quantity * item.rate).toFixed(2)}`
      ]),
      foot: [
        ['', '', '', 'Subtotal', '', `₹${invoice.subtotal.toFixed(2)}`],
        ['', '', '', 'IGST (18%)', '', `₹${invoice.taxAmount.toFixed(2)}`],
        ['', '', '', 'TOTAL', '', `₹${invoice.totalAmount.toFixed(2)}`]
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
      footStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' }
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
