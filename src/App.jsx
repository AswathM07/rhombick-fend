import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import Customer from "./pages/Customer";
import NewCustomer from "./pages/NewCustomer";
import Invoice from "./pages/Invoice";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="customer" element={<Customer />} />
          <Route path="customer/new" element={<NewCustomer />} />
          <Route path="invoice" element={<Invoice />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;