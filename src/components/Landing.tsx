import { useState, useEffect } from 'react';
import { Mail, ArrowRight, Instagram } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import logo from 'figma:asset/769a79fac0e4f524265f2b87c11a0cf7f0fba749.png';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import Menu from './Menu';
import MenuButton from './MenuButton';

export default function Landing() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();

  const validateInput = (input: string) => {
    // Just check that input is not empty and has at least some content
    return input.trim().length > 0;
  };

  const isPhoneNumber = (input: string) => {
    // Simple check: if it contains mostly digits (and possibly some formatting chars)
    // we'll treat it as a phone number
    const digitsOnly = input.replace(/[\s\-\(\)\+]/g, '');
    return /^\d+$/.test(digitsOnly) && digitsOnly.length >= 10;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateInput(email)) {
      setError('Please enter your email or phone number');
      return;
    }

    try {
      // Determine if the input is email or phone
      const isPhone = isPhoneNumber(email);
      const payload = isPhone 
        ? { email: '', phone: email }
        : { email: email, phone: '' };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-13c7a257/waitlist`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // If it's a duplicate entry error, show the specific message from server
        if (data.error && data.error.includes("already on the waitlist")) {
          throw new Error(data.error);
        }
        // For all other errors, show generic message
        throw new Error('Something went wrong. Please try again.');
      }

      setSuccessMessage(data.message || 'Successfully joined the waitlist!');
      setSubmitted(true);
      setShowEmailModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(errorMessage);
      console.error('Waitlist submission error:', errorMessage);
    }
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigating(true);
    setTimeout(() => {
      navigate('/products');
    }, 400);
  };

  // Auto-hide success modal after 3 seconds
  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal]);

  return (
    <div className="min-h-screen w-screen bg-black text-off-white flex items-center justify-center relative overflow-hidden h-screen">
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      
      <div className="fixed top-6 right-6 z-50">
        <MenuButton onClick={() => setMenuOpen(true)} />
      </div>

      {/* Email Modal */}
      <AnimatePresence>
        {showEmailModal && !submitted && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEmailModal(false)}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            
            {/* Modal Content */}
            <motion.div
              className="relative bg-black rounded-3xl p-8 max-w-md w-full"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button 
                onClick={() => setShowEmailModal(false)}
                className="absolute top-4 right-4 text-off-white/70 leading-none hover:text-off-white transition-colors"
              >
                ×
              </button>

              <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-6 mt-4">
                <h2 className="text-off-white text-center">Join the waitlist</h2>
                
                <div className="relative w-full">
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email or phone number"
                    required
                    className="w-full bg-transparent border-b border-off-white/20 px-4 py-3 text-off-white placeholder:text-off-white/30 focus:outline-none focus:border-off-white/50 transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  className="w-full bg-off-white text-black py-3 px-6 rounded-full hover:bg-off-white/90 transition-colors"
                >
                  Submit
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSuccessModal(false)}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            
            {/* Modal Content */}
            <motion.div
              className="relative bg-black rounded-2xl p-10 max-w-md w-full border border-off-white/10"
              style={{ boxShadow: '0 0 60px rgba(255, 255, 255, 0.08), 0 20px 40px rgba(0, 0, 0, 0.4)' }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="absolute top-4 right-4 text-off-white/70 hover:text-off-white transition-colors text-2xl leading-none"
              >
                ×
              </button>

              <div className="w-full flex flex-col items-center gap-3 text-center">
                <h2 className="text-off-white">You're in. We'll notify you before the drop goes live.</h2>
                <p className="text-off-white/50 text-sm">Thanks for joining the waitlist.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col items-center gap-8 w-full max-w-md px-6">
        <img 
          src={logo} 
          alt="ARCUS" 
          className="w-64 h-auto opacity-90"
          style={{ transform: 'translateX(8px)' }}
        />
        
        {!submitted ? (
          <>
            <button
              onClick={() => setShowEmailModal(true)}
              className="w-full bg-black text-off-white/70 hover:bg-[rgb(100,100,100)] hover:text-off-white/90 transition-all rounded-[2px] text-[20px] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ transform: 'translateX(3px)' }}
            >
              Join the waitlist
            </button>

            <motion.a
              href="/products"
              onClick={handlePreviewClick}
              className="mt-4 flex items-center justify-center gap-1.5 text-off-white/50 hover:text-off-white/70 transition-colors text-sm"
              style={{ transform: 'translateX(3px)' }}
              animate={isNavigating ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <span>Preview Collection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.a>
          </>
        ) : (
          <>
            <p className="text-off-white/70 text-center" style={{ transform: 'translateX(3px)' }}>Thank you for joining the waitlist</p>
            <motion.a
              href="/products"
              onClick={handlePreviewClick}
              className="mt-4 flex items-center justify-center gap-1.5 text-off-white/50 hover:text-off-white/70 transition-colors text-sm"
              style={{ transform: 'translateX(3px)' }}
              animate={isNavigating ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <span>Preview Collection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.a>
          </>
        )}
      </div>

      {/* Social Media Icons */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-10">
        <a 
          href="https://www.instagram.com/arcuswear/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-off-white/40 hover:text-off-white/70 transition-colors"
        >
          <Instagram className="w-5 h-5" />
        </a>
        <a 
          href="https://www.tiktok.com/@arcuswear?is_from_webapp=1&sender_device=pc" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-off-white/40 hover:text-off-white/70 transition-colors"
        >
          <svg 
            className="w-5 h-5" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
          </svg>
        </a>
      </div>
    </div>
  );
}