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
  Grid,
  useToast,
  Textarea,
  Divider,
} from "@chakra-ui/react";
import { ErrorMessage, Form, Formik } from "formik";
import * as Yup from "yup";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  Country,
  State,
  City,
  ICountry,
  IState,
  ICity,
} from "country-state-city";

interface RouteParams {
  id?: string;
}

interface Address {
  country: string;
  state: string;
  city: string;
  postalCode: string;
  street: string;
}

interface FormValues {
  customerId: string;
  customerName: string;
  managerName: string;
  email: string;
  phoneNumber: string;
  gstNumber: string;
  address: Address;
}

const NewCustomer: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const [countryList, setCountryList] = useState<ICountry[]>([]);
  const [stateList, setStateList] = useState<IState[]>([]);
  const [cityList, setCityList] = useState<ICity[]>([]);
  const [initialValues, setInitialValues] = useState<FormValues>({
    customerId: "",
    customerName: "",
    managerName: "",
    email: "",
    phoneNumber: "",
    gstNumber: "",
    address: {
      country: "",
      state: "",
      city: "",
      postalCode: "",
      street: "",
    },
  });

  const fetchCustomerForId = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        "https://rhombick-bend.onrender.com/api/customers"
      );
      const fetchCustNo = response.data;
      if (fetchCustNo.length > 0) {
        const maxNumber = Math.max(
          ...fetchCustNo.map((item: any) => {
            const raw = (item.customerId || "").toUpperCase();
            const num = parseInt(raw.replace("CUST", ""), 10);
            return isNaN(num) ? 0 : num;
          })
        );
        setInitialValues({
          ...initialValues,
          customerId: maxNumber ? `CUST${(maxNumber + 1).toString().padStart(3, '0')}` : "CUST001",
        });
      } else {
        setInitialValues({
          ...initialValues,
          customerId: "CUST001",
        });
      }
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
    const countries = Country.getAllCountries();
    setCountryList(countries);
    if (!id) {
      fetchCustomerForId();
    }
  }, []);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (id) {
        try {
          const res = await axios.get(
            `https://rhombick-bend.onrender.com/api/customers/${id}`
          );
          const data = res.data;
          setInitialValues({
            customerId: data.customerId || "",
            customerName: data.customerName || "",
            managerName: data.manager
              ? `${data.manager.firstName} ${data.manager.lastName || ""}`.trim()
              : "",
            email: data.email || "",
            phoneNumber: data.phoneNumber?.toString() || "",
            gstNumber: data.gstNumber || "",
            address: {
              country: data.address?.country || "",
              state: data.address?.state || "",
              city: data.address?.city || "",
              postalCode: data.address?.postalCode || "",
              street: data.address?.street || "",
            },
          });
        } catch (err) {
          toast({
            title: "Failed to fetch customer",
            status: "error",
            duration: 3000,
            isClosable: true,
            position: "top-right",
          });
        }
      }
    };

    fetchCustomer();
  }, [id]);

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      
      const managerNameParts = values.managerName?.split(' ') || [];
      const manager = values.managerName ? {
        firstName: managerNameParts[0],
        lastName: managerNameParts.slice(1).join(' ') || ''
      } : undefined;
      
      const payload = {
        customerId: values.customerId,
        customerName: values.customerName,
        email: values.email,
        phoneNumber: Number(values.phoneNumber),
        gstNumber: values.gstNumber,
        manager: manager,
        address: values.address
      };

      if (id) {
        await axios.put(
          `https://rhombick-bend.onrender.com/api/customers/${id}`,
          payload
        );
      } else {
        await axios.post(
          "https://rhombick-bend.onrender.com/api/customers",
          payload
        );
      }
      toast({
        title: id
          ? "Customer updated successfully"
          : "Customer added successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      navigate("/customer");
    } catch (err) {
      setIsLoading(false);
      toast({
        title: id ? "Update failed" : "Customer creation failed",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    }
  };

  const validationSchema = Yup.object({
    customerId: Yup.string().required("Customer ID is required"),
    customerName: Yup.string().required("Customer Name is required"),
    managerName: Yup.string().required("Manager Name is required"),
    email: Yup.string().email().required("Email is required"),
    phoneNumber: Yup.string()
      .required("Phone number is required")
      .matches(/^\d{10}$/, "Phone number must be 10 digits"),
    gstNumber: Yup.string()
      .required("GST number is required")
      .matches(/^\d{10}$/, "GST number must be 10 digits"),
    address: Yup.object().shape({
      country: Yup.string().required("Country is required"),
      state: Yup.string().required("State is required"),
      city: Yup.string().required("City is required"),
      postalCode: Yup.string().required("Postal Code is required"),
      street: Yup.string().required("Street is required"),
    }),
  });

  return (
    <Box>
      <Flex justifyContent="space-between" mb={4}>
        <Text fontSize="xl" fontWeight="bold" m="auto 0">
          {id ? "Edit" : "Add"} Customer
        </Text>
      </Flex>
      <Formik
        initialValues={initialValues}
        enableReinitialize={true}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, handleChange }) => (
          <Form>
            <Grid
              templateColumns={{
                base: "repeat(1, 1fr)",
                md: "repeat(1, 1fr)",
                lg: "repeat(2, 1fr)",
              }}
              gap={4}
            >
              <Box>
                <FormControl mt={4}>
                  <FormLabel>Customer Id</FormLabel>
                  <Box w="100%">
                    <Input
                      name="customerId"
                      type="text"
                      onChange={handleChange}
                      value={values.customerId}
                      disabled
                    />
                    <ErrorMessage
                      name="customerId"
                      component="div"
                      className="error"
                    />
                  </Box>
                </FormControl>
                <FormControl mt={4}>
                  <FormLabel>Customer Name</FormLabel>
                  <Box w="100%">
                    <Input
                      name="customerName"
                      type="text"
                      onChange={handleChange}
                      placeholder="Enter Customer Name"
                      value={values.customerName}
                    />
                    <ErrorMessage
                      name="customerName"
                      component="div"
                      className="error"
                    />
                  </Box>
                </FormControl>
                <FormControl mt={4}>
                  <FormLabel>Manager Name</FormLabel>
                  <Box w="100%">
                    <Input
                      name="managerName"
                      type="text"
                      onChange={handleChange}
                      placeholder="Enter Manager Name"
                      value={values.managerName}
                    />
                    <ErrorMessage
                      name="managerName"
                      component="div"
                      className="error"
                    />
                  </Box>
                </FormControl>
              </Box>
              <Box>
                <FormControl mt={4}>
                  <FormLabel>Email</FormLabel>
                  <Box w="100%">
                    <Input
                      name="email"
                      type="email"
                      placeholder="Enter email address"
                      onChange={handleChange}
                      value={values.email}
                    />
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="error"
                    />
                  </Box>
                </FormControl>
                <FormControl mt={4}>
                  <FormLabel>Phone Number</FormLabel>
                  <Box w="100%">
                    <Input
                      name="phoneNumber"
                      type="text"
                      placeholder="Enter Phone Number"
                      onChange={handleChange}
                      value={values.phoneNumber}
                    />
                    <ErrorMessage
                      name="phoneNumber"
                      component="div"
                      className="error"
                    />
                  </Box>
                </FormControl>
                <FormControl mt={4}>
                  <FormLabel>GST Number</FormLabel>
                  <Box w="100%">
                    <Input
                      name="gstNumber"
                      type="text"
                      placeholder="Enter GST Number"
                      onChange={handleChange}
                      value={values.gstNumber}
                    />
                    <ErrorMessage
                      name="gstNumber"
                      component="div"
                      className="error"
                    />
                  </Box>
                </FormControl>
              </Box>
            </Grid>
            <Divider my={6} />
            <Text fontSize="lg" fontWeight="bold" mb={4}>
              Address
            </Text>

            <Grid
              templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(2, 1fr)" }}
              gap={4}
            >
              <FormControl>
                <FormLabel>Country</FormLabel>
                <Select
                  name="address.country"
                  placeholder="Select Country"
                  value={values.address.country}
                  onChange={(e) => {
                    handleChange(e);
                    const selectedCountryCode = e.target.value;
                    const states =
                      State.getStatesOfCountry(selectedCountryCode);
                    setStateList(states);
                    setCityList([]);
                  }}
                >
                  {countryList.map((country) => (
                    <option key={country.isoCode} value={country.isoCode}>
                      {country.name}
                    </option>
                  ))}
                </Select>
                <ErrorMessage
                  name="address.country"
                  component="div"
                  className="error"
                />
              </FormControl>

              <FormControl>
                <FormLabel>State</FormLabel>
                <Select
                  name="address.state"
                  placeholder="Select State"
                  value={values.address.state}
                  onChange={(e) => {
                    handleChange(e);
                    const selectedStateCode = e.target.value;
                    const cities = City.getCitiesOfState(
                      values.address.country,
                      selectedStateCode
                    );
                    setCityList(cities);
                  }}
                >
                  {stateList.map((state) => (
                    <option key={state.isoCode} value={state.isoCode}>
                      {state.name}
                    </option>
                  ))}
                </Select>
                <ErrorMessage
                  name="address.state"
                  component="div"
                  className="error"
                />
              </FormControl>

              <FormControl>
                <FormLabel>City</FormLabel>
                <Select
                  name="address.city"
                  placeholder="Select City"
                  value={values.address.city}
                  onChange={handleChange}
                >
                  {cityList.map((city, idx) => (
                    <option key={idx} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </Select>
                <ErrorMessage
                  name="address.city"
                  component="div"
                  className="error"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Postal Code</FormLabel>
                <Input
                  name="address.postalCode"
                  placeholder="Enter Postal Code"
                  value={values.address.postalCode}
                  onChange={handleChange}
                />
                <ErrorMessage
                  name="address.postalCode"
                  component="div"
                  className="error"
                />
              </FormControl>

              <FormControl gridColumn="span 2">
                <FormLabel>Street</FormLabel>
                <Textarea
                  name="address.street"
                  placeholder="Enter Street"
                  value={values.address.street}
                  onChange={handleChange}
                />
                <ErrorMessage
                  name="address.street"
                  component="div"
                  className="error"
                />
              </FormControl>
            </Grid>
            <Flex justify="flex-end" mt={6} mb={4}>
              <Button
                variant="outline"
                type="reset"
                onClick={() => navigate("/customer")}
              >
                Cancel
              </Button>
              <Button
                bg="black"
                color="white"
                _hover={{ bg: "gray.800" }}
                type="submit"
                ml={2}
                isLoading={isLoading}
              >
                {id ? "Update" : "Save"}
              </Button>
            </Flex>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default NewCustomer;