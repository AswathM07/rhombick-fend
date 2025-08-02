import { useEffect, useRef, useState, useCallback } from "react";
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
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Pagination from "../utils/Pagination";
import { debounce } from "lodash";

interface CustomerType {
  _id: string;
  customerId: string;
  customerName: string;
  email: string;
  phoneNumber: number;
  gstNumber?: string;
  manager?: {
    firstName: string;
    lastName?: string;
  };
  managerName?: string; // Added to match API response
}

const Customer = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allCustomers, setAllCustomers] = useState<CustomerType[]>([]);
  const [customerList, setCustomerList] = useState<CustomerType[]>([]);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const cancelRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const toast = useToast();

  const filterCustomers = useCallback((customers: CustomerType[], term: string) => {
    if (!term.trim()) {
      setCustomerList(customers);
      setTotalItems(customers.length);
      return;
    }
    const filtered = customers.filter((customer) =>
      customer.customerName.toLowerCase().includes(term.toLowerCase()) ||
      customer.customerId.toLowerCase().includes(term.toLowerCase()) ||
      customer.email.toLowerCase().includes(term.toLowerCase()) ||
      (customer.manager &&
        `${customer.manager.firstName} ${customer.manager.lastName || ""}`
          .toLowerCase()
          .includes(term.toLowerCase())) ||
      customer.phoneNumber.toString().includes(term) ||
      (customer.gstNumber && customer.gstNumber.toLowerCase().includes(term.toLowerCase())) ||
      (customer.managerName && customer.managerName.toLowerCase().includes(term.toLowerCase()))
    );
    setCustomerList(filtered);
    setTotalItems(filtered.length);
  }, []);

  const debouncedSearch = useRef(
    debounce((val: string) => {
      filterCustomers(allCustomers, val);
      setCurrentPage(1);
    }, 400)
  ).current;

  const fetchCustomer = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        "https://rhombick-bend.onrender.com/api/customers"
      );
      console.log("API Response:", response.data); // Debug log
      setAllCustomers(response.data);
      filterCustomers(response.data, searchTerm);
    } catch (err) {
      console.error("API Error:", err);
      setError(err.response?.data?.message || "Failed to fetch customer details");
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to fetch customers",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  }, [filterCustomers, searchTerm, toast]);

  useEffect(() => {
    fetchCustomer();
    return () => {
      debouncedSearch.cancel();
    };
  }, [fetchCustomer, debouncedSearch]);

  const handleDelete = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      await axios.delete(
        `https://rhombick-bend.onrender.com/api/customers/${id}`
      );
      toast({
        title: "Customer deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      fetchCustomer();
    } catch (err) {
      toast({
        title: "Failed to delete customer",
        description: err.response?.data?.message || "Please try again later",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setIsDeleteAlertOpen(false);
      setIsLoading(false);
    }
  }, [fetchCustomer, toast]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
  };

  const paginatedCustomers = customerList.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <Box>
      <Flex justifyContent="space-between" mb={4} flexWrap="wrap">
        <Text fontSize="xl" fontWeight="bold" m="auto 0">
          Customer List
        </Text>
        <Flex gap={4} alignItems="center">
          <Input
            size="sm"
            placeholder="Search customer..."
            value={searchTerm}
            onChange={handleSearchChange}
            width={{ base: "100%", md: "auto" }}
          />
          <Button
            variant="solid"
            size="sm"
            bg="black"
            color="white"
            _hover={{ bg: "gray.800" }}
            leftIcon={<AddIcon />}
            onClick={() => navigate("/customer/new")}
          >
            New
          </Button>
        </Flex>
      </Flex>
      <Box>
        <TableContainer whiteSpace="normal">
          <Table variant="simple" size="sm">
            <Thead bg="gray.100">
              <Tr>
                <Th>Customer ID</Th>
                <Th>Customer Name</Th>
                <Th>Manager</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>GST Number</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {isLoading ? (
                <Tr>
                  <Td colSpan={7} textAlign="center" py={10}>
                    <Spinner size="lg" />
                    <Text mt={2}>Loading customers...</Text>
                  </Td>
                </Tr>
              ) : error ? (
                <Tr>
                  <Td colSpan={7} textAlign="center" color="red.500" py={10}>
                    {error}
                  </Td>
                </Tr>
              ) : paginatedCustomers.length === 0 ? (
                <Tr>
                  <Td colSpan={7} textAlign="center" py={10}>
                    {searchTerm ? "No matching customers found" : "No customers available"}
                  </Td>
                </Tr>
              ) : (
                paginatedCustomers.map((item) => (
                  <Tr key={item._id} _hover={{ bg: "gray.50" }}>
                    <Td>{item.customerId}</Td>
                    <Td fontWeight="medium">{item.customerName}</Td>
                    <Td>
                      {item.manager
                        ? `${item.manager.firstName}${item.manager.lastName ? " " + item.manager.lastName : ""}`
                        : item.managerName || "-"}
                    </Td>
                    <Td>{item.email}</Td>
                    <Td>{item.phoneNumber}</Td>
                    <Td>{item.gstNumber || "-"}</Td>
                    <Td>
                      <Flex gap={2}>
                        <IconButton
                          aria-label="Edit"
                          icon={<EditIcon />}
                          variant="outline"
                          colorScheme="blue"
                          size="sm"
                          onClick={() => navigate(`/customer/edit/${item._id}`)}
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
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
        {customerList.length > 0 && (
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
                Delete Customer
              </AlertDialogHeader>
              <AlertDialogBody>
                Are you sure? This will permanently delete the customer and all related data.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={() => setIsDeleteAlertOpen(false)}>
                  Cancel
                </Button>
                <Button
                  colorScheme="red"
                  onClick={() => deleteId && handleDelete(deleteId)}
                  ml={3}
                  isLoading={isLoading}
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

export default Customer;