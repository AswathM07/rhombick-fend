import { Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Customer from './pages/Customer';
import Invoice from './pages/Invoice';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/customer" element={<Customer />} />
        <Route path="/invoice" element={<Invoice />} />
        {/* Add other routes here */}
      </Route>
    </Routes>
  );
}

export default App;