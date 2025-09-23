import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useColorModeValue,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  Center,
  Image
} from '@chakra-ui/react';
import { useAuth } from './AuthContext';
import { useHistory } from 'react-router-dom';
import logo from '../assets/Rhombick.png'; 

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const history = useHistory();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = login(email, password);
    setIsLoading(false);
    
    if (result.success) {
      history.push('/customer');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  return (
    <Box minH="100vh" bg={bgColor} display="flex" alignItems="center" justifyContent="center">
      <Card maxW="md" w="full" bg={cardBg} boxShadow="xl">
        <CardBody p={8}>
          <VStack spacing={6}>
             <Image src={logo} alt="Rhombick Logo" height="150px" />
            <Heading size="lg" textAlign="center">
            App Login
            </Heading>
            
            <Text color="gray.600" textAlign="center">
              Welcome back! Please sign in to your account.
            </Text>

            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Password</FormLabel>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="teal"
                  width="full"
                  isLoading={isLoading}
                  loadingText="Signing in..."
                >
                  Sign In
                </Button>
              </VStack>
            </form>

            {/* <Box textAlign="center" fontSize="sm" color="gray.600">
              <Text fontWeight="bold">Demo Accounts:</Text>
              <Text>Admin: admin@company.com / admin123</Text>
              <Text>User: user@company.com / user123</Text>
            </Box> */}
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
};

export default Login;