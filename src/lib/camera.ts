export class CameraManager {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  async start(videoEl: HTMLVideoElement, facingMode: "user" | "environment" = "environment"): Promise<void> {
    await this.stop();

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    };

    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.videoElement = videoEl;
    videoEl.srcObject = this.stream;
    await videoEl.play();
  }

  async stop(): Promise<void> {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }

  captureFrame(quality = 0.85): { dataUrl: string; base64: string; mimeType: string } | null {
    if (!this.videoElement || !this.stream) return null;

    const canvas = document.createElement("canvas");
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(this.videoElement, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const base64 = dataUrl.split(",")[1];

    return {
      dataUrl,
      base64,
      mimeType: "image/jpeg",
    };
  }

  get isActive(): boolean {
    return !!this.stream && this.stream.getTracks().some((t) => t.readyState === "live");
  }
}
