'use client';
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Navbar from './navbar.js';
import Footer from './footer.js';

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  
  
  const hideFooterRoutes = ['/annotations','/project'];
  const shouldHideFooter = hideFooterRoutes.includes(pathname);
  
  
  const noScrollRoutes = [];
  const shouldDisableScroll = noScrollRoutes.includes(pathname);
  
  
  useEffect(() => {
    if (shouldDisableScroll) {
      
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    }
    
    
    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, [shouldDisableScroll]);

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      {!shouldHideFooter && <Footer />}
    </div>
  );



}
