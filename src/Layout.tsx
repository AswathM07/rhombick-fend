import React from "react";
import {
  IconButton,
  Box,
  CloseButton,
  Flex,
  Icon,
  useColorModeValue,
  Drawer,
  DrawerContent,
  Text,
  useDisclosure,
  Button,
  Image,
  Divider,
  Avatar,
} from "@chakra-ui/react";
import { BiLogOut, BiNotepad } from "react-icons/bi";
import { FiMenu } from "react-icons/fi";
import { LuCalendarDays, LuLayoutDashboard } from "react-icons/lu";
import { FaRegUser } from "react-icons/fa";
import { IoSettingsOutline } from "react-icons/io5";
import { AiOutlineSearch } from "react-icons/ai";
import { MdOutlineNotifications } from "react-icons/md";
import { PiStethoscopeFill } from "react-icons/pi";
import { TbReportAnalytics } from "react-icons/tb";
import { useHistory, useLocation } from "react-router-dom";
import Logo from "./assets/logo_name.jpeg";
import { useAuth } from "./auth/AuthContext";

const Layout = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <Box minH="100vh">
      <Header onOpen={onOpen} />
      <SidebarContent
        onClose={() => onClose}
        display={{ base: "none", md: "block" }}
      />
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
      <Box ml={{ base: 0, md: 60 }} pt="80px" h="100vh" bgColor="#F6F7F9">
        <Box
          minH="calc(100% - 1.5rem)"
          m={3}
          p={4}
          bgColor="#fff"
          borderRadius="5px"
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

const Header = ({ onOpen }) => {
  const location = useLocation();
  const { pathname } = location;
  const { user, logout } = useAuth();

  return (
    <Box
      display="flex"
      position="fixed"
      justifyContent="space-between"
      width="100%"
      borderBottom="1px"
      borderBottomColor={useColorModeValue("gray.200", "gray.700")}
      bgColor="#fff"
      zIndex="999"
    >
      <Box display="flex">
        <Box
          alignItems="center"
          px={{ base: 2, md: 10 }}
          py="3"
          bg={useColorModeValue("white", "gray.900")}
          borderRight="1px"
          borderRightColor={useColorModeValue("gray.200", "gray.700")}
          w={{ base: 14, md: 60 }}
        >
          <Image
            src={Logo}
            alt="Logo"
            height="50px"
            display={{ base: "none", md: "block" }}
          />
          <IconButton
            variant="outline"
            colorScheme="teal"
            onClick={onOpen}
            aria-label="open menu"
            display={{ base: "flex", md: "none" }}
            icon={<FiMenu />}
          />
        </Box>
        <Text fontSize="2xl" p="5" fontFamily="monospace" fontWeight="bold">
          {pathname.includes("/customer")
            ? "Customer"
            : pathname.includes("/invoice")
            ? "Invoice"
            : "Customer"}
        </Text>
      </Box>
      <Box display="flex" alignItems="center">
        <Divider
          orientation="vertical"
          height="40px"
          mx={3}
          display={{ base: "none", md: "flex" }}
        />
        <Flex align="center" p={4} width="fit-content">
          <Avatar name={user?.name || 'User'} src={""} size="sm" />
          <Box mx={2}>
            <Text fontSize="sm" fontWeight="bold">
              {user?.name}
            </Text>
            <Text fontSize="xs" color="gray.600">
              {user?.role}
            </Text>
          </Box>
          <Button
            size="sm"
            variant="outline"
            colorScheme="red"
            onClick={logout}
            ml={2}
          >
            <BiLogOut />
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

const SidebarContent = ({ onClose, ...rest }) => {
  const location = useLocation();
  const history = useHistory();
  const { pathname } = location;
  const { logout } = useAuth();

  const LinkItems = [
    {
      name: "Customer",
      icon: LuLayoutDashboard,
      path: "/customer",
      active: pathname.includes("/customer"),
      roles: ["admin", "user"],
    },
    {
      name: "Invoice",
      icon: BiNotepad,
      path: "/invoice",
      active: pathname.includes("/invoice"),
      roles: ["admin", "user"],
    },
  ];

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  return (
    <Box
      bg={useColorModeValue("white", "gray.900")}
      w={{ base: "full", md: 60 }}
      mt={{ base: 0, md: 81 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex
        alignItems="center"
        px="10"
        py="3"
        justifyContent="space-between"
        borderBottom="1px"
        borderBottomColor={useColorModeValue("gray.200", "gray.700")}
        display={{ base: "flex", md: "none" }}
      >
        <Image src={Logo} alt="Logo" height="50px" />
        <CloseButton display={{ base: "flex", md: "none" }} onClick={onClose} />
      </Flex>
      {LinkItems.map((link) => (
        <NavItem
          key={link.name}
          icon={link.icon}
          onClose={onClose}
          path={link.path}
          active={link.active}
        >
          {link.name}
        </NavItem>
      ))}
      <Button
        colorScheme="teal"
        variant="ghost"
        display={"flex"}
        position={"absolute"}
        bottom={"80px"}
        w={"100%"}
        bg={"#f0ffff"}
        justifyContent={"left"}
        onClick={handleLogout}
      >
        <BiLogOut size={18} style={{ marginRight: "10px", marginTop: "3px" }} />
        Logout
      </Button>
    </Box>
  );
};

const NavItem = ({ icon, path, onClose, active, children, ...rest }) => {
  const history = useHistory();
  return (
    <Box
      onClick={() => !active && history.push(path)}
      style={{ textDecoration: "none" }}
      _focus={{ boxShadow: "none" }}
    >
      <Flex
        align="center"
        p="3"
        mx="4"
        my="2"
        borderRadius="md"
        role="group"
        cursor="pointer"
        _hover={{
          bg: active ? "#03ABAC" : "#f0ffff",
        }}
        bg={active ? "#03ABAC" : "white"}
        color={active ? "white" : "black"}
        onClick={onClose}
        {...rest}
      >
        {icon && (
          <Icon
            mr="4"
            fontSize="18"
            _groupHover={{
              color: active ? "white" : "black",
            }}
            as={icon}
          />
        )}
        {children}
      </Flex>
    </Box>
  );
};

export default Layout;