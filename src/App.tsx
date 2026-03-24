import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { lazy, Suspense } from 'react';
import { CartProvider } from './contexts/CartContext';

// Lazy load components for code splitting
const Landing = lazy(() => import('./components/Landing'));
const Products = lazy(() => import('./components/Products'));
const ProductDetail = lazy(() => import('./components/ProductDetail'));
const ThankYou = lazy(() => import('./components/ThankYou'));
const Representers = lazy(() => import('./components/Representers'));
const Lookbook = lazy(() => import('./components/Lookbook'));
const Social = lazy(() => import('./components/Social'));

// Loading fallback
function LoadingFallback() {
  return (
    <div 
      className="min-h-screen w-screen flex items-center justify-center"
      style={{ backgroundColor: '#1A1A1A' }}
    >
      <div className="text-off-white/50 text-sm uppercase tracking-widest">Loading...</div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<LoadingFallback />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Landing />} />
          <Route path="/products" element={<Products />} />
          <Route path="/collection" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/lookbook" element={<Lookbook />} />
          <Route path="/representers" element={<Representers />} />
          <Route path="/social" element={<Social />} />
          <Route path="/community" element={<Social />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/coming-soon" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <CartProvider>
      <Router>
        <AnimatedRoutes />
      </Router>
    </CartProvider>
  );
}