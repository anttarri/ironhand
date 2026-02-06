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
  const [address, setAddress] = useState("");
  const [inspectorName, setInspectorName] = useState("");
  const [panelType, setPanelType] = useState("Main Panel");
  const [serviceAmps, setServiceAmps] = useState("200A");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const hasStoredKey = useHasStoredKey();

  const hasKey = hasStoredKey || !!apiKey;

  function handleStart() {
    if (apiKey) {
      localStorage.setItem("gemini_api_key", apiKey);
    }

    const params = new URLSearchParams({
      address: address || "Not specified",
      inspector: inspectorName || "Not specified",
      panelType,
      serviceAmps,
    });

    router.push(`/inspect?${params.toString()}`);
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 pt-10 text-center">
        <div className="inline-flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Ironhand</h1>
        </div>
        <p className="text-gray-400 text-sm mt-1">
          AI-Powered Electrical Panel Inspector
        </p>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 pb-8 max-w-lg mx-auto w-full">
        {/* Info Card */}
        <div className="bg-surface rounded-xl p-4 mb-6 border border-gray-800">
          <h2 className="text-sm font-semibold text-amber-500 uppercase tracking-wide mb-2">
            How It Works
          </h2>
          <ol className="text-sm text-gray-300 space-y-2">
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold">1.</span>
              Point your camera at the electrical panel
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold">2.</span>
              AI identifies components and potential issues
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold">3.</span>
              Follow the step-by-step NEC inspection checklist
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold">4.</span>
              Generate a professional PDF report
            </li>
          </ol>
        </div>

        {/* Setup Form */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">New Inspection</h2>

          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">
              Property Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, City, State"
              className="w-full bg-surface border border-gray-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">
              Inspector Name
            </label>
            <input
              type="text"
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-surface border border-gray-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">
                Panel Type
              </label>
              <select
                value={panelType}
                onChange={(e) => setPanelType(e.target.value)}
                className="w-full bg-surface border border-gray-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option>Main Panel</option>
                <option>Sub-Panel</option>
                <option>Meter Main</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">
                Service
              </label>
              <select
                value={serviceAmps}
                onChange={(e) => setServiceAmps(e.target.value)}
                className="w-full bg-surface border border-gray-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option>100A</option>
                <option>125A</option>
                <option>150A</option>
                <option>200A</option>
                <option>320A</option>
                <option>400A</option>
              </select>
            </div>
          </div>

          {/* API Key */}
          <div className="pt-2">
            {!hasKey || showApiKeyInput ? (
              <div>
                <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  className="w-full bg-surface border border-gray-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get a key at{" "}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-500 underline"
                  >
                    Google AI Studio
                  </a>
                  . Stored locally in your browser.
                </p>
              </div>
            ) : (
              <button
                onClick={() => setShowApiKeyInput(true)}
                className="text-xs text-gray-500 underline"
              >
                Change API key
              </button>
            )}
          </div>

          {/* Start Button */}
          <button
            onClick={handleStart}
            disabled={!hasKey}
            className="w-full mt-4 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold py-3 rounded-xl text-lg transition-colors"
          >
            Start Inspection
          </button>

          {!hasKey && (
            <p className="text-xs text-center text-red-400">
              Please enter a Gemini API key to continue
            </p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-gray-600">
        Ironhand MVP &middot; For qualified electricians &amp; inspectors
      </footer>
    </div>
  );
}
