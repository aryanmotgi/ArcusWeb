import { useState, useEffect, type FormEvent, type MouseEvent } from 'react';
import { Mail, ArrowRight, Instagram } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import logo from '../assets/arcus-wordmark.png';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import Menu from './Menu';
import MenuButton from './MenuButton';
import Logo3DTransform from './Logo3DTransform';

export default function Landing() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [hoveringButton, setHoveringButton] = useState<string | null>(null);
  const [clickingButton, setClickingButton] = useState(false);
  const [logoOverride, setLogoOverride] = useState<{ x: number; y: number } | null>(null);
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

  const closeModal = () => {
    setShowEmailModal(false);
    setEmail('');
    setMarketingConsent(false);
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateInput(email)) {
      setError('Please enter your email');
      return;
    }

    if (!marketingConsent) {
      setError('Please agree to receive marketing emails');
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

  const handlePreviewClick = (e: MouseEvent) => {
    e.preventDefault();
    setIsNavigating(true);
    setLogoOverride({ x: 0, y: 0.8 }); // Look down
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


  // Calculate logo tint color based on hover/click state
  const getLogoTint = () => {
    if (clickingButton) {
      return 'rgba(150, 200, 255, 0.7)'; // Strong blue tint on click
    }
    if (hoveringButton === 'waitlist') {
      return 'rgba(120, 180, 255, 0.5)'; // More visible blue tint on waitlist hover
    }
    if (hoveringButton === 'preview') {
      return 'rgba(140, 190, 255, 0.5)'; // More visible blue tint on preview hover
    }
    return undefined;
  };

  return (
    <div className="min-h-screen w-screen bg-black text-off-white flex items-center justify-center relative h-screen" style={{ overflow: 'hidden', perspective: '1000px' }}>
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <motion.div
        className="fixed top-6 right-6 z-50"
        initial={{
          opacity: 0,
          rotate: -90,
          scale: 0.5
        }}
        animate={{
          opacity: 1,
          rotate: 0,
          scale: 1
        }}
        transition={{
          delay: 0.6,
          duration: 0.8,
          ease: [0.34, 1.56, 0.64, 1]
        }}
      >
        <MenuButton onClick={() => setMenuOpen(true)} />
      </motion.div>

      {/* Email Modal */}
      <AnimatePresence>
        {showEmailModal && !submitted && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
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
                onClick={closeModal}
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
                    placeholder="Enter your email"
                    required
                    className="w-full bg-transparent border-b border-off-white/20 px-4 py-3 text-off-white placeholder:text-off-white/30 focus:outline-none focus:border-off-white/50 transition-colors"
                  />
                </div>

                {/* Marketing Consent Checkbox */}
                <div className="w-full flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="marketing-consent"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-off-white cursor-pointer"
                  />
                  <label htmlFor="marketing-consent" className="text-off-white/70 text-sm leading-relaxed cursor-pointer">
                    I agree to receive marketing emails and updates from Arcus
                  </label>
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
        <motion.div
          className="w-64 h-auto opacity-90"
          style={{
            transform: 'translateX(8px)',
            aspectRatio: '588/424',
            overflow: 'visible',
            position: 'relative',
            willChange: 'transform',
          }}
          initial={{
            opacity: 0,
            scale: 0.3,
            filter: "blur(20px)"
          }}
          animate={isNavigating ? {
            opacity: 0,
            scale: 15,
            filter: "blur(40px)",
            translateZ: 2000,
          } : {
            opacity: 0.9,
            scale: 1,
            filter: "blur(0px)"
          }}
          transition={isNavigating ? {
            duration: 0.8,
            ease: [0.6, 0.01, 0.05, 0.95],
          } : {
            duration: 1.2,
            ease: [0.16, 1, 0.3, 1],
            opacity: { duration: 0.8 },
            filter: { duration: 1.0 }
          }}
        >
          <Logo3DTransform
            tintColor={getLogoTint()}
            overridePosition={logoOverride}
          />
        </motion.div>

        {!submitted ? (
          <>
            <motion.button
              onClick={() => {
                setClickingButton(true);
                setLogoOverride({ x: 0, y: 0.8 }); // Look down
                setTimeout(() => {
                  setClickingButton(false);
                  setShowEmailModal(true);
                }, 500);
              }}
              onMouseEnter={() => setHoveringButton('waitlist')}
              onMouseLeave={() => setHoveringButton(null)}
              className="w-full bg-black text-off-white/70 hover:bg-[rgb(100,100,100)] hover:text-off-white/90 transition-all rounded-[2px] text-[20px] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ transform: 'translateX(3px)' }}
              initial={{
                opacity: 0,
                y: 100,
                scale: 0.8
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1
              }}
              transition={{
                delay: 0.8,
                type: "spring",
                stiffness: 200,
                damping: 20,
                mass: 1.2
              }}
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.2 }
              }}
            >
              Join the waitlist
            </motion.button>

            <motion.a
              href="/products"
              onClick={(e) => {
                e.preventDefault();
                setClickingButton(true);
                setTimeout(() => {
                  setClickingButton(false);
                  setIsNavigating(true);
                  setTimeout(() => {
                    navigate('/products');
                  }, 700);
                }, 100);
              }}
              onMouseEnter={() => setHoveringButton('preview')}
              onMouseLeave={() => setHoveringButton(null)}
              className="mt-4 flex items-center justify-center gap-1.5 text-off-white/50 hover:text-off-white/70 transition-colors text-sm"
              style={{ transform: 'translateX(3px)' }}
              initial={{
                opacity: 0,
                y: 30,
                filter: "blur(4px)"
              }}
              animate={isNavigating ? {
                opacity: 0,
                y: -10
              } : {
                opacity: 1,
                y: 0,
                filter: "blur(0px)"
              }}
              transition={{
                delay: isNavigating ? 0 : 1.2,
                duration: isNavigating ? 0.4 : 0.6,
                ease: isNavigating ? 'easeOut' : [0.22, 1, 0.36, 1]
              }}
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
              onClick={(e) => {
                e.preventDefault();
                setClickingButton(true);
                setTimeout(() => {
                  setClickingButton(false);
                  setIsNavigating(true);
                  setTimeout(() => {
                    navigate('/products');
                  }, 700);
                }, 100);
              }}
              onMouseEnter={() => setHoveringButton('preview')}
              onMouseLeave={() => setHoveringButton(null)}
              className="mt-4 flex items-center justify-center gap-1.5 text-off-white/50 hover:text-off-white/70 transition-colors text-sm"
              style={{ transform: 'translateX(3px)' }}
              initial={{
                opacity: 0,
                y: 30,
                filter: "blur(4px)"
              }}
              animate={isNavigating ? {
                opacity: 0,
                y: -10
              } : {
                opacity: 1,
                y: 0,
                filter: "blur(0px)"
              }}
              transition={{
                delay: isNavigating ? 0 : 1.2,
                duration: isNavigating ? 0.4 : 0.6,
                ease: isNavigating ? 'easeOut' : [0.22, 1, 0.36, 1]
              }}
            >
              <span>Preview Collection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.a>
          </>
        )}
      </div>

      {/* Social Media Icons */}
      <motion.div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-10"
          initial="hidden"
          animate="visible"
          variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.15,
              delayChildren: 1.6
            }
          }
        }}
      >
        <motion.a
          href="https://www.instagram.com/arcuswear/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-off-white/40 hover:text-off-white/70 transition-colors"
          variants={{
            hidden: {
              opacity: 0,
              scale: 0,
              rotate: -180,
              y: 20
            },
            visible: {
              opacity: 0.4,
              scale: 1,
              rotate: 0,
              y: 0,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 15
              }
            }
          }}
          whileHover={{
            scale: 1.2,
            opacity: 0.7,
            transition: { duration: 0.2 }
          }}
        >
          <Instagram className="w-5 h-5" />
        </motion.a>
        <motion.a
          href="https://www.tiktok.com/@arcuswear?is_from_webapp=1&sender_device=pc"
          target="_blank"
          rel="noopener noreferrer"
          className="text-off-white/40 hover:text-off-white/70 transition-colors"
          variants={{
            hidden: {
              opacity: 0,
              scale: 0,
              rotate: -180,
              y: 20
            },
            visible: {
              opacity: 0.4,
              scale: 1,
              rotate: 0,
              y: 0,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 15
              }
            }
          }}
          whileHover={{
            scale: 1.2,
            opacity: 0.7,
            transition: { duration: 0.2 }
          }}
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
          </svg>
        </motion.a>
      </motion.div>
    </div>
  );
}