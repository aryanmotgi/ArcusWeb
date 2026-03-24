import { useEffect } from 'react';
import { motion } from 'motion/react';

interface TikTokVideo {
  id: string;
  url: string;
}

interface TikTokFeedProps {
  videos: TikTokVideo[];
}

export default function TikTokFeed({ videos }: TikTokFeedProps) {
  useEffect(() => {
    // Load TikTok embed script
    const existingScript = document.querySelector('script[src*="tiktok.com/embed"]');
    
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    } else {
      // If script exists, re-trigger embed processing
      if ((window as any).tiktokEmbed) {
        (window as any).tiktokEmbed.lib.render();
      }
    }

    return () => {
      // Cleanup not strictly needed
    };
  }, [videos]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {videos.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="flex justify-center"
          >
            <blockquote
              className="tiktok-embed"
              cite={video.url}
              data-video-id={video.id}
              style={{ 
                maxWidth: '325px', 
                minWidth: '280px',
              }}
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
          </motion.div>
        ))}
      </div>
    </div>
  );
}
