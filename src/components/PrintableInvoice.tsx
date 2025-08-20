// components/PrintableInvoice.tsx
import React from "react";
import { Box, Text, Flex, Table, Thead, Tbody, Tr, Th, Td } from "@chakra-ui/react";
import { CustomerType, InvoiceType } from "../types"; // Adjust the import path as needed

interface PrintableInvoiceProps {
  invoice: InvoiceType;
  customer: CustomerType;
  companyInfo: {
    name: string;
    address: string;
    pan: string;
    gstin: string;
    email: string;
    phone: string;
  };
}

const numberToWords = (num: number): string => {
  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const convertLessThanOneThousand = (n: number): string => {
    if (n === 0) return "";
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + units[n % 10] : "");
    return units[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + convertLessThanOneThousand(n % 100) : "");
  };

  const numStr = num.toFixed(2);
  const [whole, decimal] = numStr.split(".");
  let wholeNum = parseInt(whole, 10); // Changed from const to let
  const decimalNum = parseInt(decimal, 10);

  if (wholeNum === 0) return "Zero Rupees and " + decimalNum + " Paise only";

  let result = "";
  
  // Handle Crores
  if (wholeNum >= 10000000) {
    const crores = Math.floor(wholeNum / 10000000);
    result += convertLessThanOneThousand(crores) + " Crore ";
    wholeNum %= 10000000;
  }
  
  // Handle Lakhs
  if (wholeNum >= 100000) {
    const lakhs = Math.floor(wholeNum / 100000);
    result += convertLessThanOneThousand(lakhs) + " Lakh ";
    wholeNum %= 100000;
  }
  
  // Handle Thousands
  if (wholeNum >= 1000) {
    const thousands = Math.floor(wholeNum / 1000);
    result += convertLessThanOneThousand(thousands) + " Thousand ";
    wholeNum %= 1000;
  }
  
  // Handle remaining amount
  if (wholeNum > 0) {
    result += convertLessThanOneThousand(wholeNum) + " Rupees ";
  }
  
  // Handle paise
  if (decimalNum > 0) {
    result += "and " + convertLessThanOneThousand(decimalNum) + " Paise ";
  }

  return result + "only";
};

