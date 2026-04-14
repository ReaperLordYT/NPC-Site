import React from 'react';
import { useLocation } from 'react-router-dom';
import bgDark from '@/assets/bg-dark.png';
import catPeekRight from '@/assets/cat-peek-right.png';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PageLayout: React.FC<{ children: React.ReactNode; hideFooter?: boolean }> = ({ children, hideFooter }) => {
  const [showCat, setShowCat] = React.useState(false);
  const location = useLocation();
  const catRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onShow = () => {
      setShowCat(true);
      window.setTimeout(() => setShowCat(false), 7000);
    };
    window.addEventListener('npc-cat-peek-show', onShow);
    return () => window.removeEventListener('npc-cat-peek-show', onShow);
  }, []);

  React.useEffect(() => {
    setShowCat(false);
  }, [location.pathname]);

  React.useEffect(() => {
    if (!showCat) return;
    const onMove = (event: MouseEvent) => {
      if (!catRef.current) return;
      const rect = catRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);
      if (distance < 150) {
        setShowCat(false);
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [showCat]);

  return (
    <div className="min-h-screen relative">
      <div
        className="fixed inset-0 bg-page pointer-events-none z-0"
        style={{
          backgroundImage: `url(${bgDark})`,
          opacity: 0.35,
        }}
      />
      <div className="fixed inset-0 bg-background/70 pointer-events-none z-0" />
      <div
        ref={catRef}
        className={`fixed left-0 bottom-8 z-[120] pointer-events-none select-none hidden md:block transition-transform duration-500 ${
          showCat ? 'translate-x-0' : '-translate-x-[120%]'
        }`}
      >
        <img
          src={catPeekRight}
          alt=""
          aria-hidden="true"
          className={`w-[170px] lg:w-[210px] opacity-90 -scale-x-100 -translate-x-[38%] ${showCat ? 'animate-cat-peek' : ''}`}
        />
      </div>
      <div className="relative z-10">
        <Header />
        <main className="pt-16">{children}</main>
        {!hideFooter && <Footer />}
      </div>
    </div>
  );
};

export default PageLayout;
