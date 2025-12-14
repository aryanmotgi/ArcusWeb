import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Menu({ isOpen, onClose }: MenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Menu Panel */}
          <motion.div
            className="fixed top-0 right-0 h-screen w-full max-w-sm border-l border-off-white/10 z-[100] flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ 
              backgroundColor: '#000000',
              boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.8)'
            }}
          >
            {/* Close Button */}
            <div className="flex justify-end p-6">
              <button
                onClick={onClose}
                className="text-off-white/70 hover:text-off-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Menu Links */}
            <nav className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
              <Link
                to="/"
                onClick={onClose}
                className="text-2xl text-off-white/70 hover:text-off-white transition-colors tracking-wider uppercase"
              >
                Home
              </Link>
              <Link
                to="/collection"
                onClick={onClose}
                className="text-2xl text-off-white/70 hover:text-off-white transition-colors tracking-wider uppercase"
              >
                Collection
              </Link>
              <Link
                to="/about"
                onClick={onClose}
                className="text-2xl text-off-white/70 hover:text-off-white transition-colors tracking-wider uppercase"
              >
                About
              </Link>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}