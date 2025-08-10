export interface InvoiceType {
  _id: string;
  invoiceNo: string;
  invoiceDate: string;
  poNo: string;
  poDate: string;
  dcNo: string;
  dcDate: string;
  customer: {
    _id: string;
    customerName: string;
    address: string;
    gstNumber?: string;
  };
  items: Array<{
    description: string;
    hsnSac: string;
    quantity: number;
    rate: number;
    amount?: number;
  }>;
  subtotal: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  taxAmount: number;
  totalAmount: number;
}