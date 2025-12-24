
import React, { useState, useCallback } from 'react';
import { AppState, ParticleMode, AppConfig, ImageData } from './types';
import Splash from './components/Splash';
import Experience from './components/Experience';
import Overlay from './components/Overlay';
import MiniPreview from './components/MiniPreview';

const INITIAL_CONFIG: AppConfig = {
  particleColor: '#1b4d2a',
  rotationSpeed: 0.6,
  lightIntensity: 2.0,
  particleCount: 30000, 
  treeHeight: 4.20,
  treeWidth: 4,
  particleSize: 0.07, 
  bloomIntensity: 1.5,
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SPLASH);
  const [particleMode, setParticleMode] = useState<ParticleMode>(ParticleMode.TREE);
  const [config, setConfig] = useState<AppConfig>(INITIAL_CONFIG);
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 点击五角星：如果在主界面，则返回开场页
  const handleStarClick = useCallback(() => {
    if (appState === AppState.MAIN) {
      setAppState(AppState.SPLASH);
      setParticleMode(ParticleMode.TREE);
    }
  }, [appState]);

  const returnToTree = useCallback(() => {
    setParticleMode(ParticleMode.TREE);
  }, []);

  const handleStart = useCallback(() => {
    setAppState(AppState.MAIN);
    setIsSettingsOpen(false);
  }, []);

  const hasImages = images.length > 0;
  
  // Decide if the 3D content should be visible
  // Only hide it if we are on SPLASH and NOT in the settings panel
  const isContentVisible = appState === AppState.MAIN || isSettingsOpen;

  return (
    <div className="relative w-full h-screen bg-[#000103] overflow-hidden">
      {/* 背景 3D 场景 */}
      <Experience 
        config={config} 
        particleMode={particleMode} 
        setParticleMode={setParticleMode}
        selectedImage={images[selectedImageIndex]}
        onStarClick={handleStarClick}
        onSceneClick={returnToTree}
        isBlurred={appState === AppState.SPLASH && !isSettingsOpen}
        isContentVisible={isContentVisible}
      />

      {appState === AppState.SPLASH && (
        <div className="absolute inset-0 z-50">
          {/* 设置打开时隐藏信封 */}
          {!isSettingsOpen && <Splash onStart={handleStart} />}
          
          <Overlay 
            config={config} 
            setConfig={setConfig} 
            images={images} 
            setImages={setImages}
            selectedImageIndex={selectedImageIndex}
            setSelectedImageIndex={setSelectedImageIndex}
            particleMode={particleMode}
            isSettingsOpen={isSettingsOpen}
            setIsSettingsOpen={setIsSettingsOpen}
          />

          {/* 左侧实时预览小窗 */}
          {isSettingsOpen && (
            <div className="absolute left-10 top-1/2 -translate-y-1/2 w-[320px] h-[450px] pointer-events-none animate-in fade-in slide-in-from-left-10 duration-700">
               <div className="w-full h-full bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl relative">
                  <div className="absolute top-4 left-6 text-white/40 text-[10px] uppercase tracking-widest font-bold z-10">Live Design Preview</div>
                  <MiniPreview config={config} />
               </div>
            </div>
          )}
        </div>
      )}

      {/* 仅在主场景显示文字 */}
      {appState === AppState.MAIN && particleMode === ParticleMode.IMAGE && (
        <div 
          className={`absolute inset-0 flex flex-col items-center pointer-events-none z-40 select-none animate-in fade-in duration-1000 ${
            hasImages ? 'justify-end pb-24' : 'justify-center'
          }`}
        >
          <h1 className="text-[#D42426] font-brush text-[15vw] leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">
            Merry Christmas
          </h1>
        </div>
      )}
    </div>
  );
};

export default App;
