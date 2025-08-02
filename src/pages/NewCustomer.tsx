import React, { useEffect, useState, useCallback } from "react";
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
  FormErrorMessage,
  FormHelperText,
} from "@chakra-ui/react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Country, State, City, ICountry, IState, ICity } from "country-state-city";

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

  const fetchCustomerForId = useCallback(async () => {
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
        setInitialValues((prev) => ({
          ...prev,
          customerId: `CUST${(maxNumber + 1).toString().padStart(3, '0')}`,
        }));
      } else {
        setInitialValues((prev) => ({
          ...prev,
          customerId: "CUST001",
        }));
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
  }, [toast]);

  useEffect(() => {
    const countries = Country.getAllCountries();
    setCountryList(countries);
    if (!id) {
      fetchCustomerForId();
    }
  }, [id, fetchCustomerForId]);

  const fetchCustomer = useCallback(async () => {
    if (id) {
      try {
        setIsLoading(true);
        const res = await axios.get(
          `https://rhombick-bend.onrender.com/api/customers/${id}`
        );
        const data = res.data;
        
        // Handle both manager object and managerName string
        const managerName = data.manager 
          ? `${data.manager.firstName} ${data.manager.lastName || ""}`.trim()
          : data.managerName || "";

        setInitialValues({
          customerId: data.customerId || "",
          customerName: data.customerName || "",
          managerName: managerName,
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

        // Load states if country is set
        if (data.address?.country) {
          const states = State.getStatesOfCountry(data.address.country);
          setStateList(states);
        }

        // Load cities if state is set
        if (data.address?.state && data.address?.country) {
          const cities = City.getCitiesOfState(
            data.address.country,
            data.address.state
          );
          setCityList(cities);
        }
      } catch (err) {
        toast({
          title: "Failed to fetch customer",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
      } finally {
        setIsLoading(false);
      }
    }
  }, [id, toast]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      
      // Format manager data - handle both first/last name and full name string
      const managerNameParts = values.managerName?.trim().split(/\s+/) || [];
      const manager = values.managerName 
        ? {
            firstName: managerNameParts[0] || '',
            lastName: managerNameParts.length > 1 ? managerNameParts.slice(1).join(' ') : undefined
          }
        : undefined;

      // Ensure address fields are properly formatted
      const address = {
        country: values.address.country,
        state: values.address.state,
        city: values.address.city,
        postalCode: values.address.postalCode,
        street: values.address.street
      };

      const payload = {
        customerId: values.customerId,
        customerName: values.customerName,
        email: values.email,
        phoneNumber: Number(values.phoneNumber),
        gstNumber: values.gstNumber,
        manager: manager,
        address: address
      };

      console.log("Submitting payload:", payload); // Debug log

      const response = id
        ? await axios.put(
            `https://rhombick-bend.onrender.com/api/customers/${id}`,
            payload
          )
        : await axios.post(
            "https://rhombick-bend.onrender.com/api/customers",
            payload
          );

      toast({
        title: id ? "Customer updated successfully" : "Customer added successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      navigate("/customer");
    } catch (err: any) {
      console.error("Submission error:", err.response?.data);
      toast({
        title: id ? "Update failed" : "Customer creation failed",
        description: err.response?.data?.message || "Please check all required fields",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validationSchema = Yup.object({
    customerId: Yup.string().required("Customer ID is required"),
    customerName: Yup.string().required("Customer Name is required"),
    managerName: Yup.string().required("Manager Name is required"),
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    phoneNumber: Yup.string()
      .required("Phone number is required")
      .matches(/^\d{10}$/, "Phone number must be 10 digits"),
    gstNumber: Yup.string()
      .required("GST number is required")
      .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GST format (e.g., 22ABCDE1234F1Z5)"),
    address: Yup.object().shape({
      country: Yup.string().required("Country is required"),
      state: Yup.string().required("State is required"),
      city: Yup.string().required("City is required"),
      postalCode: Yup.string()
        .required("Postal Code is required")
        .matches(/^\d{6}$/, "Must be 6 digits"),
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
        {({ values, setFieldValue, isSubmitting, touched, errors }) => (
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
                <Field name="customerId">
                  {({ field, meta }: any) => (
                    <FormControl isInvalid={meta.touched && meta.error}>
                      <FormLabel>Customer ID</FormLabel>
                      <Input {...field} isDisabled />
                      <FormErrorMessage>{meta.error}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>

                <Field name="customerName">
                  {({ field, meta }: any) => (
                    <FormControl mt={4} isInvalid={meta.touched && meta.error}>
                      <FormLabel>Customer Name</FormLabel>
                      <Input {...field} placeholder="Enter Customer Name" />
                      <FormErrorMessage>{meta.error}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>

                <Field name="managerName">
                  {({ field, meta }: any) => (
                    <FormControl mt={4} isInvalid={meta.touched && meta.error}>
                      <FormLabel>Manager Name</FormLabel>
                      <Input 
                        {...field} 
                        placeholder="Firstname Lastname" 
                        onChange={(e) => {
                          // Normalize whitespace
                          const value = e.target.value.replace(/\s+/g, ' ').trim();
                          field.onChange({
                            target: {
                              name: field.name,
                              value: value
                            }
                          });
                        }}
                      />
                      <FormHelperText>Enter full name (first and last name)</FormHelperText>
                      <FormErrorMessage>{meta.error}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
              </Box>
              <Box>
                <Field name="email">
                  {({ field, meta }: any) => (
                    <FormControl mt={4} isInvalid={meta.touched && meta.error}>
                      <FormLabel>Email</FormLabel>
                      <Input {...field} type="email" placeholder="Enter email address" />
                      <FormErrorMessage>{meta.error}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>

                <Field name="phoneNumber">
                  {({ field, meta }: any) => (
                    <FormControl mt={4} isInvalid={meta.touched && meta.error}>
                      <FormLabel>Phone Number</FormLabel>
                      <Input {...field} placeholder="Enter 10-digit Phone Number" />
                      <FormErrorMessage>{meta.error}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>

                <Field name="gstNumber">
                  {({ field, meta }: any) => (
                    <FormControl mt={4} isInvalid={meta.touched && meta.error}>
                      <FormLabel>GST Number</FormLabel>
                      <Input {...field} placeholder="Enter GST Number (e.g., 22ABCDE1234F1Z5)" />
                      <FormHelperText>Format: 22ABCDE1234F1Z5</FormHelperText>
                      <FormErrorMessage>{meta.error}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
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
              <Field name="address.country">
                {({ field, meta }: any) => (
                  <FormControl isInvalid={meta.touched && meta.error}>
                    <FormLabel>Country</FormLabel>
                    <Select
                      {...field}
                      placeholder="Select Country"
                      onChange={(e) => {
                        setFieldValue("address.country", e.target.value);
                        setFieldValue("address.state", "");
                        setFieldValue("address.city", "");
                        const states = State.getStatesOfCountry(e.target.value);
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
                    <FormErrorMessage>{meta.error}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>

              <Field name="address.state">
                {({ field, meta }: any) => (
                  <FormControl isInvalid={meta.touched && meta.error}>
                    <FormLabel>State</FormLabel>
                    <Select
                      {...field}
                      placeholder="Select State"
                      isDisabled={!values.address.country}
                      onChange={(e) => {
                        setFieldValue("address.state", e.target.value);
                        setFieldValue("address.city", "");
                        const cities = City.getCitiesOfState(
                          values.address.country,
                          e.target.value
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
                    <FormErrorMessage>{meta.error}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>

              <Field name="address.city">
                {({ field, meta }: any) => (
                  <FormControl isInvalid={meta.touched && meta.error}>
                    <FormLabel>City</FormLabel>
                    <Select
                      {...field}
                      placeholder="Select City"
                      isDisabled={!values.address.state}
                    >
                      {cityList.map((city, idx) => (
                        <option key={idx} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </Select>
                    <FormErrorMessage>{meta.error}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>

              <Field name="address.postalCode">
                {({ field, meta }: any) => (
                  <FormControl isInvalid={meta.touched && meta.error}>
                    <FormLabel>Postal Code</FormLabel>
                    <Input 
                      {...field} 
                      placeholder="Enter 6-digit Postal Code" 
                      maxLength={6}
                    />
                    <FormErrorMessage>{meta.error}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>

              <Field name="address.street">
                {({ field, meta }: any) => (
                  <FormControl gridColumn="span 2" isInvalid={meta.touched && meta.error}>
                    <FormLabel>Street Address</FormLabel>
                    <Textarea {...field} placeholder="Enter full street address" />
                    <FormErrorMessage>{meta.error}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
            </Grid>
            <Flex justify="flex-end" mt={6} mb={4}>
              <Button
                variant="outline"
                onClick={() => navigate("/customer")}
                mr={2}
              >
                Cancel
              </Button>
              <Button
                bg="black"
                color="white"
                _hover={{ bg: "gray.800" }}
                type="submit"
                isLoading={isLoading || isSubmitting}
                loadingText={id ? "Updating..." : "Saving..."}
                disabled={isLoading || isSubmitting}
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