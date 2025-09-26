import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function useKlaviyoPageview(){
  const { pathname, search } = useLocation();
  useEffect(()=>{ 
    (window as any).klaviyo?.track?.('Page View',{ 
      path: pathname+search, 
      ts: Date.now() 
    }); 
  }, [pathname, search]);
}