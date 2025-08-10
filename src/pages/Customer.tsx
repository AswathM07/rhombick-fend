import { useEffect, useRef, useState } from "react";
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
  Image,
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
import { useHistory } from "react-router-dom";
import axios from "axios";
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
}

const Customer = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [customerList, setCustomerList] = useState<CustomerType[]>([]);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
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

  const fetchCustomer = async () => {
    try {
      setIsLoading(true);
      const response = await axios(
        `${API_BASE_URL}/customers?page=${currentPage}&limit=${rowsPerPage}&search=${searchTerm}`
      );

      console.log(response.data);
      setCustomerList(response?.data);
      // setTotalItems(response.data.pagination.total);
    } catch (error) {
      toast({
        title: "Failed to fetch customer details",
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
    fetchCustomer();
  }, [currentPage, rowsPerPage, searchTerm]);

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/customers/${id}`);
      toast({
        title: "Customer deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      fetchCustomer();
    } catch (error) {
      const errorMsg = error?.response?.data?.error?.[0];
      toast({
        title: "Failed to delete customer",
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
          Customer List
        </Text>
        <Flex justifyContent="space-between" mb={4} gap={4} flexWrap="wrap">
          <Flex gap={2} alignItems="center">
            <Input
              size="sm"
              placeholder="Search customer..."
              onChange={(e) => debouncedSearch(e.target.value)}
            />
            <Button
              variant="solid"
              size={"sm"}
              bg="black"
              color="white"
              _hover={{ bg: "gray.800" }}
              leftIcon={<AddIcon />}
              onClick={() => history.push("/customer/new-customer")}
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
                <Th>Customer ID</Th>
                <Th>Customer Name</Th>
                <Th>Manager Name</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>GST Number</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {isLoading ? (
                <Tr>
                  <Td colSpan={6} rowSpan={5} textAlign="center">
                    <Spinner size="lg" />
                  </Td>
                </Tr>
              ) : customerList.length === 0 ? (
                <Tr>
                  <Td colSpan={6} rowSpan={5} textAlign="center">
                    No Data Found
                  </Td>
                </Tr>
              ) : (
                customerList?.map((item, i) => {
                  return (
                    <Tr key={i}>
                      <Td>{item.customerId}</Td>
                      <Td>{item.customerName}</Td>
                      <Td>{item.managerName ?? "-"}</Td>
                      <Td>{item.email}</Td>
                      <Td>{item.phoneNumber}</Td>
                      <Td>{item.gstNumber ?? "-"}</Td>
                      <Td>
                        <Flex gap={2}>
                          <IconButton
                            aria-label="Edit"
                            icon={<EditIcon />}
                            variant="ghost"
                            onClick={() =>
                              history.push(
                                `/customer/new-customer/${item?._id}`
                              )
                            }
                          />
                          <IconButton
                            aria-label="Delete"
                            icon={<DeleteIcon />}
                            variant="ghost"
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
                Delete Customer
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to delete this customer? This action
                cannot be undone.
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

export default Customer;
