import type { CapturedPhoto } from '@/types';

let capturedPhotoCounter = 0;

function nextCapturedPhotoId(): string {
  capturedPhotoCounter += 1;
  return `captured-photo-${capturedPhotoCounter}`;
}

function stripDataUrlPrefix(dataUrl: string): string {
  return dataUrl.split(',')[1] ?? '';
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Unable to read uploaded photo.'));
    };
    reader.onerror = () => {
      reject(new Error('Unable to read uploaded photo.'));
    };
    reader.readAsDataURL(file);
  });
}

function normalizeImageDataUrlToJpeg(dataUrl: string): Promise<string> {
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
    return Promise.resolve(stripDataUrlPrefix(dataUrl));
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Unable to process uploaded photo.'));
        return;
      }

      ctx.drawImage(image, 0, 0);
      resolve(stripDataUrlPrefix(canvas.toDataURL('image/jpeg', 0.85)));
    };
    image.onerror = () => {
      reject(new Error('Unable to process uploaded photo.'));
    };
    image.src = dataUrl;
  });
}

export function createCapturedPhoto(
  base64: string,
  source: CapturedPhoto['source'],
): CapturedPhoto {
  return {
    id: nextCapturedPhotoId(),
    base64,
    createdAt: Date.now(),
    source,
  };
}

export async function loadCapturedPhotosFromFiles(files: File[]): Promise<CapturedPhoto[]> {
  const photos = await Promise.all(files.map(async (file) => {
    const dataUrl = await readFileAsDataUrl(file);
    const base64 = await normalizeImageDataUrlToJpeg(dataUrl);
    return createCapturedPhoto(base64, 'upload');
  }));

  return photos;
}
