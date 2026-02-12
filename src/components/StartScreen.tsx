import { useState, useEffect } from 'react';

const API_KEY_STORAGE_KEY = 'ironhand_gemini_api_key';

interface StartScreenProps {
  onStart: (apiKey: string) => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (saved) setApiKey(saved);
  }, []);

  const handleStart = () => {
    const key = apiKey.trim();
    if (!key) return;
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
    onStart(key);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 bg-charcoal">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <img
          src="/ironhand-logo.svg"
          alt="Ironhand"
          className="w-20 h-20 mb-4"
        />
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Ironhand
        </h1>
        <p className="text-white/50 text-sm mt-1">Your AI Electrician</p>
      </div>

      {/* API Key input */}
      <div className="w-full max-w-sm space-y-4">
        <div>
          <label
            htmlFor="api-key"
            className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider"
          >
            Gemini API Key
          </label>
          <div className="relative">
            <input
              id="api-key"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              placeholder="Enter your API key..."
              className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-colors text-sm"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-xs"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-1.5 text-xs text-electric-blue/70 hover:text-electric-blue"
          >
            Get a key from Google AI Studio
          </a>
        </div>

        <button
          onClick={handleStart}
          disabled={!apiKey.trim()}
          className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-30 disabled:cursor-not-allowed text-charcoal font-semibold rounded-xl py-4 text-base transition-colors active:scale-[0.98]"
        >
          Start Session
        </button>

        <p className="text-white/20 text-xs text-center leading-relaxed">
          Ironhand uses your camera and microphone to provide real-time
          electrical guidance. Your API key is stored locally on this device.
        </p>
      </div>
    </div>
  );
}
