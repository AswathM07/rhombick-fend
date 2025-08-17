import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Select,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  useToast,
  Grid,
  Divider,
  Spinner,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon } from "@chakra-ui/icons";
import { ErrorMessage, Form, Formik } from "formik";
import * as Yup from "yup";
import { useHistory, useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../constant";

interface CustomerType {
  _id: string;
  customerId: string;
  customerName: string;
  email: string;
  phoneNumber: string;
  gstNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

interface InvoiceItem {
  description: string;
  hsnSac: string;
  quantity: number;
  rate: number;
  amount: number;
  _id?: string;
}

interface InvoiceType {
  _id?: string;
  invoiceNo: string;
  invoiceDate: string;
  poNo: string;
  poDate: string;
  dcNo: string;
  dcDate: string;
  customer: string | CustomerType;
  items: InvoiceItem[];
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
}

const NewInvoice = () => {
  const { id } = useParams<{ id?: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | null>(
    null
  );
  const toast = useToast();
  const history = useHistory();

  const [initialValues, setInitialValues] = useState<InvoiceType>({
    invoiceNo: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    poNo: "",
    poDate: "",
    dcNo: "",
    dcDate: "",
    customer: "",
    items: [
      {
        description: "",
        hsnSac: "",
        quantity: 1,
        rate: 0,
        amount: 0,
      },
    ],
    cgstRate: 0,
    sgstRate: 0,
    igstRate: 0,
    subtotal: 0,
    taxAmount: 0,
    totalAmount: 0,
  });

  // Fetch customers and invoice data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch customers
        const customersRes = await axios.get(`${API_BASE_URL}/customers`);
        setCustomers(customersRes.data.data);

        // If editing, fetch invoice data
        if (id) {
          const invoiceRes = await axios.get(`${API_BASE_URL}/invoices/${id}`);
          const invoiceData = invoiceRes.data?.data;

          // Find the customer in the already fetched customers list
        const customerId = typeof invoiceData.customer === "string" 
          ? invoiceData.customer 
          : invoiceData.customer?._id;
        
        const customer = customersRes.data.data.find(
          (c: CustomerType) => c._id === customerId
        );

          setInitialValues({
            ...invoiceData,
            customer: customerId?.toString() || "",
            invoiceDate:
              invoiceData.invoiceDate?.split("T")[0] ||
              new Date().toISOString().split("T")[0],
            poDate: invoiceData.poDate?.split("T")[0] || "",
            dcDate: invoiceData.dcDate?.split("T")[0] || "",
          });

          if (customer) {
            setSelectedCustomer(customer);
          }
        }
      } catch (error) {
        toast({
          title: "Failed to fetch data",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (!id) {
      const fetchInvoice = async () => {
        try {
          setIsLoading(true);
          const response = await axios(`${API_BASE_URL}/invoices`);
          const fetchInvoiceNo = response.data.data;
          if (fetchInvoiceNo.length > 0) {
            const maxNumber = Math.max(
              ...fetchInvoiceNo.map((item: any) => {
                const raw = (item.invoiceNo || "").toUpperCase();
                const num = parseInt(raw.replace("INV-", ""), 10);
                return isNaN(num) ? 0 : num;
              })
            );
            setInitialValues({
              ...initialValues,
              invoiceNo: maxNumber ? `INV-${maxNumber + 1}` : "INV-1",
            });
          }
        } catch (error) {
          toast({
            title: "Failed to fetch Invoice details",
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
      fetchInvoice();
    }
  }, []);

  const validationSchema = Yup.object().shape({
    invoiceNo: Yup.string().required("Invoice number is required"),
    invoiceDate: Yup.string().required("Invoice date is required"),
    customer: Yup.string().required("Customer is required"),
    items: Yup.array().of(
      Yup.object().shape({
        description: Yup.string().required("Description is required"),
        hsnSac: Yup.string().required("HSN/SAC is required"),
        quantity: Yup.number()
          .required("Quantity is required")
          .min(1, "Quantity must be at least 1"),
        rate: Yup.number()
          .required("Rate is required")
          .min(0, "Rate must be positive"),
      })
    ),
  });

  const handleCustomerChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    setFieldValue: any
  ) => {
    const customerId = e.target.value;
    const customer = customers.find((c) => c._id === customerId) || null;
    setSelectedCustomer(customer);
    setFieldValue("customer", customerId);

    // Auto-set tax rates based on customer location
    if (customer) {
      const isSameState = customer?.address?.state === "YOUR_COMPANY_STATE"; // Replace with your company's state
      setFieldValue("cgstRate", isSameState ? 9 : 0);
      setFieldValue("sgstRate", isSameState ? 9 : 0);
      setFieldValue("igstRate", isSameState ? 0 : 18);
    }
  };

  const calculateAmounts = (values: InvoiceType) => {
    const subtotal = values.items.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0
    );
    const taxAmount =
      (subtotal * (values.cgstRate + values.sgstRate + values.igstRate)) / 100;
    const totalAmount = subtotal + taxAmount;

    return {
      subtotal,
      taxAmount,
      totalAmount,
    };
  };

  const handleSubmit = async (values: InvoiceType) => {
    try {
      setIsLoading(true);
      const amounts = calculateAmounts(values);
      const payload = {
        ...values,
        ...amounts,
      };

      if (id) {
        await axios.put(`${API_BASE_URL}/invoices/${id}`, payload);
        toast({
          title: "Invoice updated successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
      } else {
        await axios.post(`${API_BASE_URL}/invoices`, payload);
        toast({
          title: "Invoice created successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
      }
      history.push("/invoice");
    } catch (error) {
      toast({
        title: id ? "Update failed" : "Creation failed",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Flex justifyContent="space-between" mb={4}>
        <Text fontSize="xl" fontWeight="bold" m="auto 0">
          {id ? "Edit" : "Create"} Invoice
        </Text>
      </Flex>

      {isLoading ? (
        <Box textAlign={"center"}>
          <Spinner size="xl" />
        </Box>
      ) : (
        <Formik
          initialValues={initialValues}
          enableReinitialize
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, handleChange, setFieldValue }) => {
            const amounts = calculateAmounts(values);

            return (
              <Form>
                <Grid
                  templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                  gap={4}
                >
                  <FormControl>
                    <FormLabel>Invoice Number</FormLabel>
                    <Input
                      name="invoiceNo"
                      value={values.invoiceNo}
                      onChange={handleChange}
                      disabled
                    />
                    <ErrorMessage
                      name="invoiceNo"
                      component="div"
                      className="error"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Invoice Date</FormLabel>
                    <Input
                      type="date"
                      name="invoiceDate"
                      value={values.invoiceDate}
                      onChange={handleChange}
                    />
                    <ErrorMessage
                      name="invoiceDate"
                      component="div"
                      className="error"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>PO Number</FormLabel>
                    <Input
                      name="poNo"
                      value={values.poNo}
                      onChange={handleChange}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>PO Date</FormLabel>
                    <Input
                      type="date"
                      name="poDate"
                      value={values.poDate}
                      onChange={handleChange}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>DC Number</FormLabel>
                    <Input
                      name="dcNo"
                      value={values.dcNo}
                      onChange={handleChange}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>DC Date</FormLabel>
                    <Input
                      type="date"
                      name="dcDate"
                      value={values.dcDate}
                      onChange={handleChange}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Customer</FormLabel>
                    <Select
                      name="customer"
                      value={values.customer as string}
                      onChange={(e) => handleCustomerChange(e, setFieldValue)}
                      placeholder="Select customer"
                    >
                      {customers.map((customer) => (
                        <option key={customer._id} value={customer._id}>
                          {customer.customerName} ({customer.customerId})
                        </option>
                      ))}
                    </Select>
                    <ErrorMessage
                      name="customer"
                      component="div"
                      className="error"
                    />
                  </FormControl>
                </Grid>

                {selectedCustomer && (
                  <Box mt={4} p={4} borderWidth="1px" borderRadius="lg">
                    <Text fontWeight="bold">Customer Details</Text>
                    <Text>Name: {selectedCustomer.customerName}</Text>
                    <Text>
                      Address: {selectedCustomer?.address?.street},{" "}
                      {selectedCustomer?.address?.city}
                    </Text>
                    <Text>GSTIN: {selectedCustomer.gstNumber || "N/A"}</Text>
                    <Text>Phone: {selectedCustomer.phoneNumber}</Text>
                  </Box>
                )}

                <Divider my={6} />

                <Text fontSize="lg" fontWeight="bold" mb={4}>
                  Items
                </Text>

                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Description</Th>
                        <Th>HSN/SAC</Th>
                        <Th>Qty</Th>
                        <Th>Rate</Th>
                        <Th>Amount</Th>
                        <Th>Action</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {values.items.map((item, index) => (
                        <Tr key={index}>
                          <Td>
                            <Input
                              name={`items.${index}.description`}
                              value={item.description}
                              onChange={handleChange}
                            />
                            <ErrorMessage
                              name={`items.${index}.description`}
                              component="div"
                              className="error"
                            />
                          </Td>
                          <Td>
                            <Input
                              name={`items.${index}.hsnSac`}
                              value={item.hsnSac}
                              onChange={handleChange}
                            />
                            <ErrorMessage
                              name={`items.${index}.hsnSac`}
                              component="div"
                              className="error"
                            />
                          </Td>
                          <Td>
                            <Input
                              type="number"
                              name={`items.${index}.quantity`}
                              value={item.quantity}
                              onChange={(e) => {
                                handleChange(e);
                                const newQuantity =
                                  parseFloat(e.target.value) || 0;
                                const newAmount = newQuantity * item.rate;
                                setFieldValue(
                                  `items.${index}.amount`,
                                  newAmount
                                );
                              }}
                            />
                            <ErrorMessage
                              name={`items.${index}.quantity`}
                              component="div"
                              className="error"
                            />
                          </Td>
                          <Td>
                            <Input
                              type="number"
                              name={`items.${index}.rate`}
                              value={item.rate}
                              onChange={(e) => {
                                handleChange(e);
                                const newRate = parseFloat(e.target.value) || 0;
                                const newAmount = item.quantity * newRate;
                                setFieldValue(
                                  `items.${index}.amount`,
                                  newAmount
                                );
                              }}
                            />
                            <ErrorMessage
                              name={`items.${index}.rate`}
                              component="div"
                              className="error"
                            />
                          </Td>
                          <Td>{(item.quantity * item.rate).toFixed(2)}</Td>
                          <Td>
                            <IconButton
                              aria-label="Delete item"
                              icon={<DeleteIcon />}
                              onClick={() => {
                                const newItems = [...values.items];
                                newItems.splice(index, 1);
                                setFieldValue("items", newItems);
                              }}
                            />
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>

                <Button
                  leftIcon={<AddIcon />}
                  mt={2}
                  onClick={() => {
                    setFieldValue("items", [
                      ...values.items,
                      {
                        description: "",
                        hsnSac: "",
                        quantity: 1,
                        rate: 0,
                        amount: 0,
                      },
                    ]);
                  }}
                >
                  Add Item
                </Button>

                <Divider my={6} />

                <Grid
                  templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
                  gap={4}
                  mb={4}
                >
                  <FormControl>
                    <FormLabel>CGST (%)</FormLabel>
                    <Input
                      type="number"
                      name="cgstRate"
                      value={values.cgstRate}
                      onChange={handleChange}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>SGST (%)</FormLabel>
                    <Input
                      type="number"
                      name="sgstRate"
                      value={values.sgstRate}
                      onChange={handleChange}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>IGST (%)</FormLabel>
                    <Input
                      type="number"
                      name="igstRate"
                      value={values.igstRate}
                      onChange={handleChange}
                    />
                  </FormControl>
                </Grid>

                <Box p={4} borderWidth="1px" borderRadius="lg" bg="gray.50">
                  <Flex justifyContent="space-between">
                    <Text fontWeight="bold">Subtotal:</Text>
                    <Text>₹{amounts.subtotal.toFixed(2)}</Text>
                  </Flex>
                  <Flex justifyContent="space-between">
                    <Text fontWeight="bold">Tax Amount:</Text>
                    <Text>₹{amounts.taxAmount.toFixed(2)}</Text>
                  </Flex>
                  <Flex justifyContent="space-between" mt={2}>
                    <Text fontWeight="bold" fontSize="lg">
                      Total Amount:
                    </Text>
                    <Text fontWeight="bold" fontSize="lg">
                      ₹{amounts.totalAmount.toFixed(2)}
                    </Text>
                  </Flex>
                </Box>

                <Flex justify="flex-end" mt={6} mb={4}>
                  <Button
                    variant="outline"
                    onClick={() => history.push("/invoice")}
                    mr={2}
                  >
                    Cancel
                  </Button>
                  <Button
                    bg="black"
                    color="white"
                    _hover={{ bg: "gray.800" }}
                    type="submit"
                    isLoading={isLoading}
                  >
                    {id ? "Update" : "Save"} Invoice
                  </Button>
                </Flex>
              </Form>
            );
          }}
        </Formik>
      )}
    </Box>
  );
};

export default NewInvoice;
