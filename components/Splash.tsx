
import React, { useState } from 'react';

interface SplashProps {
  onStart: () => void;
}

const Splash: React.FC<SplashProps> = ({ onStart }) => {
  const [opening, setOpening] = useState(false);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpening(true);
    setTimeout(onStart, 1000);
  };

  return (
    <div className={`absolute inset-0 z-[100] flex items-center justify-center transition-opacity duration-1000 ${opening ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}>
      {/* Darkened solid background for the splash screen */}
      <div className="absolute inset-0 bg-black pointer-events-none" />
      
      <div 
        className={`relative group w-80 h-52 flex flex-col items-center justify-center cursor-pointer transition-all duration-1000 transform ease-in-out ${opening ? 'scale-150 rotate-6 -translate-y-32 opacity-0' : 'hover:scale-105 active:scale-95'}`} 
        onClick={handleOpen}
      >
        {/* Ivory White Envelope */}
        <div className="absolute inset-0 bg-[#F9F9F0] rounded-sm shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] border border-[#E8E8D5]" />
        
        {/* Thin Gold Border */}
        <div className="absolute inset-4 border border-[#C5A059]/30 rounded-sm pointer-events-none" />

        {/* Wax Seal */}
        <div className="relative z-30 w-14 h-14 bg-[#7D0000] rounded-full shadow-[0_8px_16px_rgba(0,0,0,0.5)] flex items-center justify-center transition-transform hover:rotate-12">
          <div className="text-2xl select-none drop-shadow-lg filter saturate-150">🍎</div>
        </div>

        {/* Content */}
        <div className="mt-8 flex flex-col items-center z-40">
          <h2 className="text-[#333] font-magic text-2xl tracking-widest select-none opacity-80">A Magical Gift</h2>
          <div className="w-12 h-[1px] bg-[#C5A059]/40 mt-3" />
        </div>
      </div>
    </div>
  );
};

export default Splash;
