import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, ChevronDown, Shirt, Wind, Zap, TrendingUp } from 'lucide-react';
import LongArrowLeft from './LongArrowLeft';
import { Link } from 'react-router-dom';
import { useRepresenterAuth } from '../contexts/RepresenterAuthContext';
import { products } from '../data/products';
import Menu from './Menu';
import MenuButton from './MenuButton';

// Import custom images for Representers page
import arcusTeeNewFront from '../assets/arcusTeeFront.png';
import arcusTeeNewBack from '../assets/arcusTeeBack.png';
import allPathsRepFront from '../assets/allPathsRepFront.png';
import allPathsRepBack from '../assets/allPathsRepBack.png';
import hoodieFront from '../assets/hoodieFront.png';
import hoodieBack from '../assets/hoodieBack.png';

// Custom image mapping for Representers page
const representerImages: Record<string, { front: string; back: string }> = {
  'gid://shopify/Product/10434439544997': { front: arcusTeeNewBack, back: arcusTeeNewFront }, // ARCUS Tee - show back first
  'gid://shopify/Product/10434520613029': { front: allPathsRepBack, back: allPathsRepFront }, // All Paths - show back first
};

// Hoodie images for upcoming section
const hoodieImages = {
  front: hoodieFront,
  back: hoodieBack
};

