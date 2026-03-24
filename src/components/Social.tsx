import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ShoppingBag, Instagram } from 'lucide-react';
import LongArrowLeft from './LongArrowLeft';
import Menu from './Menu';
import Cart from './Cart';
import { useCart } from '../contexts/CartContext';

// TikTok videos data
const tiktokVideos = [
  {
    id: '7597289523835407630',
    url: 'https://www.tiktok.com/@arcuswear/video/7597289523835407630',
  },
  {
    id: '7597965026963492109',
    url: 'https://www.tiktok.com/@arcuswear/video/7597965026963492109',
  },
  {
    id: '7598404354059537719',
    url: 'https://www.tiktok.com/@arcuswear/video/7598404354059537719',
  },
  {
    id: '7595796355214232846',
    url: 'https://www.tiktok.com/@arcuswear/video/7595796355214232846',
  },
];

// Instagram Elfsight widget ID
const INSTAGRAM_WIDGET_ID = 'd41c06cd-fcf5-415a-84a2-df6792147acc';

// TikTok Icon Component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

export default function Social() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const navigate = useNavigate();
  const { getCartItemCount } = useCart();

  // Load Elfsight script for Instagram
  useEffect(() => {
    // Remove any existing elfsight scripts first to ensure fresh load
    const existingScripts = document.querySelectorAll('script[src*="elfsight"]');
    
    // Add the script
    const script = document.createElement('script');
    script.src = 'https://static.elfsight.com/platform/platform.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      // Force widget initialization after script loads
      setTimeout(() => {
        if ((window as any).eapps) {
          (window as any).eapps.initWidgets();
        }
      }, 500);
    };

    // Function to remove Elfsight branding links
    const removeElfsightBranding = () => {
      const brandingLinks = document.querySelectorAll('a[href*="elfsight"]');
      brandingLinks.forEach(link => {
        link.remove();
      });
    };

    // Run multiple times to catch dynamically added elements
    const intervals = [1000, 2000, 3000, 5000, 8000];
    intervals.forEach(delay => {
      setTimeout(removeElfsightBranding, delay);
    });

    // Also use MutationObserver to catch any new branding elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(() => {
        removeElfsightBranding();
      });
    });

    setTimeout(() => {
      const widgetContainer = document.querySelector('[id^="eapps-instagram-feed"]');
      if (widgetContainer) {
        observer.observe(widgetContainer, { childList: true, subtree: true });
      }
    }, 2000);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Load TikTok embed script
  useEffect(() => {
    const existingScript = document.querySelector('script[src*="tiktok.com/embed"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <motion.div
      className="min-h-screen w-screen text-off-white relative"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, #1A1A1A 0%, #0a0a0a 100%)'
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Header - No background for Social page */}
      <header
        className="fixed w-full z-50"
        style={{
          top: '0px',
          paddingTop: '32px',
          paddingBottom: '40px',
          background: 'transparent'
        }}
      >
        <div className="relative w-full flex items-center justify-between" style={{ paddingLeft: '32px', paddingRight: '32px' }}>
          {/* Back button on left */}
          <button
            onClick={() => navigate(-1)}
            className="p-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
            style={{ marginLeft: '16px' }}
            aria-label="Go back"
          >
            <LongArrowLeft className="w-8 h-6 text-off-white" />
          </button>

          {/* Cart and Menu buttons on right */}
          <div className="flex items-center gap-8">
            {/* Cart Icon */}
            <button
              onClick={() => setCartOpen(true)}
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
              onClick={() => setMenuOpen(true)}
              className="p-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity flex flex-col gap-1 w-5"
              style={{ marginRight: '16px' }}
              aria-label="Open menu"
            >
              <motion.div className="h-0.5 w-full bg-off-white" animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }} transition={{ duration: 0.3 }} />
              <motion.div className="h-0.5 w-full bg-off-white" animate={menuOpen ? { opacity: 0 } : { opacity: 1 }} transition={{ duration: 0.3 }} />
              <motion.div className="h-0.5 w-full bg-off-white" animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }} transition={{ duration: 0.3 }} />
            </button>
          </div>
        </div>
      </header>

      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1.2, 1, 1.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Main Content */}
      <main className="min-h-screen w-screen px-4 md:px-8 lg:px-16 pt-36 pb-24 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Page Title with glow effect */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.h1
              className="text-off-white tracking-widest uppercase font-mono text-4xl md:text-5xl lg:text-6xl mb-4"
              style={{
                fontFamily: '"Space Mono", Monaco, Consolas, "Courier New", monospace',
                letterSpacing: '0.3em',
                textShadow: '0 0 40px rgba(245, 245, 240, 0.3), 0 0 80px rgba(245, 245, 240, 0.1)',
              }}
              animate={{
                textShadow: [
                  '0 0 40px rgba(245, 245, 240, 0.3), 0 0 80px rgba(245, 245, 240, 0.1)',
                  '0 0 60px rgba(245, 245, 240, 0.5), 0 0 100px rgba(245, 245, 240, 0.2)',
                  '0 0 40px rgba(245, 245, 240, 0.3), 0 0 80px rgba(245, 245, 240, 0.1)',
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              COMMUNITY
            </motion.h1>
            <motion.p 
              className="text-off-white/50 text-sm md:text-base tracking-widest uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Follow our journey on social media
            </motion.p>
          </motion.div>

          {/* ========== INSTAGRAM SECTION ========== */}
          <motion.section
            className="mb-20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Instagram Header with gradient glow */}
            <div className="flex flex-col items-center justify-center gap-3 mb-8">
              <motion.div 
                className="flex items-center gap-4 px-6 py-3 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(251, 146, 60, 0.1) 100%)',
                  border: '1px solid rgba(236, 72, 153, 0.2)',
                  boxShadow: '0 0 30px rgba(236, 72, 153, 0.15), inset 0 0 20px rgba(236, 72, 153, 0.05)',
                }}
                whileHover={{
                  boxShadow: '0 0 50px rgba(236, 72, 153, 0.3), inset 0 0 30px rgba(236, 72, 153, 0.1)',
                  scale: 1.02,
                }}
                transition={{ duration: 0.3 }}
              >
                <Instagram className="w-7 h-7 text-pink-400" />
                <h2 
                  className="uppercase tracking-widest text-xl md:text-2xl font-mono"
                  style={{
                    background: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Instagram
                </h2>
              </motion.div>
              <a
                href="https://www.instagram.com/arcuswear/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-off-white/50 hover:text-pink-400 transition-colors text-sm tracking-wider"
              >
                @arcuswear
              </a>
            </div>

            {/* Instagram Feed Container with glowing border */}
            <motion.div 
              className="rounded-2xl overflow-hidden p-4 min-h-[500px] relative"
              style={{
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(251, 146, 60, 0.05) 100%)',
                border: '1px solid rgba(236, 72, 153, 0.2)',
                boxShadow: '0 0 40px rgba(236, 72, 153, 0.1), inset 0 0 60px rgba(0, 0, 0, 0.3)',
              }}
              whileHover={{
                boxShadow: '0 0 60px rgba(236, 72, 153, 0.2), inset 0 0 60px rgba(0, 0, 0, 0.3)',
              }}
              transition={{ duration: 0.3 }}
            >
              {/* Hide Elfsight branding completely - ultra aggressive */}
              <style>{`
                .eapps-instagram-feed-title,
                a[href*="elfsight"],
                a[href*="elfsight.com"],
                a[href*="instagram-feed-instashow"],
                a[href*="utm_source=websites"],
                a[href*="utm_campaign=free-widget"],
                .eapps-link,
                [class*="eapps-widget-toolbar"],
                .eapps-instagram-feed-container > a,
                div[class*="powered"],
                a[title*="Free Instagram Feed Widget"],
                a[title*="Elfsight"],
                [id*="eapps-instagram-feed"] > a,
                [id^="eapps-instagram-feed"] > a[target="_blank"],
                div[id^="eapps-instagram-feed"] > a,
                .elfsight-app-d41c06cd-fcf5-415a-84a2-df6792147acc > a,
                [class*="elfsight-app"] > a,
                a[rel="noreferrer"][target="_blank"][href*="elfsight"],
                .eapps-instagram-feed > a,
                div.eapps-instagram-feed-container + a,
                a:has(> svg),
                [id^="eapps"] a[href*="elfsight"] {
                  display: none !important;
                  visibility: hidden !important;
                  opacity: 0 !important;
                  height: 0 !important;
                  width: 0 !important;
                  max-height: 0 !important;
                  max-width: 0 !important;
                  overflow: hidden !important;
                  position: absolute !important;
                  left: -99999px !important;
                  top: -99999px !important;
                  pointer-events: none !important;
                  font-size: 0 !important;
                  line-height: 0 !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  border: 0 !important;
                  clip: rect(0,0,0,0) !important;
                  clip-path: inset(100%) !important;
                  transform: scale(0) !important;
                  z-index: -9999 !important;
                }
              `}</style>
              <div 
                className={`elfsight-app-${INSTAGRAM_WIDGET_ID}`}
                data-elfsight-app-lazy
              />
              {/* Bottom overlay to cover any branding */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                style={{
                  background: 'linear-gradient(to top, #0a0a0a 0%, #0a0a0a 50%, transparent 100%)',
                }}
              />
            </motion.div>

            {/* Instagram Follow Button */}
            <div className="flex justify-center mt-8">
              <motion.a
                href="https://www.instagram.com/arcuswear/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-full transition-all"
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(236, 72, 153, 0.5)' }}
                whileTap={{ scale: 0.95 }}
              >
                <Instagram className="w-6 h-6 text-white" />
                <span className="text-white font-semibold uppercase tracking-wider">Follow on Instagram</span>
              </motion.a>
            </div>
          </motion.section>

          {/* ========== TIKTOK SECTION ========== */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* TikTok Header with glow - centered */}
            <div className="flex flex-col items-center justify-center gap-3 mb-8 w-full">
              <motion.div 
                className="flex items-center justify-center gap-4 px-8 py-3 rounded-full mx-auto"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 242, 234, 0.1) 0%, rgba(255, 0, 80, 0.1) 100%)',
                  border: '1px solid rgba(0, 242, 234, 0.2)',
                  boxShadow: '0 0 30px rgba(0, 242, 234, 0.15), inset 0 0 20px rgba(0, 242, 234, 0.05)',
                }}
                whileHover={{
                  boxShadow: '0 0 50px rgba(0, 242, 234, 0.3), inset 0 0 30px rgba(0, 242, 234, 0.1)',
                  scale: 1.02,
                }}
                transition={{ duration: 0.3 }}
              >
                <TikTokIcon className="w-7 h-7 text-cyan-400" />
                <h2 
                  className="uppercase tracking-widest text-xl md:text-2xl font-mono"
                  style={{
                    background: 'linear-gradient(135deg, #00f2ea 0%, #ff0050 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  TikTok
                </h2>
              </motion.div>
              <a
                href="https://www.tiktok.com/@arcuswear"
                target="_blank"
                rel="noopener noreferrer"
                className="text-off-white/50 hover:text-cyan-400 transition-colors text-sm tracking-wider"
              >
                @arcuswear
              </a>
            </div>

            {/* TikTok Videos - All 4 in a single row */}
            <motion.div 
              className="rounded-2xl p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 242, 234, 0.05) 0%, rgba(255, 0, 80, 0.05) 100%)',
                border: '1px solid rgba(0, 242, 234, 0.2)',
                boxShadow: '0 0 40px rgba(0, 242, 234, 0.1), inset 0 0 60px rgba(0, 0, 0, 0.3)',
                overflowX: 'auto',
              }}
              whileHover={{
                boxShadow: '0 0 60px rgba(0, 242, 234, 0.2), inset 0 0 60px rgba(0, 0, 0, 0.3)',
              }}
              transition={{ duration: 0.3 }}
            >
              {/* Dark mode styling for TikTok embeds */}
              <style>{`
                .tiktok-embed {
                  background: #121212 !important;
                  border-radius: 12px !important;
                  overflow: hidden !important;
                }
                .tiktok-embed iframe {
                  border-radius: 12px !important;
                }
              `}</style>
              <div className="flex flex-row gap-4 justify-center items-start">
                {tiktokVideos.map((video, index) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex-shrink-0"
                  >
                    <div 
                      className="rounded-xl overflow-hidden"
                      style={{
                        background: '#121212',
                        padding: '4px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      <blockquote
                        className="tiktok-embed"
                        cite={video.url}
                        data-video-id={video.id}
                        style={{ width: '230px', minWidth: '230px', maxWidth: '230px', margin: 0 }}
                      >
                        <section>
                          <a 
                            target="_blank" 
                            rel="noopener noreferrer"
                            href="https://www.tiktok.com/@arcuswear"
                          >
                            @arcuswear
                          </a>
                        </section>
                      </blockquote>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* TikTok Follow Button */}
            <div className="flex justify-center mt-8">
              <motion.a
                href="https://www.tiktok.com/@arcuswear"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-8 py-4 bg-black rounded-full border-2 border-off-white/30 transition-all"
                whileHover={{ scale: 1.05, borderColor: 'rgba(245, 245, 240, 0.8)', boxShadow: '0 0 30px rgba(245, 245, 240, 0.2)' }}
                whileTap={{ scale: 0.95 }}
              >
                <TikTokIcon className="w-6 h-6 text-off-white" />
                <span className="text-off-white font-semibold uppercase tracking-wider">Follow on TikTok</span>
              </motion.a>
            </div>
          </motion.section>
        </div>
      </main>
    </motion.div>
  );
}
