import { motion } from 'motion/react';

export default function ProductSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Image Skeleton */}
      <div className="relative aspect-[3/4] bg-off-white/5 rounded-lg overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-off-white/10 to-transparent"
          animate={{
            x: ['-100%', '100%']
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      </div>

      {/* Text Skeletons */}
      <div className="flex flex-col items-center gap-2">
        {/* Product Name */}
        <div className="h-5 w-32 bg-off-white/5 rounded overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-transparent via-off-white/10 to-transparent"
            animate={{
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        </div>

        {/* Price */}
        <div className="h-4 w-16 bg-off-white/5 rounded overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-transparent via-off-white/10 to-transparent"
            animate={{
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
              delay: 0.2
            }}
          />
        </div>
      </div>
    </div>
  );
}
