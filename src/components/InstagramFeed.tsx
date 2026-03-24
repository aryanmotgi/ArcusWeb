import { useEffect, useRef } from 'react';

interface InstagramFeedProps {
  widgetId: string;
}

export default function InstagramFeed({ widgetId }: InstagramFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Remove any existing Elfsight scripts first
    if (!scriptLoaded.current) {
      const script = document.createElement('script');
      script.src = 'https://static.elfsight.com/platform/platform.js';
      script.async = true;
      document.head.appendChild(script);
      scriptLoaded.current = true;

      script.onload = () => {
        // Force re-scan for widgets after script loads
        if ((window as any).eapps && (window as any).eapps.initWidgets) {
          (window as any).eapps.initWidgets();
        }
      };
    } else {
      // Script already loaded, just reinitialize
      if ((window as any).eapps && (window as any).eapps.initWidgets) {
        (window as any).eapps.initWidgets();
      }
    }
  }, [widgetId]);

  return (
    <div className="w-full min-h-[400px]" ref={containerRef}>
      <div 
        className={`elfsight-app-${widgetId}`}
        data-elfsight-app-lazy
      />
    </div>
  );
}
