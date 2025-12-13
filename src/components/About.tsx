import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import logo from '../assets/arcus-wordmark.png';
import { useState } from 'react';
import { motion } from 'motion/react';
import Menu from './Menu';

export default function About() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <motion.div 
      className="min-h-screen w-screen text-off-white relative" 
      style={{ backgroundColor: '#1A1A1A' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      
      {/* Header Bar */}
      <header className="fixed top-0 w-full z-50 py-8" style={{ backgroundColor: '#1A1A1A' }}>
        <div className="w-full px-16 flex items-center justify-between">
          {/* Back button on left */}
          <button
            onClick={() => navigate('/')}
            className="p-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
            style={{ transform: 'translateX(20px)' }}
            aria-label="Back to home"
          >
            <ChevronLeft className="w-6 h-6 text-off-white" />
          </button>
          
          {/* Logo centered */}
          <div className="flex items-center">
            <img 
              src={logo} 
              alt="ARCUS" 
              className="brightness-0 invert opacity-90"
              style={{ height: '72px' }}
            />
          </div>
          
          {/* Menu button on right */}
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity flex flex-col gap-1 w-5"
            style={{ transform: 'translateX(-20px)' }}
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
      </header>

      {/* Content */}
      <main className="min-h-screen w-screen flex items-center justify-center px-6">
        <div className="max-w-2xl mx-auto space-y-24 py-32">
          <h1 className="text-3xl md:text-4xl text-off-white tracking-wider uppercase text-center" style={{ transform: 'translateY(-20px)' }}>About</h1>
          
          <div className="space-y-10 text-off-white/70 leading-relaxed text-center">
            <p className="text-base md:text-lg">
              Arcus was built for the ones who never felt they belonged on the path someone else planned. We want a direction that reflects who we are, and we&apos;re willing to carve that path ourselves.
            </p>
          </div>
        </div>
      </main>
    </motion.div>
  );
}