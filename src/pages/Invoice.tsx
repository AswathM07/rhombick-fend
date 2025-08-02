import { useState, useEffect, useRef, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Flex,
  IconButton,
  Input,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
  Tooltip,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, EditIcon } from "@chakra-ui/icons";
import { PdfIcon } from "../components/PdfIcon";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { generateInvoicePdf } from "../utils/generatePdf";
import Pagination from "../utils/Pagination";
import { debounce } from "lodash";

interface CustomerType {
  _id: string;
  customerId: string;
  customerName: string;
  email: string;
  phoneNumber: number;
  gstNumber?: string;
}

interface InvoiceItem {
  description: string;
  hsnSac: string;
  quantity: number;
  rate: number;
  amount: number;
  _id: string;
}

interface InvoiceType {
  _id: string;
  invoiceNo: string;
  poNo?: string;
  poDate?: string;
  dcNo?: string;
  dcDate?: string;
  customer: string | CustomerType;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  invoiceDate: string;
  createdAt: string;
  __v: number;
}

const Invoice = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [invoiceList, setInvoiceList] = useState<InvoiceType[]>([]);
  const [customers, setCustomers] = useState<{[key: string]: CustomerType}>({});
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [currentPdfId, setCurrentPdfId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const cancelRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();

  const debouncedSearch = useRef(
    debounce((val: string) => {
      setSearchTerm(val);
      setCurrentPage(1);
    }, 500)
  ).current;

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoadingCustomers(true);
      const response = await axios.get(
        "https://rhombick-bend.onrender.com/api/customers"
      );
      const customersMap: {[key: string]: CustomerType} = {};
      response.data.forEach((customer: CustomerType) => {
        customersMap[customer._id] = customer;
      });
      setCustomers(customersMap);
    } catch (error) {
      toast({
        title: "Failed to fetch customers",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setIsLoadingCustomers(false);
    }
  }, [toast]);

  const fetchInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `https://rhombick-bend.onrender.com/api/invoices?page=${currentPage}&limit=${rowsPerPage}&search=${searchTerm}`
      );
      setInvoiceList(response.data);
      setTotalItems(response.data.length);
    } catch (error) {
      toast({
        title: "Failed to fetch invoices",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      console.error("API fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, rowsPerPage, searchTerm, toast]);

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
  }, [fetchInvoices, fetchCustomers]);

  const handleGeneratePdf = async (invoice: InvoiceType) => {
    try {
      setIsGeneratingPdf(true);
      setCurrentPdfId(invoice._id);

      const customerId = typeof invoice.customer === 'string' 
        ? invoice.customer 
        : invoice.customer._id;
      const customer = customers[customerId] || {
        customerName: "Unknown Customer",
        phoneNumber: 0,
        email: "N/A",
        gstNumber: "N/A"
      };

      const fullInvoice = {
        ...invoice,
        customer: {
          ...customer,
          _id: customerId
        }
      };

      const pdfUrl = await generateInvoicePdf(fullInvoice);

      if (!pdfUrl) {
        throw new Error("PDF generation failed");
      }

      const printWindow = window.open(pdfUrl);
      if (!printWindow) {
        throw new Error("Popup blocked - please allow popups for this site");
      }

      printWindow.onload = () => {
        printWindow.print();
      };
    } catch (error: any) {
      toast({
        title: "PDF Generation Failed",
        description: error.message,
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsGeneratingPdf(false);
      setCurrentPdfId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`https://rhombick-bend.onrender.com/api/invoices/${id}`);
      toast({
        title: "Invoice deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      fetchInvoices();
    } catch (error: any) {
      toast({
        title: "Failed to delete invoice",
        description: error.response?.data?.message || "",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setIsDeleteAlertOpen(false);
    }
  };

  const getCustomerInfo = (invoice: InvoiceType) => {
    const customerId = typeof invoice.customer === 'string' 
      ? invoice.customer 
      : invoice.customer._id;
    return customers[customerId] || {
      customerName: "Unknown Customer",
      phoneNumber: 0,
      email: "N/A",
      gstNumber: "N/A"
    };
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box>
      <Flex justifyContent="space-between" mb={4} flexWrap="wrap">
        <Text fontSize="xl" fontWeight="bold" m="auto 0">
          Invoice List
        </Text>
        <Flex gap={4} alignItems="center">
          <Input
            size="sm"
            placeholder="Search invoice..."
            onChange={(e) => debouncedSearch(e.target.value)}
            width={{ base: "100%", md: "auto" }}
          />
          <Button
            variant="solid"
            size="sm"
            bg="black"
            color="white"
            _hover={{ bg: "gray.800" }}
            leftIcon={<AddIcon />}
            onClick={() => navigate("/invoice/new")}
          >
            New
          </Button>
        </Flex>
      </Flex>

      <Box>
        <TableContainer whiteSpace="nowrap">
          <Table variant="simple" size="sm">
            <Thead bg="gray.100">
              <Tr>
                <Th>Invoice #</Th>
                <Th>Date</Th>
                <Th>PO #</Th>
                <Th>PO Date</Th>
                <Th>DC #</Th>
                <Th>DC Date</Th>
                <Th>Customer</Th>
                <Th>Phone</Th>
                <Th>Total</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {(isLoading || isLoadingCustomers) ? (
                <Tr>
                  <Td colSpan={10} textAlign="center" py={10}>
                    <Spinner size="lg" />
                    <Text mt={2}>Loading data...</Text>
                  </Td>
                </Tr>
              ) : invoiceList.length === 0 ? (
                <Tr>
                  <Td colSpan={10} textAlign="center" py={10}>
                    {searchTerm ? "No matching invoices found" : "No invoices available"}
                  </Td>
                </Tr>
              ) : (
                invoiceList.map((item) => {
                  const customer = getCustomerInfo(item);
                  return (
                    <Tr key={item._id} _hover={{ bg: "gray.50" }}>
                      <Td>{item.invoiceNo}</Td>
                      <Td>{formatDate(item.invoiceDate)}</Td>
                      <Td>{item.poNo || "-"}</Td>
                      <Td>{formatDate(item.poDate)}</Td>
                      <Td>{item.dcNo || "-"}</Td>
                      <Td>{formatDate(item.dcDate)}</Td>
                      <Td>
                        <Tooltip 
                          label={`Email: ${customer.email}\nGST: ${customer.gstNumber || 'N/A'}`}
                          placement="top-start"
                        >
                          <span>{customer.customerName}</span>
                        </Tooltip>
                      </Td>
                      <Td>{customer.phoneNumber}</Td>
                      <Td>₹{item.totalAmount.toLocaleString()}</Td>
                      <Td>
                        <Flex gap={2}>
                          <IconButton
                            aria-label="Edit"
                            icon={<EditIcon />}
                            variant="outline"
                            colorScheme="blue"
                            size="sm"
                            onClick={() => navigate(`/invoice/edit/${item._id}`)}
                          />
                          <IconButton
                            aria-label="PDF"
                            icon={<PdfIcon />}
                            variant="outline"
                            colorScheme="red"
                            size="sm"
                            onClick={() => handleGeneratePdf(item)}
                            isLoading={isGeneratingPdf && currentPdfId === item._id}
                          />
                          <IconButton
                            aria-label="Delete"
                            icon={<DeleteIcon />}
                            variant="outline"
                            colorScheme="red"
                            size="sm"
                            onClick={() => {
                              setDeleteId(item._id);
                              setIsDeleteAlertOpen(true);
                            }}
                          />
                        </Flex>
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </TableContainer>

        {invoiceList.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            rowsPerPage={rowsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
            onRowsPerPageChange={(rows) => {
              setRowsPerPage(rows);
              setCurrentPage(1);
            }}
          />
        )}

        <AlertDialog
          isOpen={isDeleteAlertOpen}
          leastDestructiveRef={cancelRef}
          onClose={() => setIsDeleteAlertOpen(false)}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Invoice
              </AlertDialogHeader>
              <AlertDialogBody>
                Are you sure? This will permanently delete the invoice and cannot be undone.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={() => setIsDeleteAlertOpen(false)}>
                  Cancel
                </Button>
                <Button
                  colorScheme="red"
                  onClick={() => deleteId && handleDelete(deleteId)}
                  ml={3}
                >
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Box>
    </Box>
  );
};

export default Invoice;