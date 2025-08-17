import { useState, useEffect, useRef } from "react";
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
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, EditIcon } from "@chakra-ui/icons";
import { PdfIcon } from "../components/PdfIcon";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { generateInvoicePdf } from "../utils/generatePdf";
import Pagination from "../utils/Pagination";
import { debounce } from "lodash";
import { API_BASE_URL } from "../constant";

interface CustomerType {
  _id: string;
  customerId: string;
  customerName: string;
  email: string;
  phoneNumber: string;
  gstNumber: string;
  managerName?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

interface InvoiceType {
  _id: string;
  invoiceNo: string;
  poNo: string;
  poDate: string;
  dcNo: string;
  dcDate: string;
  invoiceDate: string;
  customer: CustomerType;
  items: Array<{
    description: string;
    hsnSac: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
}

const Invoice = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [invoiceList, setInvoiceList] = useState<InvoiceType[]>([]);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [currentPdfId, setCurrentPdfId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const cancelRef = useRef(null);

  const history = useHistory();
  const toast = useToast();

  const debouncedSearch = useRef(
    debounce((val: string) => {
      setSearchTerm(val);
      setCurrentPage(1);
    }, 500)
  ).current;

  const handleGeneratePdf = async (invoice: any) => {
    try {
      setIsGeneratingPdf(true);
      setCurrentPdfId(invoice._id);

      // Generate PDF and get URL
      const pdfUrl = await generateInvoicePdf(invoice);

      if (!pdfUrl) {
        throw new Error("PDF generation failed");
      }

      // Open in new tab for printing
      const printWindow = window.open(pdfUrl);

      if (!printWindow) {
        throw new Error("Popup blocked - please allow popups for this site");
      }

      // Optional: Auto-print after PDF loads
      printWindow.onload = () => {
        printWindow.print();
      };
    } catch (error) {
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

  const fetchInvoice = async () => {
    try {
      setIsLoading(true);
      const response = await axios(
        `${API_BASE_URL}/invoices?page=${currentPage}&limit=${rowsPerPage}&search=${searchTerm}`
      );
        // Fetch customer details for each invoice
    const invoicesWithCustomers = await Promise.all(
      response.data.data.map(async (invoice: InvoiceType) => {
        if (invoice.customer?._id) {
          try {
            const customerRes = await axios.get(`${API_BASE_URL}/customers/${invoice.customer._id}`);
            return {
              ...invoice,
              customer: customerRes.data.data
            };
          } catch (error) {
            console.error("Failed to fetch customer details", error);
            return invoice; // Return original invoice if customer fetch fails
          }
        }
        return invoice;
      })
    );

    setInvoiceList(invoicesWithCustomers);
      setTotalItems(response.data.pagination.total);
    } catch (error) {
      toast({
        title: "Failed to fetch invoice details",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      console.error("API fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [currentPage, rowsPerPage, searchTerm]);

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/invoices/${id}`);
      toast({
        title: "Invoice deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      fetchInvoice();
    } catch (error) {
      const errorMsg = error?.response?.data?.data.error?.[0];
      toast({
        title: "Failed to delete invoice",
        description: errorMsg ?? "",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      console.error("Delete error:", error);
    } finally {
      setIsDeleteAlertOpen(false);
    }
  };

  return (
    <Box>
      <Flex justifyContent="space-between" mb={4}>
        <Text fontSize="xl" fontWeight="bold" m="auto 0">
          Invoice List
        </Text>
        <Flex justifyContent="space-between" mb={4} gap={4} flexWrap="wrap">
          <Flex gap={2} alignItems="center">
            <Input
              size="sm"
              placeholder="Search invoice..."
              onChange={(e) => debouncedSearch(e.target.value)}
            />
            <Button
              variant="solid"
              size={"sm"}
              bg="black"
              color="white"
              _hover={{ bg: "gray.800" }}
              leftIcon={<AddIcon />}
              onClick={() => history.push("/invoice/new-invoice")}
            >
              New
            </Button>
          </Flex>
        </Flex>
      </Flex>
      <Box>
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Invoice Number</Th>
                <Th>Invoice Date</Th>
                <Th>PO Number</Th>
                <Th>PO Date</Th>
                <Th>DC Number</Th>
                <Th>DC Date</Th>
                <Th>Customer Name</Th>
                <Th>Phone Number</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {isLoading ? (
                <Tr>
                  <Td colSpan={9} rowSpan={5} textAlign="center">
                    <Spinner size="lg" />
                  </Td>
                </Tr>
              ) : invoiceList.length === 0 ? (
                <Tr>
                  <Td colSpan={9} rowSpan={5} textAlign="center">
                    No Data Found
                  </Td>
                </Tr>
              ) : (
                invoiceList?.map((item) => (
                  <Tr key={item._id}>
                    <Td>{item.invoiceNo}</Td>
                    <Td>{item.invoiceDate?.split("T")[0]}</Td>
                    <Td>{item.poNo}</Td>
                    <Td>{item.poDate?.split("T")[0]}</Td>
                    <Td>{item.dcNo}</Td>
                    <Td>{item.dcDate?.split("T")[0]}</Td>
                    <Td>{item.customer?.customerName ?? "-"}</Td>
                    <Td>{item.customer?.phoneNumber ?? "-"}</Td>
                    <Td>
                      <Flex gap={2}>
                        <IconButton
                          aria-label="Edit"
                          icon={<EditIcon />}
                          variant="ghost"
                          onClick={() =>
                            history.push(`/invoice/new-invoice/${item._id}`)
                          }
                        />
                        <IconButton
                          aria-label="PDF"
                          icon={<PdfIcon />}
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleGeneratePdf(item)}
                          isLoading={
                            isGeneratingPdf && currentPdfId === item._id
                          }
                        />
                        <IconButton
                          aria-label="Delete"
                          icon={<DeleteIcon />}
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => {
                            setDeleteId(item._id);
                            setIsDeleteAlertOpen(true);
                          }}
                        />
                      </Flex>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
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
                Are you sure you want to delete this invoice? This action cannot
                be undone.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button
                  ref={cancelRef}
                  onClick={() => setIsDeleteAlertOpen(false)}
                >
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