const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ invoice, customer, companyInfo }) => {
  const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const cgstAmount = (subtotal * invoice.cgstRate) / 100;
  const sgstAmount = (subtotal * invoice.sgstRate) / 100;
  const igstAmount = (subtotal * invoice.igstRate) / 100;
  const totalAmount = subtotal + cgstAmount + sgstAmount + igstAmount;

  return (
    <Box p={4} width="100%" maxWidth="800px" mx="auto" id="invoice-to-print" fontFamily="sans-serif">
      {/* Invoice Header */}
      <Text fontSize="xl" fontWeight="bold" textAlign="center" mb={2}>
        TAX INVOICE
      </Text>
      
      {/* Company Info */}
      <Box mb={4} textAlign="center">
        <Text fontWeight="bold" fontSize="lg">{companyInfo.name}</Text>
        <Text>{companyInfo.address}</Text>
        <Flex justifyContent="center" gap={4} mt={1}>
          <Text>PAN: {companyInfo.pan}</Text>
          <Text>GSTIN: {companyInfo.gstin}</Text>
        </Flex>
        <Flex justifyContent="center" gap={4} mt={1}>
          <Text>Email: {companyInfo.email}</Text>
          <Text>PH: {companyInfo.phone}</Text>
        </Flex>
      </Box>

      {/* Billing Info */}
      <Flex justifyContent="space-between" mb={4} flexWrap="wrap">
        <Box width={{ base: "100%", md: "50%" }} mb={{ base: 4, md: 0 }}>
          <Text fontWeight="bold" mb={1}>Billing To:</Text>
          <Text>{customer.customerName}</Text>
          <Text>
            {customer.address.street}, {customer.address.city}, 
            {customer.address.state} - {customer.address.postalCode}
          </Text>
          <Text>GSTIN: {customer.gstNumber || "N/A"}</Text>
        </Box>
        <Box width={{ base: "100%", md: "50%" }} textAlign={{ base: "left", md: "right" }}>
          <Flex justifyContent={{ base: "flex-start", md: "flex-end" }} gap={2}>
            <Text fontWeight="bold">Invoice No:</Text>
            <Text>{invoice.invoiceNo}</Text>
          </Flex>
          <Flex justifyContent={{ base: "flex-start", md: "flex-end" }} gap={2}>
            <Text fontWeight="bold">Invoice Date:</Text>
            <Text>{new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</Text>
          </Flex>
          {invoice.poNo && (
            <Flex justifyContent={{ base: "flex-start", md: "flex-end" }} gap={2}>
              <Text fontWeight="bold">PO No:</Text>
              <Text>{invoice.poNo}</Text>
            </Flex>
          )}
          {invoice.poDate && (
            <Flex justifyContent={{ base: "flex-start", md: "flex-end" }} gap={2}>
              <Text fontWeight="bold">PO Date:</Text>
              <Text>{new Date(invoice.poDate).toLocaleDateString('en-IN')}</Text>
            </Flex>
          )}
          {invoice.dcNo && (
            <Flex justifyContent={{ base: "flex-start", md: "flex-end" }} gap={2}>
              <Text fontWeight="bold">DC No:</Text>
              <Text>{invoice.dcNo}</Text>
            </Flex>
          )}
          {invoice.dcDate && (
            <Flex justifyContent={{ base: "flex-start", md: "flex-end" }} gap={2}>
              <Text fontWeight="bold">DC Date:</Text>
              <Text>{new Date(invoice.dcDate).toLocaleDateString('en-IN')}</Text>
            </Flex>
          )}
        </Box>
      </Flex>

      {/* Items Table */}
      <Table variant="simple" mb={4} borderWidth="1px">
        <Thead bg="gray.100">
          <Tr>
            <Th border="1px" borderColor="gray.300" textAlign="center">S.L.No</Th>
            <Th border="1px" borderColor="gray.300">Description of Goods</Th>
            <Th border="1px" borderColor="gray.300" textAlign="center">HSN/SAC</Th>
            <Th border="1px" borderColor="gray.300" textAlign="center">Qty</Th>
            <Th border="1px" borderColor="gray.300" textAlign="right">Rate</Th>
            <Th border="1px" borderColor="gray.300" textAlign="right">Amount in INR</Th>
          </Tr>
        </Thead>
        <Tbody>
          {invoice.items.map((item, index) => (
            <Tr key={index}>
              <Td border="1px" borderColor="gray.300" textAlign="center">{index + 1}</Td>
              <Td border="1px" borderColor="gray.300">{item.description}</Td>
              <Td border="1px" borderColor="gray.300" textAlign="center">{item.hsnSac}</Td>
              <Td border="1px" borderColor="gray.300" textAlign="center">{item.quantity} NOS</Td>
              <Td border="1px" borderColor="gray.300" textAlign="right">₹ {item.rate.toFixed(2)}</Td>
              <Td border="1px" borderColor="gray.300" textAlign="right">₹ {(item.quantity * item.rate).toFixed(2)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {/* Totals */}
      <Box mb={4}>
        <Flex justifyContent="flex-end">
          <Box width="300px">
            <Flex justifyContent="space-between" mb={1}>
              <Text fontWeight="bold">TOTAL</Text>
              <Text>₹ {subtotal.toFixed(2)}</Text>
            </Flex>
            {invoice.cgstRate > 0 && (
              <Flex justifyContent="space-between" mb={1}>
                <Text>CGST @ {invoice.cgstRate}%</Text>
                <Text>₹ {cgstAmount.toFixed(2)}</Text>
              </Flex>
            )}
            {invoice.sgstRate > 0 && (
              <Flex justifyContent="space-between" mb={1}>
                <Text>SGST @ {invoice.sgstRate}%</Text>
                <Text>₹ {sgstAmount.toFixed(2)}</Text>
              </Flex>
            )}
            {invoice.igstRate > 0 && (
              <Flex justifyContent="space-between" mb={1}>
                <Text>IGST @ {invoice.igstRate}%</Text>
                <Text>₹ {igstAmount.toFixed(2)}</Text>
              </Flex>
            )}
            <Flex justifyContent="space-between" mt={2} pt={2} borderTop="1px" borderColor="gray.300">
              <Text fontWeight="bold">GRAND TOTAL</Text>
              <Text fontWeight="bold">₹ {totalAmount.toFixed(2)}</Text>
            </Flex>
          </Box>
        </Flex>
      </Box>

      {/* Amount in words */}
      <Box mb={6} p={2} borderWidth="1px" borderRadius="md">
        <Text fontStyle="italic">{numberToWords(totalAmount)}</Text>
      </Box>

      {/* Signatures */}
      <Flex justifyContent="space-between" mt={8} pt={4} borderTop="1px" borderColor="gray.300">
        <Box width="200px">
          <Text fontWeight="bold" mb={2}>Receiver's signature & Seal</Text>
          <Text>Name: ___________________</Text>
          <Text>Date: ___________________</Text>
        </Box>
        <Box width="200px" textAlign="right">
          <Text fontWeight="bold" mb={2}>For {companyInfo.name}</Text>
          <Text>Authorized Signatory</Text>
        </Box>
      </Flex>
    </Box>
  );
};

export default PrintableInvoice;