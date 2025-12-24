
export async function sampleImage(url: string, size: number = 100): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject("No context");
      
      // Standard drawing without horizontal flip
      ctx.drawImage(img, 0, 0, size, size);
      
      const imageData = ctx.getImageData(0, 0, size, size);
      const data = new Float32Array(imageData.data.length);
      for (let i = 0; i < imageData.data.length; i++) {
        // Store raw 0-1 values.
        data[i] = imageData.data[i] / 255.0;
      }
      resolve(data);
    };
    img.onerror = reject;
    img.src = url;
  });
}
