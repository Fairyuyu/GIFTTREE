
import { HandData } from '../types';

export class HandTracker {
  private video: HTMLVideoElement | null = null;
  private handLandmarker: any = null;
  private isRunning = false;
  private callback: ((data: HandData) => void) | null = null;
  private lastVideoTime = -1;
  
  // Smoothing/Debouncing buffer
  private gestureHistory: string[] = [];
  private readonly HISTORY_SIZE = 4; // Snappier response

  async initialize() {
    try {
      const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0');
      const filesetResolver = await vision.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      this.handLandmarker = await vision.HandLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });

      const uiVideo = document.getElementById('hand-tracker-video') as HTMLVideoElement;
      if (uiVideo) {
        this.video = uiVideo;
      } else {
        this.video = document.createElement('video');
        this.video.style.position = 'absolute';
        this.video.style.left = '-9999px';
        document.body.appendChild(this.video);
      }

      this.video.setAttribute('autoplay', '');
      this.video.setAttribute('playsinline', '');
      this.video.muted = true;

      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      this.video.srcObject = stream;
      await new Promise((resolve) => {
        if (this.video) this.video.onloadedmetadata = resolve;
      });
      this.video.play();
    } catch (err) {
      console.error("HandTracker failed to initialize", err);
    }
  }

  start(callback: (data: HandData) => void) {
    this.callback = callback;
    this.isRunning = true;
    this.detectFrame();
  }

  stop() {
    this.isRunning = false;
    if (this.video && !this.video.id) {
      const stream = this.video.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      this.video.remove();
    }
  }

  private detectFrame = async () => {
    if (!this.isRunning || !this.video || !this.handLandmarker) return;

    if (this.video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.video.currentTime;
      const results = this.handLandmarker.detectForVideo(this.video, performance.now());
      
      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        const rawGesture = this.analyzeGesture(landmarks);
        
        this.gestureHistory.push(rawGesture);
        if (this.gestureHistory.length > this.HISTORY_SIZE) this.gestureHistory.shift();
        
        const gesture = this.getStableGesture() as HandData['gesture'];
        const x = 1 - landmarks[8].x; 
        const y = landmarks[8].y;

        this.callback?.({
          gesture,
          x,
          y,
          isDetected: true
        });
      } else {
        this.gestureHistory = [];
        this.callback?.({ gesture: 'NONE', x: 0.5, y: 0.5, isDetected: false });
      }
    }

    requestAnimationFrame(this.detectFrame);
  };

  private getStableGesture(): string {
    if (this.gestureHistory.length === 0) return 'NONE';
    const counts: Record<string, number> = {};
    this.gestureHistory.forEach(g => counts[g] = (counts[g] || 0) + 1);
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }

  private analyzeGesture(landmarks: any[]): 'FIST' | 'OPEN' | 'PINCH' | 'NONE' {
    const dist = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

    const handScale = dist(landmarks[0], landmarks[9]);
    if (handScale === 0) return 'NONE';

    const tips = [8, 12, 16, 20];
    const fingerDistances = tips.map(idx => dist(landmarks[idx], landmarks[0]));
    
    const avgTipDist = fingerDistances.reduce((a, b) => a + b, 0) / tips.length / handScale;

    // FIST: Curled in
    if (avgTipDist < 1.4) return 'FIST';

    // OPEN: Stretched out
    if (avgTipDist > 2.0) return 'OPEN';

    // PINCH
    const pinchDist = dist(landmarks[4], landmarks[8]);
    if (pinchDist < handScale * 0.4) return 'PINCH';

    return 'NONE';
  }
}
