import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { MenuProvider } from './context/MenuContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { LandingPage } from './pages/LandingPage';
import { MenuPage } from './pages/MenuPage';
import { FoodDetailPage } from './pages/FoodDetailPage';
import { AuthPage } from './pages/AuthPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <MenuProvider>
            <CartProvider>
              <BrowserRouter>
                <ScrollToTop />
                <div className="min-h-screen flex flex-col bg-[#FFFDF9] text-[#1C1917]">
                  <Navbar />
                  <CartDrawer />
                  <main className="flex-1">
                    <Routes>
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/menu" element={<MenuPage />} />
                      <Route path="/menu/:id" element={<FoodDetailPage />} />
                      <Route path="/auth" element={<AuthPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/orders" element={<OrdersPage />} />
                      <Route
                        path="/orders/confirm/:orderId"
                        element={<OrderConfirmationPage />}
                      />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/admin" element={<AdminDashboardPage />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              </BrowserRouter>
            </CartProvider>
          </MenuProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
