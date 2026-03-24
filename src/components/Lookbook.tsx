import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import LongArrowLeft from './LongArrowLeft';
import Menu from './Menu';
import Cart from './Cart';
import Logo3DAutoRotate from './Logo3DAutoRotate';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

export default function Lookbook() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [hoveringButton, setHoveringButton] = useState<string | null>(null);
  const [clickingButton, setClickingButton] = useState(false);
  const [spinTrigger, setSpinTrigger] = useState(0);
  const navigate = useNavigate();
  const { getCartItemCount } = useCart();

  const getLogoTint = () => {
    if (clickingButton) {
      return 'rgba(150, 200, 255, 0.7)';
    }
    if (hoveringButton === 'back' || hoveringButton === 'cart' || hoveringButton === 'menu') {
      return 'rgba(120, 180, 255, 0.5)';
    }
    return undefined;
  };

  return (
    <motion.div
      className="min-h-screen w-screen text-off-white relative"
      style={{
        background: 'radial-gradient(ellipse at 50% 50%, #1A1A1A 0%, #181818 60%, #161616 100%)'
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Header Bar */}
      <header
        className="fixed w-full z-50"
        style={{
          top: '0px',
          paddingTop: '32px',
          paddingBottom: '40px',
          background: 'linear-gradient(180deg, #1A1A1A 0%, rgba(26, 26, 26, 0.98) 60%, rgba(26, 26, 26, 0.7) 85%, transparent 100%)'
        }}
      >
        <div className="relative w-full px-16 flex items-center justify-between">
          {/* Back button on left */}
          <button
            onClick={() => {
              setClickingButton(true);
              setTimeout(() => setClickingButton(false), 200);
              navigate('/products');
            }}
            onMouseEnter={() => setHoveringButton('back')}
            onMouseLeave={() => setHoveringButton(null)}
            className="p-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
            style={{ transform: 'translateX(20px)' }}
            aria-label="Back to products"
          >
            <LongArrowLeft className="w-8 h-6 text-off-white" />
          </button>

          {/* Logo centered */}
          <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center cursor-pointer group"
            style={{ height: '80px', width: '180px' }}
            onClick={() => {
              setSpinTrigger(Date.now());
              setTimeout(() => {
                navigate('/');
              }, 500);
            }}
          >
            <Logo3DAutoRotate tintColor={getLogoTint()} spinTrigger={spinTrigger} />
          </div>

          {/* Cart and Menu buttons on right */}
          <div className="flex items-center gap-4" style={{ transform: 'translateX(-20px)' }}>
            {/* Cart Icon */}
            <button
              onClick={() => {
                setClickingButton(true);
                setTimeout(() => setClickingButton(false), 200);
                setCartOpen(true);
              }}
              onMouseEnter={() => setHoveringButton('cart')}
              onMouseLeave={() => setHoveringButton(null)}
              className="relative p-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Open cart"
            >
              <ShoppingBag className="w-6 h-6 text-off-white" />
              {getCartItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-off-white text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {getCartItemCount()}
                </span>
              )}
            </button>

            {/* Menu button */}
            <button
              onClick={() => {
                setClickingButton(true);
                setTimeout(() => setClickingButton(false), 200);
                setMenuOpen(true);
              }}
              onMouseEnter={() => setHoveringButton('menu')}
              onMouseLeave={() => setHoveringButton(null)}
              className="p-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity flex flex-col gap-1 w-5"
              aria-label="Open menu"
            >
              <motion.div
                className="h-0.5 w-full bg-off-white"
                animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3 }}
              />
              <motion.div
                className="h-0.5 w-full bg-off-white"
                animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              <motion.div
                className="h-0.5 w-full bg-off-white"
                animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3 }}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen w-screen flex items-center justify-center px-6 relative z-10 py-24">
        <div className="w-full max-w-6xl flex flex-col items-center justify-center">
          <h1
            className="text-off-white tracking-widest uppercase font-mono text-4xl mb-8"
            style={{
              fontFamily: '"Space Mono", Monaco, Consolas, "Courier New", monospace',
              letterSpacing: '0.2em'
            }}
          >
            LOOKBOOK
          </h1>
          <p className="text-off-white/70 font-mono">Coming soon...</p>
        </div>
      </main>
    </motion.div>
  );
}
