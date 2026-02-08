"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CameraManager } from "@/lib/camera";
import { GeminiClient } from "@/lib/gemini";
import { SpeechManager } from "@/lib/speech";

interface Message {
  role: "user" | "ai" | "system";
  text: string;
  imageUrl?: string;
}

export default function InspectPage() {
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraRef = useRef<CameraManager | null>(null);
  const geminiRef = useRef<GeminiClient | null>(null);
  const speechRef = useRef<SpeechManager | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize
  useEffect(() => {
    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) {
      router.push("/");
      return;
    }
    geminiRef.current = new GeminiClient(apiKey);
    speechRef.current = new SpeechManager();

    return () => {
      cameraRef.current?.stop();
      speechRef.current?.stop();
    };
  }, [router]);

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      cameraRef.current = new CameraManager();
      await cameraRef.current.start(videoRef.current);
      setCameraActive(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not access camera");
    }
  }, []);

  const captureAndAnalyze = useCallback(async () => {
    if (!cameraRef.current || !geminiRef.current || analyzing) return;

    const frame = cameraRef.current.captureFrame();
    if (!frame) return;

    setAnalyzing(true);
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text: "Captured image", imageUrl: frame.dataUrl }]);

    try {
      const response = await geminiRef.current.sendImage(frame.base64, frame.mimeType);
      setMessages((prev) => [...prev, { role: "ai", text: response }]);

      if (voiceEnabled && speechRef.current) {
        speechRef.current.speak(response);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      setError(msg);
      setMessages((prev) => [...prev, { role: "system", text: msg }]);
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing, voiceEnabled]);

  const sendChat = useCallback(async () => {
    if (!chatInput.trim() || !geminiRef.current) return;

    const text = chatInput.trim();
    setChatInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);

    try {
      const response = await geminiRef.current.chat(text);
      setMessages((prev) => [...prev, { role: "ai", text: response }]);

      if (voiceEnabled && speechRef.current) {
        speechRef.current.speak(response);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      setMessages((prev) => [...prev, { role: "system", text: msg }]);
    }
  }, [chatInput, voiceEnabled]);

  const toggleVoice = useCallback(() => {
    if (speechRef.current?.isSpeaking) {
      speechRef.current.stop();
    }
    setVoiceEnabled((v) => !v);
  }, []);

  const startVoiceInput = useCallback(() => {
    if (!speechRef.current) return;
    speechRef.current.startListening((text) => {
      setChatInput(text);
    });
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a]">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-3 py-2 bg-[#111] border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/")} className="text-gray-400 p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-6 h-6 rounded bg-amber-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-sm font-semibold">Ironhand</span>
        </div>
        <button
          onClick={toggleVoice}
          className={`p-1.5 rounded ${voiceEnabled ? "text-amber-500" : "text-gray-500"}`}
          title={voiceEnabled ? "Mute voice" : "Enable voice"}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {voiceEnabled ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.531v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            )}
          </svg>
        </button>
      </header>

      {/* Camera */}
      <div className="relative bg-black shrink-0" style={{ height: "40%" }}>
        <video ref={videoRef} className="camera-video" playsInline muted autoPlay />

        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111]">
            <svg className="w-14 h-14 text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
            <button onClick={startCamera} className="bg-amber-500 text-black font-semibold px-6 py-2.5 rounded-lg">
              Start Camera
            </button>
          </div>
        )}

        {analyzing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Capture button */}
        {cameraActive && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <button
              onClick={captureAndAnalyze}
              disabled={analyzing}
              className="w-14 h-14 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 rounded-full flex items-center justify-center shadow-lg transition-colors border-2 border-white/30"
            >
              <div className="w-10 h-10 bg-amber-500 rounded-full border-2 border-black/20" />
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/50 px-3 py-1.5 text-xs text-red-300 flex justify-between items-center shrink-0">
          <span className="truncate">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 ml-2 shrink-0">X</button>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-gray-500 text-center mt-8">
            Point your camera at the panel and tap the capture button.
            The AI will inspect what it sees.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={
              msg.role === "user"
                ? "ml-12"
                : msg.role === "system"
                  ? ""
                  : "mr-4"
            }
          >
            {msg.role === "system" ? (
              <p className="text-xs text-red-400 text-center italic">{msg.text}</p>
            ) : (
              <div
                className={`rounded-xl px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-amber-500/15 text-amber-100"
                    : "bg-[#1a1a2e] text-gray-200"
                }`}
              >
                {msg.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={msg.imageUrl}
                    alt="Captured"
                    className="w-full max-h-24 object-cover rounded-lg mb-2"
                  />
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-3 py-2 bg-[#111] border-t border-gray-800 flex gap-2">
        <button
          onClick={startVoiceInput}
          className="shrink-0 p-2.5 text-gray-500 hover:text-amber-500 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
        </button>
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendChat()}
          placeholder="Ask a follow-up question..."
          className="flex-1 bg-[#1a1a2e] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
        />
        <button
          onClick={sendChat}
          disabled={!chatInput.trim()}
          className="shrink-0 bg-amber-500 disabled:bg-gray-700 text-black px-4 py-2 rounded-lg text-sm font-medium"
        >
          Send
        </button>
      </div>
    </div>
  );
}
