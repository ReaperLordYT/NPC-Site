import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import bgLight from '@/assets/bg-light.png';
import bgDark from '@/assets/bg-dark.png';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PageLayout: React.FC<{ children: React.ReactNode; hideFooter?: boolean }> = ({ children, hideFooter }) => {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen relative">
      <div
        className="fixed inset-0 bg-page pointer-events-none z-0"
        style={{
          backgroundImage: `url(${theme === 'dark' ? bgDark : bgLight})`,
          opacity: 0.35,
        }}
      />
      <div className="fixed inset-0 bg-background/70 pointer-events-none z-0" />
      <div className="relative z-10">
        <Header />
        <main className="pt-16">{children}</main>
        {!hideFooter && <Footer />}
      </div>
    </div>
  );
};

export default PageLayout;
