"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

function useHasStoredKey() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("storage", cb);
      return () => window.removeEventListener("storage", cb);
    },
    () => !!localStorage.getItem("gemini_api_key"),
    () => false
  );
}

export default function HomePage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const hasStoredKey = useHasStoredKey();
  const hasKey = hasStoredKey || !!apiKey;

  function handleStart() {
    if (apiKey) {
      localStorage.setItem("gemini_api_key", apiKey);
    }
    router.push("/inspect");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center">
              <svg className="w-7 h-7 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Ironhand</h1>
          </div>
          <p className="text-gray-400 text-sm">
            AI-Powered Electrical Panel Inspector
          </p>
        </div>

        {/* API Key */}
        <div className="space-y-3">
          {!hasStoredKey ? (
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">
                Google Gemini API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && hasKey && handleStart()}
                placeholder="Enter your API key"
                className="w-full bg-surface border border-gray-700 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Get a free key at{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-500 underline"
                >
                  Google AI Studio
                </a>
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center">
              API key saved.{" "}
              <button
                onClick={() => {
                  localStorage.removeItem("gemini_api_key");
                  window.dispatchEvent(new Event("storage"));
                }}
                className="text-amber-500 underline"
              >
                Change
              </button>
            </p>
          )}
        </div>

        {/* Start */}
        <button
          onClick={handleStart}
          disabled={!hasKey}
          className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold py-3.5 rounded-xl text-lg transition-colors"
        >
          Start Inspection
        </button>
      </div>
    </div>
  );
}
