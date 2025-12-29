export default function FontSamples() {
  const fonts = [
    { name: 'Audiowide', import: 'Audiowide' },
    { name: 'Michroma', import: 'Michroma' },
    { name: 'Saira Condensed', import: 'Saira+Condensed:wght@300;400;500;600;700' },
    { name: 'Quantico', import: 'Quantico:wght@400;700' },
    { name: 'Rajdhani', import: 'Rajdhani:wght@300;400;500;600;700' },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl mb-12 text-center text-zinc-400">Font Samples for ARCUS</h1>
        
        {fonts.map((font, index) => (
          <div key={index} className="mb-16 p-8 bg-zinc-900 rounded-lg border border-zinc-800">
            <style>
              {`@import url('https://fonts.googleapis.com/css2?family=${font.import}&display=swap');`}
            </style>
            
            <div className="mb-6">
              <h2 className="text-xl text-zinc-500 mb-2">{font.name}</h2>
            </div>
            
            <div style={{ fontFamily: font.name.replace(' ', '+') }}>
              <div className="text-6xl mb-6 tracking-wider">ARCUS</div>
              <div className="text-2xl mb-4">Join the waitlist</div>
              <div className="text-lg mb-4">Enter your email</div>
              <div className="text-base text-zinc-400">
                The quick brown fox jumps over the lazy dog<br />
                ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
                abcdefghijklmnopqrstuvwxyz<br />
                0123456789
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
