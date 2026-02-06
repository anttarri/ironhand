/* eslint-disable @typescript-eslint/no-explicit-any */

export class SpeechManager {
  private synthesis: SpeechSynthesis | null = null;
  private recognition: any = null;
  private isListening = false;
  private onResultCallback: ((text: string) => void) | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.synthesis = window.speechSynthesis;
    }
  }

  speak(text: string, onEnd?: () => void) {
    if (!this.synthesis) return;

    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = this.synthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith("en") && v.name.includes("Google")
    ) ?? voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;

    if (onEnd) utterance.onend = onEnd;

    this.synthesis.speak(utterance);
  }

  stop() {
    this.synthesis?.cancel();
  }

  get isSpeaking(): boolean {
    return this.synthesis?.speaking ?? false;
  }

  startListening(onResult: (text: string) => void): boolean {
    if (typeof window === "undefined") return false;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return false;

    this.onResultCallback = onResult;
    this.recognition = new SpeechRecognitionClass();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = "en-US";

    this.recognition.onresult = (event: any) => {
      const text = event.results?.[0]?.[0]?.transcript;
      if (text && this.onResultCallback) {
        this.onResultCallback(text);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    this.recognition.onerror = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch {
      return false;
    }
  }

  stopListening() {
    this.recognition?.stop();
    this.isListening = false;
  }

  get listening(): boolean {
    return this.isListening;
  }
}
