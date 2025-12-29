import { motion } from 'motion/react';
import { Instagram, ExternalLink } from 'lucide-react';

// Mock Instagram posts - replace with actual API integration later
const mockPosts = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&auto=format&fit=crop',
    link: 'https://www.instagram.com/arcuswear/',
    likes: 245
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop',
    link: 'https://www.instagram.com/arcuswear/',
    likes: 312
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop',
    link: 'https://www.instagram.com/arcuswear/',
    likes: 189
  },
  {
    id: '4',
    imageUrl: 'https://images.unsplash.com/photo-1622445275576-721325763afe?w=800&auto=format&fit=crop',
    link: 'https://www.instagram.com/arcuswear/',
    likes: 278
  },
  {
    id: '5',
    imageUrl: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=800&auto=format&fit=crop',
    link: 'https://www.instagram.com/arcuswear/',
    likes: 421
  },
  {
    id: '6',
    imageUrl: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop',
    link: 'https://www.instagram.com/arcuswear/',
    likes: 356
  }
];

export default function InstagramFeed() {
  return (
    <div className="w-full bg-black py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-off-white text-4xl md:text-5xl font-bold uppercase tracking-widest mb-6">
            Follow the Journey
          </h2>
          <p className="text-off-white/60 text-lg tracking-wide mb-8">
            Join our community on Instagram @arcuswear
          </p>

          {/* Instagram CTA Button */}
          <motion.a
            href="https://www.instagram.com/arcuswear/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-off-white/10 to-off-white/5 border-2 border-off-white/30 rounded-xl text-off-white uppercase tracking-widest font-semibold"
            whileHover={{
              scale: 1.05,
              borderColor: 'rgba(245, 245, 240, 0.6)',
              boxShadow: '0 8px 32px rgba(245, 245, 240, 0.2)',
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            <Instagram className="w-5 h-5" />
            <span>Follow Us</span>
            <ExternalLink className="w-4 h-4" />
          </motion.a>
        </motion.div>

        {/* Instagram Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {mockPosts.map((post, index) => (
            <motion.a
              key={post.id}
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-2xl border-2 border-off-white/10 bg-gradient-to-br from-off-white/[0.02] to-off-white/[0.01]"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: [0.22, 1, 0.36, 1]
              }}
              whileHover={{
                scale: 1.03,
                borderColor: 'rgba(245, 245, 240, 0.3)',
                transition: { duration: 0.3 }
              }}
            >
              {/* Image */}
              <img
                src={post.imageUrl}
                alt={`Instagram post ${post.id}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />

              {/* Hover Overlay */}
              <motion.div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
              >
                <div className="flex flex-col items-center gap-3">
                  <Instagram className="w-12 h-12 text-off-white" strokeWidth={1.5} />
                  <div className="flex items-center gap-2 text-off-white">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span className="text-lg font-semibold">{post.likes}</span>
                  </div>
                  <motion.div
                    className="flex items-center gap-2 text-off-white/80 text-sm uppercase tracking-wider"
                    initial={{ y: 10, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <span>View on Instagram</span>
                    <ExternalLink className="w-4 h-4" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Gradient Border Glow Effect */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at center, rgba(245, 245, 240, 0.1) 0%, transparent 70%)'
                }}
              />
            </motion.a>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p className="text-off-white/50 text-sm uppercase tracking-widest">
            Tag us in your photos for a chance to be featured
          </p>
        </motion.div>
      </div>
    </div>
  );
}
