
import React, { useRef } from 'react';
import { Settings, X, Upload, Trash2, Sparkles } from 'lucide-react';
import { AppConfig, ImageData, ParticleMode } from '../types';
import { sampleImage } from '../services/imageSampler';

interface OverlayProps {
  config: AppConfig;
  setConfig: (c: AppConfig) => void;
  images: ImageData[];
  setImages: React.Dispatch<React.SetStateAction<ImageData[]>>;
  selectedImageIndex: number;
  setSelectedImageIndex: (i: number) => void;
  particleMode: ParticleMode;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
}

const Overlay: React.FC<OverlayProps> = ({ 
  config, setConfig, images, setImages, 
  selectedImageIndex, setSelectedImageIndex, 
  particleMode, isSettingsOpen, setIsSettingsOpen 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file);
      try {
        const pixels = await sampleImage(url);
        setImages(prev => [...prev, { id: Math.random().toString(), url, pixels }]);
      } catch (err) { console.error("Image error", err); }
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-[150]">
      <button 
        className="absolute top-8 right-8 pointer-events-auto bg-white/5 hover:bg-white/10 p-4 rounded-full border border-white/10 transition-all active:scale-90 shadow-2xl backdrop-blur-xl group" 
        onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(!isSettingsOpen); }}
      >
        <Settings className={`text-white w-6 h-6 transition-transform duration-1000 ease-out group-hover:rotate-90 ${isSettingsOpen ? 'rotate-180' : ''}`} />
      </button>

      {isSettingsOpen && (
        <div 
          className="absolute top-24 right-8 w-80 max-h-[85vh] overflow-y-auto pointer-events-auto bg-[#05050a]/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-7 text-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] scrollbar-hide animate-in fade-in slide-in-from-top-4 duration-500"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-bold font-magic bg-gradient-to-br from-amber-200 via-white to-amber-100 bg-clip-text text-transparent">Magic Console</h2>
            <button 
              onClick={() => setIsSettingsOpen(false)} 
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-red-400"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-10">
            <section className="space-y-5">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 flex items-center gap-2"><Sparkles size={12}/> Visual Fidelity</h3>
              <Slider label="Bloom Glow" value={config.bloomIntensity} min={0} max={4} step={0.1} onChange={v => setConfig({...config, bloomIntensity: v})} />
              <Slider label="Dust Size" value={config.particleSize} min={0.01} max={0.2} step={0.01} onChange={v => setConfig({...config, particleSize: v})} />
            </section>

            <section className="space-y-5">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4">Architecture</h3>
              <Slider label="Rotation" value={config.rotationSpeed} min={0} max={2} step={0.1} onChange={v => setConfig({...config, rotationSpeed: v})} />
              <Slider label="Scale" value={config.treeHeight} min={1} max={10} step={0.01} onChange={v => setConfig({...config, treeHeight: v})} />
              <div className="flex flex-col gap-2.5">
                <label className="text-[11px] text-white/50 font-medium uppercase tracking-wider">Leaf Pigment</label>
                <div className="flex items-center gap-3">
                    <input type="color" value={config.particleColor} onChange={e => setConfig({...config, particleColor: e.target.value})} className="w-full h-12 rounded-xl bg-white/5 border border-white/10 cursor-pointer overflow-hidden p-0" />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-5">Memory Gallery</h3>
              <div className="grid grid-cols-3 gap-3.5">
                {images.map((img, idx) => (
                  <div key={img.id} className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-300 ${selectedImageIndex === idx ? 'border-amber-400 scale-105 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'}`} onClick={() => setSelectedImageIndex(idx)}>
                    <img src={img.url} className="w-full h-full object-cover" />
                    <button onClick={(e) => { e.stopPropagation(); setImages(prev => prev.filter(i => i.id !== img.id)); }} className="absolute top-1 right-1 bg-red-600/80 p-1 rounded-lg opacity-0 hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                  </div>
                ))}
                <button onClick={() => fileInputRef.current?.click()} className="aspect-square bg-white/5 border border-dashed border-white/20 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors group">
                  <Upload size={20} className="text-white/20 group-hover:text-white/50" />
                </button>
              </div>
              <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

const Slider = ({ label, value, min, max, step, onChange }: { label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[10px] font-bold text-white/30 tracking-widest uppercase">
      <span>{label}</span>
      <span className="text-amber-200/80">{value.toFixed(2)}</span>
    </div>
    <div className="relative flex items-center group">
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value} 
        onChange={e => onChange(parseFloat(e.target.value))} 
        className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-amber-500 pointer-events-auto transition-all group-hover:bg-white/10" 
      />
    </div>
  </div>
);

export default Overlay;
