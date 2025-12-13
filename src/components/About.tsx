import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import logo from 'figma:asset/ff5b86f92109795491adae82bfa15da8accc1415.png';
import { useState } from 'react';
import Menu from './Menu';
import MenuButton from './MenuButton';

export default function About() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen w-screen bg-black text-off-white">
      <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      
      {/* Header */}
      <header className="fixed top-0 w-full backdrop-blur-sm border-b border-off-white/5 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
        <div className="px-6 py-6 flex items-center justify-between">
          <Link to="/" className="text-off-white/70 hover:text-off-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 flex justify-center">
            <Link to="/">
              <img 
                src={logo} 
                alt="ARCUS" 
                className="h-8 brightness-0 invert opacity-90 cursor-pointer hover:opacity-100 transition-opacity"
              />
            </Link>
          </div>
          <MenuButton onClick={() => setMenuOpen(true)} />
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
    </div>
  );
}