export default function Representers() {
  const { isAuthenticated, login, logout } = useRepresenterAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoRotateProduct, setAutoRotateProduct] = useState<{ [key: string]: boolean }>({});
  const [autoRotateHoodie, setAutoRotateHoodie] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'upcoming' | 'benefits'>('products');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('tshirts');
  const autoRotateIntervalRef = useRef<Record<string, number>>({});
  const hoodieRotateIntervalRef = useRef<number | null>(null);

  // Auto-rotate images every 7 seconds (always, not just mobile)
  useEffect(() => {
    if (products.length > 0) {
      products.forEach((product) => {
        autoRotateIntervalRef.current[product.id] = window.setInterval(() => {
          setAutoRotateProduct(prev => ({
            ...prev,
            [product.id]: !prev[product.id]
          }));
        }, 7000);
      });

      return () => {
        Object.values(autoRotateIntervalRef.current).forEach((intervalId) => {
          clearInterval(intervalId);
        });
      };
    }
  }, []);

  // Auto-rotate hoodie image every 7 seconds
  useEffect(() => {
    hoodieRotateIntervalRef.current = window.setInterval(() => {
      setAutoRotateHoodie(prev => !prev);
    }, 7000);

    return () => {
      if (hoodieRotateIntervalRef.current) {
        clearInterval(hoodieRotateIntervalRef.current);
      }
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(password);

    if (result.success) {
      setPassword('');
    } else {
      setError(result.error || 'Incorrect access code. Please try again.');
    }

    setLoading(false);
  };

  // Typing animation for placeholder
  const placeholderText = "Enter the access code";
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= placeholderText.length) {
        setTypedText(placeholderText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 80); // 80ms per character for slower typing

    return () => clearInterval(interval);
  }, []);

  // Password Input UI (shown when not authenticated)
  if (!isAuthenticated) {
    return (
      <motion.div
        className="min-h-screen w-screen bg-black text-off-white flex items-center justify-center px-6 relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Animated background gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(100, 150, 255, 0.08) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(150, 100, 255, 0.06) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
          animate={{
            x: [0, -30, 0],
            y: [0, 50, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <div className="max-w-2xl w-full relative z-10 flex flex-col justify-center" style={{ minHeight: '80vh' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative mb-32"
          >
            {/* Title with glow and shine */}
            <div className="relative">
              <h1
                className="text-7xl md:text-8xl text-center font-light tracking-wider relative"
                style={{
                  color: 'rgba(150, 200, 255, 0.95)',
                  textShadow: '0 0 40px rgba(100, 150, 255, 0.6), 0 0 80px rgba(100, 150, 255, 0.4), 0 0 120px rgba(100, 150, 255, 0.2)',
                }}
              >
                {/* Animated shine overlay on text */}
                <motion.div
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                  }}
                >
                  <motion.div
                    className="absolute top-0 bottom-0 w-32"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.8) 50%, transparent 100%)',
                      filter: 'blur(10px)',
                    }}
                    animate={{
                      left: ['-128px', 'calc(100% + 128px)'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                      repeatDelay: 2,
                    }}
                  />
                </motion.div>
                EXCLUSIVE ACCESS
              </h1>
              <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-blue-400/60 to-transparent mx-auto mt-8" />
            </div>
          </motion.div>

          <motion.form
            onSubmit={handleLogin}
            className="flex flex-col gap-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={typedText}
                className="w-full bg-black/60 border-2 border-blue-500/20 px-8 py-6 text-off-white text-xl placeholder:text-off-white/30 focus:outline-none focus:border-blue-500/50 transition-all rounded-2xl backdrop-blur-md"
                style={{
                  boxShadow: '0 8px 32px rgba(100, 150, 255, 0.15), inset 0 0 20px rgba(100, 150, 255, 0.05)',
                }}
                autoFocus
              />
            </motion.div>

            {error && (
              <motion.p
                className="text-red-400 text-center text-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-6 px-8 rounded-2xl hover:from-blue-500 hover:to-blue-400 transition-all relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed text-xl font-medium"
              style={{
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10 tracking-wider uppercase">
                {loading ? 'Verifying...' : 'Enter'}
              </span>
              {!loading && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{
                    x: ['-200%', '200%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                    repeatDelay: 1,
                  }}
                />
              )}
            </motion.button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-24"
          >
            <Link
              to="/"
              className="flex items-center justify-center gap-3 text-off-white/40 hover:text-off-white/60 transition-colors"
            >
              <LongArrowLeft className="w-6 h-4" />
              <span className="tracking-wide text-sm uppercase">Back to Home</span>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Main Content (shown when authenticated)
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

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-end px-6 pb-6 pt-24">
        <div className="flex items-center gap-4">
          <button
            onClick={logout}
            className="text-off-white/60 hover:text-off-white transition-colors flex items-center gap-2 text-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
          <MenuButton onClick={() => setMenuOpen(true)} />
        </div>
      </div>

      {/* Content */}
      <div className="pt-32 px-6 pb-12 w-full flex flex-col items-center">
        <motion.div
          className="relative mb-32"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1
            className="text-6xl md:text-7xl text-center font-light tracking-wider relative"
            style={{
              color: 'rgba(150, 200, 255, 0.95)',
              textShadow: '0 0 30px rgba(100, 150, 255, 0.5), 0 0 60px rgba(100, 150, 255, 0.3)',
            }}
          >
            EXCLUSIVE ACCESS
          </h1>
          <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-blue-400/60 to-transparent mx-auto mt-6" />
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          className="flex justify-center gap-3 mb-40"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            onClick={() => setActiveTab('products')}
            className={`px-10 py-4 rounded-2xl transition-all duration-300 relative overflow-hidden ${
              activeTab === 'products'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'bg-off-white/5 text-off-white/70 hover:bg-off-white/10 hover:text-off-white border border-off-white/10'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {activeTab === 'products' && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            )}
            <span className="relative z-10 font-medium tracking-wide">Products</span>
          </motion.button>

          <motion.button
            onClick={() => setActiveTab('upcoming')}
            className={`px-10 py-4 rounded-2xl transition-all duration-300 relative overflow-hidden ${
              activeTab === 'upcoming'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'bg-off-white/5 text-off-white/70 hover:bg-off-white/10 hover:text-off-white border border-off-white/10'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {activeTab === 'upcoming' && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            )}
            <span className="relative z-10 font-medium tracking-wide">Upcoming</span>
          </motion.button>

          <motion.button
            onClick={() => setActiveTab('benefits')}
            className={`px-10 py-4 rounded-2xl transition-all duration-300 relative overflow-hidden ${
              activeTab === 'benefits'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'bg-off-white/5 text-off-white/70 hover:bg-off-white/10 hover:text-off-white border border-off-white/10'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {activeTab === 'benefits' && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            )}
            <span className="relative z-10 font-medium tracking-wide">Benefits</span>
          </motion.button>
        </motion.div>

        {/* Upcoming Drops Tab */}
        {activeTab === 'upcoming' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-16 w-full max-w-4xl"
          >
            {[
              { id: 'upcoming-tshirts', name: 'T-Shirts', desc: 'Essential tees', icon: Shirt, count: 0, gradient: 'from-purple-500/20 to-pink-500/20' },
              { id: 'upcoming-hoodies', name: 'Hoodies', desc: 'Comfort meets style', icon: Wind, count: 1, gradient: 'from-blue-500/20 to-cyan-500/20' },
              { id: 'upcoming-jackets', name: 'Jackets', desc: 'Premium outerwear', icon: Zap, count: 0, gradient: 'from-orange-500/20 to-red-500/20' },
              { id: 'upcoming-sweatpants', name: 'Sweatpants', desc: 'Relaxed fit', icon: TrendingUp, count: 0, gradient: 'from-green-500/20 to-emerald-500/20' },
            ].map((category) => {
              const Icon = category.icon;
              return (
                <motion.div
                  key={category.id}
                  className="relative rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245, 245, 240, 0.05) 0%, rgba(245, 245, 240, 0.01) 100%)',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(245, 245, 240, 0.1)',
                  }}
                  whileHover={{ scale: 1.01, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(245, 245, 240, 0.2)' }}
                >
                  {/* Gradient accent border */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-20`} style={{ mixBlendMode: 'overlay' }} />

                  <button
                    onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                    className="relative w-full p-10 flex items-center gap-8 text-left group"
                  >
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-xl bg-off-white/10 flex items-center justify-center group-hover:bg-off-white/15 transition-all duration-300">
                      <Icon className="w-8 h-8 text-off-white/80" />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-3xl text-off-white font-medium">{category.name}</h3>
                        <span className="px-3 py-1.5 rounded-full bg-off-white/10 text-off-white/60 text-sm font-medium">
                          {category.count} items
                        </span>
                      </div>
                      <p className="text-off-white/50 text-base">{category.desc}</p>
                    </div>

                    {/* Chevron */}
                    <motion.div
                      animate={{ rotate: expandedCategory === category.id ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="w-12 h-12 rounded-full bg-off-white/10 flex items-center justify-center"
                    >
                      <ChevronDown className="w-6 h-6 text-off-white/60" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {expandedCategory === category.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-8 pb-8 pt-4 border-t border-off-white/10">
                          {category.id === 'upcoming-hoodies' ? (
                            <div className="flex justify-center mt-6">
                              <motion.div
                                className="w-64"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                              >
                                {/* Hoodie Image Container */}
                                <div
                                  className="aspect-[3/4] mb-4 overflow-hidden relative cursor-pointer rounded-xl transition-all duration-300"
                                  style={{
                                    backgroundColor: '#1A1A1A',
                                    maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 100%)',
                                    WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 100%)',
                                  }}
                                >
                                  {/* Micro-shadow - ambient occlusion under hoodie */}
                                  <div
                                    className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
                                    style={{
                                      width: '60%',
                                      height: '8%',
                                      background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.08) 0%, transparent 70%)',
                                      filter: 'blur(8px) contrast(0.95)',
                                      zIndex: 1,
                                    }}
                                  />

                                  {/* Soft vignette overlay */}
                                  <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                      background: 'radial-gradient(ellipse 80% 90% at center, transparent 0%, rgba(26, 26, 26, 0.4) 70%, rgba(26, 26, 26, 0.95) 100%)',
                                      zIndex: 2,
                                    }}
                                  />

                                  {/* Front/Back Image Transition */}
                                  <AnimatePresence mode="wait">
                                    <motion.img
                                      key={autoRotateHoodie ? 'back' : 'front'}
                                      src={autoRotateHoodie ? hoodieImages.back : hoodieImages.front}
                                      alt="All Paths Hoodie"
                                      className="w-full h-full object-cover absolute"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      transition={{ duration: 0.4 }}
                                      style={{
                                        objectPosition: 'center center',
                                        left: 0,
                                        width: '100%',
                                        top: 0,
                                        height: '100%'
                                      }}
                                    />
                                  </AnimatePresence>
                                </div>

                                {/* Hoodie Info */}
                                <div className="text-center">
                                  <h3 className="text-sm mb-2 text-off-white tracking-wide">
                                    All Paths Hoodie
                                  </h3>
                                  <span className="text-off-white/70 text-xs">
                                    Coming Soon
                                  </span>
                                </div>
                              </motion.div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center py-12 bg-off-white/[0.02] rounded-xl border border-off-white/10">
                              <p className="text-off-white/50 text-sm">Coming Soon</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-16 w-full max-w-4xl"
          >
            {/* T-Shirts Dropdown */}
            <motion.div
              className="relative rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(245, 245, 240, 0.05) 0%, rgba(245, 245, 240, 0.01) 100%)',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(245, 245, 240, 0.1)',
              }}
              whileHover={{ scale: 1.01, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(245, 245, 240, 0.2)' }}
            >
              {/* Gradient accent */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 opacity-20" style={{ mixBlendMode: 'overlay' }} />
              <button
                onClick={() => setExpandedCategory(expandedCategory === 'tshirts' ? null : 'tshirts')}
                className="relative w-full p-10 flex items-center gap-8 text-left group"
              >
                {/* Icon */}
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all duration-300">
                  <Shirt className="w-8 h-8 text-off-white/80" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-3xl text-off-white font-medium">T-Shirts</h3>
                    <span className="px-3 py-1.5 rounded-full bg-off-white/10 text-off-white/60 text-sm font-medium">
                      2 items
                    </span>
                  </div>
                  <p className="text-off-white/50 text-base">Essential tees</p>
                </div>

                {/* Chevron */}
                <motion.div
                  animate={{ rotate: expandedCategory === 'tshirts' ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-12 h-12 rounded-full bg-off-white/10 flex items-center justify-center"
                >
                  <ChevronDown className="w-6 h-6 text-off-white/60" />
                </motion.div>
              </button>

              <AnimatePresence>
                {expandedCategory === 'tshirts' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-8 pb-8 pt-4 border-t border-off-white/10">
                      <div className="flex justify-center gap-8 mt-6">
                        {products.map((product, index) => (
                          <motion.div
                            key={product.id}
                            className="group relative w-64"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                          >
                            {/* Product Image Container */}
                            <div
                              className="aspect-[3/4] mb-4 overflow-hidden relative cursor-pointer rounded-xl transition-all duration-300"
                              style={{
                                backgroundColor: '#1A1A1A',
                                maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 100%)',
                                WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 100%)',
                              }}
                            >
                              {/* Micro-shadow - ambient occlusion under shirt */}
                              <div
                                className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
                                style={{
                                  width: '60%',
                                  height: '8%',
                                  background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.08) 0%, transparent 70%)',
                                  filter: 'blur(8px) contrast(0.95)',
                                  zIndex: 1,
                                }}
                              />

                              {/* Soft vignette overlay */}
                              <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                  background: 'radial-gradient(ellipse 80% 90% at center, transparent 0%, rgba(26, 26, 26, 0.4) 70%, rgba(26, 26, 26, 0.95) 100%)',
                                  zIndex: 2,
                                }}
                              />

                              {/* Front/Back Image Transition */}
                              <AnimatePresence mode="wait">
                                <motion.img
                                  key={autoRotateProduct[product.id] ? 'back' : 'front'}
                                  src={autoRotateProduct[product.id]
                                    ? representerImages[product.id].back
                                    : representerImages[product.id].front}
                                  alt={product.name}
                                  className="w-full h-full object-cover absolute"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.4 }}
                                  style={{
                                    objectPosition: 'center center',
                                    left: 0,
                                    width: '100%',
                                    top: 0,
                                    height: '100%'
                                  }}
                                />
                              </AnimatePresence>
                            </div>

                            {/* Product Info with Discount */}
                            <div className="text-center">
                              <h3 className="text-sm mb-2 text-off-white tracking-wide">
                                {product.name}
                              </h3>
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-off-white/40 line-through text-xs">
                                  ${product.price.toFixed(2)}
                                </span>
                                <span className="text-lg text-off-white font-medium">
                                  $15
                                </span>
                              </div>
                              <div className="mt-1 text-[10px] text-green-400">
                                Representer Price
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Other Categories */}
            {[
              { id: 'hoodies', name: 'Hoodies', desc: 'Comfort meets style', icon: Wind, count: 0, gradient: 'from-blue-500/20 to-cyan-500/20' },
              { id: 'jackets', name: 'Jackets', desc: 'Premium outerwear', icon: Zap, count: 0, gradient: 'from-orange-500/20 to-red-500/20' },
              { id: 'sweatpants', name: 'Sweatpants', desc: 'Relaxed fit', icon: TrendingUp, count: 0, gradient: 'from-green-500/20 to-emerald-500/20' },
            ].map((category) => {
              const Icon = category.icon;
              return (
                <motion.div
                  key={category.id}
                  className="relative rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245, 245, 240, 0.05) 0%, rgba(245, 245, 240, 0.01) 100%)',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(245, 245, 240, 0.1)',
                  }}
                  whileHover={{ scale: 1.01, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(245, 245, 240, 0.2)' }}
                >
                  {/* Gradient accent */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-20`} style={{ mixBlendMode: 'overlay' }} />
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                    className="relative w-full p-10 flex items-center gap-8 text-left group"
                  >
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center group-hover:scale-110 transition-all duration-300`}>
                      <Icon className="w-8 h-8 text-off-white/80" />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-3xl text-off-white font-medium">{category.name}</h3>
                        <span className="px-3 py-1.5 rounded-full bg-off-white/10 text-off-white/60 text-sm font-medium">
                          {category.count} items
                        </span>
                      </div>
                      <p className="text-off-white/50 text-base">{category.desc}</p>
                    </div>

                    {/* Chevron */}
                    <motion.div
                      animate={{ rotate: expandedCategory === category.id ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="w-12 h-12 rounded-full bg-off-white/10 flex items-center justify-center"
                    >
                      <ChevronDown className="w-6 h-6 text-off-white/60" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {expandedCategory === category.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-8 pb-8 pt-4 border-t border-off-white/10">
                          {category.id === 'upcoming-hoodies' ? (
                            <div className="flex justify-center mt-6">
                              <motion.div
                                className="w-64"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                              >
                                {/* Hoodie Image Container */}
                                <div
                                  className="aspect-[3/4] mb-4 overflow-hidden relative cursor-pointer rounded-xl transition-all duration-300"
                                  style={{
                                    backgroundColor: '#1A1A1A',
                                    maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 100%)',
                                    WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 100%)',
                                  }}
                                >
                                  {/* Micro-shadow - ambient occlusion under hoodie */}
                                  <div
                                    className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
                                    style={{
                                      width: '60%',
                                      height: '8%',
                                      background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.08) 0%, transparent 70%)',
                                      filter: 'blur(8px) contrast(0.95)',
                                      zIndex: 1,
                                    }}
                                  />

                                  {/* Soft vignette overlay */}
                                  <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                      background: 'radial-gradient(ellipse 80% 90% at center, transparent 0%, rgba(26, 26, 26, 0.4) 70%, rgba(26, 26, 26, 0.95) 100%)',
                                      zIndex: 2,
                                    }}
                                  />

                                  {/* Front/Back Image Transition */}
                                  <AnimatePresence mode="wait">
                                    <motion.img
                                      key={autoRotateHoodie ? 'back' : 'front'}
                                      src={autoRotateHoodie ? hoodieImages.back : hoodieImages.front}
                                      alt="All Paths Hoodie"
                                      className="w-full h-full object-cover absolute"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      transition={{ duration: 0.4 }}
                                      style={{
                                        objectPosition: 'center center',
                                        left: 0,
                                        width: '100%',
                                        top: 0,
                                        height: '100%'
                                      }}
                                    />
                                  </AnimatePresence>
                                </div>

                                {/* Hoodie Info */}
                                <div className="text-center">
                                  <h3 className="text-sm mb-2 text-off-white tracking-wide">
                                    All Paths Hoodie
                                  </h3>
                                  <span className="text-off-white/70 text-xs">
                                    Coming Soon
                                  </span>
                                </div>
                              </motion.div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center py-12 bg-off-white/[0.02] rounded-xl border border-off-white/10">
                              <p className="text-off-white/50 text-sm">Coming Soon</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Benefits Tab */}
        {activeTab === 'benefits' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-20 w-full max-w-4xl"
          >
            {/* Main benefit card */}
            <motion.div
              className="relative rounded-3xl overflow-hidden backdrop-blur-sm p-12"
              style={{
                background: 'linear-gradient(135deg, rgba(100, 150, 255, 0.08) 0%, rgba(150, 100, 255, 0.05) 100%)',
                boxShadow: '0 8px 32px rgba(100, 150, 255, 0.15), inset 0 0 0 1px rgba(100, 150, 255, 0.2)',
              }}
              whileHover={{ scale: 1.01 }}
            >
              {/* Animated gradient background */}
              <motion.div
                className="absolute inset-0 opacity-30"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(100, 150, 255, 0.1) 0%, transparent 70%)',
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              <div className="relative z-10 space-y-8">
                <div className="text-center">
                  <h3 className="text-4xl text-off-white mb-4 font-light tracking-wide">How It Works</h3>
                  <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-blue-400/60 to-transparent mx-auto" />
                </div>

                <div className="space-y-6 text-center">
                  <p className="text-xl text-off-white/80 leading-relaxed">
                    Post on all platforms and tag <span className="text-blue-400 font-medium">@arcusapparel</span>
                  </p>

                  <motion.div
                    className="p-8 rounded-2xl bg-black/20 border border-blue-500/20"
                    whileHover={{ scale: 1.02 }}
                  >
                    <p className="text-2xl text-blue-300 mb-3 font-light">More Views = More Posts</p>
                    <p className="text-lg text-off-white/70">The more posting we see, the more benefits we'll provide</p>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                    <motion.div
                      className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20"
                      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(100, 150, 255, 0.2)' }}
                    >
                      <div className="text-3xl mb-2">🎁</div>
                      <h4 className="text-xl text-off-white mb-2">Free Clothing</h4>
                      <p className="text-off-white/60 text-sm">Earn exclusive pieces</p>
                    </motion.div>

                    <motion.div
                      className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20"
                      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(150, 100, 255, 0.2)' }}
                    >
                      <div className="text-3xl mb-2">💸</div>
                      <h4 className="text-xl text-off-white mb-2">Crazy Discounts</h4>
                      <p className="text-off-white/60 text-sm">Special pricing unlocked</p>
                    </motion.div>
                  </div>
                </div>

                <div className="pt-8 border-t border-off-white/10">
                  <p className="text-center text-off-white/70 text-lg leading-relaxed">
                    Feel free to contact us on our personal accounts or the <span className="text-blue-400">@arcusapparel</span> Instagram
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
