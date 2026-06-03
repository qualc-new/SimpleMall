import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import OrderListPage from './pages/Order/List';
import ProductListPage from './pages/Product/List';
import SpuFormPage from './pages/Product/SpuForm';
import CategoryListPage from './pages/Category/List';
import OrderDetailPage from './pages/Order/Detail';
import MockPayPage from './pages/DevTools/MockPay';
import ProtectedRoute from './routes/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<OrderListPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="products" element={<ProductListPage />} />
          <Route path="products/new" element={<SpuFormPage />} />
          <Route path="products/:id/edit" element={<SpuFormPage />} />
          <Route path="categories" element={<CategoryListPage />} />
          <Route path="dev/mock-pay" element={<MockPayPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
