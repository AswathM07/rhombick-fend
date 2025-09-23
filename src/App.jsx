import "./App.css";
import { Button } from "@chakra-ui/react";
import Layout from "./Layout";
import Customer from "./pages/Customer";
import NewCustomer from "./pages/NewCustomer";
import Invoice from "./pages/Invoice";
import NewInvoice from "./pages/NewInvoice";
import { Route, Switch, Redirect } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Switch>
          <ProtectedRoute>
            <Route exact path="/customer" component={Customer} />
            <Route exact path="/customer/new-customer" component={NewCustomer} />
            <Route
              exact
              path="/customer/new-customer/:id"
              component={NewCustomer}
            />
            <Route exact path="/invoice" component={Invoice} />
            <Route exact path="/invoice/new-invoice" component={NewInvoice} />
            <Route exact path="/invoice/new-invoice/:id" component={NewInvoice} />
            <Route exact path="/">
              <Redirect to="/customer" />
            </Route>
          </ProtectedRoute>
        </Switch>
      </Layout>
    </AuthProvider>
  );
}

export default App;