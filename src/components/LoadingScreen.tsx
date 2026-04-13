import React from 'react';

const LoadingScreen: React.FC = () => (
  <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">
    <div className="relative mb-6">
      {/* Animated sword icon */}
      <div className="text-6xl animate-pulse select-none">⚔</div>
      <div className="absolute -inset-4 rounded-full border border-primary/20 animate-ping" />
    </div>
    <div className="font-display text-2xl font-black tracking-widest text-foreground mb-2">
      NPC CHAMPIONSHIP
    </div>
    <div className="flex gap-1 mt-4">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-primary"
          style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }}
        />
      ))}
    </div>
    <style>{`
      @keyframes bounce {
        0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
        40% { transform: translateY(-8px); opacity: 1; }
      }
    `}</style>
  </div>
);

export default LoadingScreen;
