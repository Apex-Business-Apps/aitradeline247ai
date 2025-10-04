import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface RagSearchFabProps {
  onClick: () => void;
}

export function RagSearchFab({ onClick }: RagSearchFabProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <Button
      data-qa="rag-open"
      onClick={onClick}
      size="icon"
      className={`fixed shadow-lg z-40 h-14 w-14 rounded-full ${
        isMobile 
          ? 'bottom-4 left-4' 
          : 'right-6 top-1/2 -translate-y-1/2'
      }`}
      aria-label="Open search"
    >
      <Search className="h-6 w-6" />
    </Button>
  );
}
