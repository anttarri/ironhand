import { useRef, useState, useCallback, useEffect } from 'react';
import { INPUT_SAMPLE_RATE, OUTPUT_SAMPLE_RATE } from '@/config/constants';
import { pcmEncode, arrayBufferToBase64, base64ToArrayBuffer } from '@/services/mediaUtils';
import { haptic } from '@/services/haptics';
import { playSound } from '@/services/sounds';

interface UseAudioOptions {
  onAudioChunk: (base64Pcm: string) => void;
}

const SILENCE_THRESHOLD = 0.015;

export function useAudio({ onAudioChunk }: UseAudioOptions) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [userVolume, setUserVolume] = useState(0);
  const [aiVolume, setAiVolume] = useState(0);

  const captureCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const playbackCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const nextPlayTimeRef = useRef(0);
  const isMutedRef = useRef(false);
  const onAudioChunkRef = useRef(onAudioChunk);
  onAudioChunkRef.current = onAudioChunk;
  const wasAiSpeakingRef = useRef(false);
  const aiSpeakingTimerRef = useRef<number>(0);

  // Volume refs — written by audio callbacks, read by RAF loop
  const userVolumeRef = useRef(0);
  const aiVolumeRef = useRef(0);

  // RAF loop to sync volume refs → state at display rate
  useEffect(() => {
    let active = true;
    let raf = 0;
    const sync = () => {
      if (!active) return;
      setUserVolume(userVolumeRef.current);
      setAiVolume(aiVolumeRef.current);
      raf = requestAnimationFrame(sync);
    };
    raf = requestAnimationFrame(sync);
    return () => { active = false; cancelAnimationFrame(raf); };
  }, []);

  const startCapture = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: INPUT_SAMPLE_RATE,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    streamRef.current = stream;

    const ctx = new AudioContext({ sampleRate: INPUT_SAMPLE_RATE });
    captureCtxRef.current = ctx;

    const source = ctx.createMediaStreamSource(stream);
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e: AudioProcessingEvent) => {
      const inputData = e.inputBuffer.getChannelData(0);

      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(sum / inputData.length);
      const target = isMutedRef.current ? 0 : Math.min(1, rms * 5);
      const prev = userVolumeRef.current;
      userVolumeRef.current = prev + (target - prev) * (target > prev ? 0.4 : 0.2);

      if (isMutedRef.current) return;
      const pcmBuffer = pcmEncode(inputData);
      const base64 = arrayBufferToBase64(pcmBuffer);
      onAudioChunkRef.current(base64);
    };

    source.connect(processor);
    processor.connect(ctx.destination);
    setIsCapturing(true);
  }, []);

  const stopCapture = useCallback(() => {
    processorRef.current?.disconnect();
    processorRef.current = null;

    captureCtxRef.current?.close();
    captureCtxRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    setIsCapturing(false);
    userVolumeRef.current = 0;
  }, []);

  const ensurePlaybackCtx = useCallback(() => {
    if (!playbackCtxRef.current || playbackCtxRef.current.state === 'closed') {
      const ctx = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      playbackCtxRef.current = ctx;
      gainRef.current = gain;
      nextPlayTimeRef.current = 0;
    }
    return { ctx: playbackCtxRef.current, gain: gainRef.current! };
  }, []);

  const playAudio = useCallback(
    (base64Pcm: string) => {
      const { ctx, gain } = ensurePlaybackCtx();

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const arrayBuffer = base64ToArrayBuffer(base64Pcm);
      const int16 = new Int16Array(arrayBuffer);
      const float32 = new Float32Array(int16.length);

      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768;
      }

      let sum = 0;
      for (let i = 0; i < float32.length; i++) {
        sum += float32[i] * float32[i];
      }
      const rms = Math.sqrt(sum / float32.length);
      const aiTarget = Math.min(1, rms * 4);
      const aiPrev = aiVolumeRef.current;
      aiVolumeRef.current = aiPrev + (aiTarget - aiPrev) * (aiTarget > aiPrev ? 0.4 : 0.2);

      const audioBuffer = ctx.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE);
      audioBuffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gain);

      const now = ctx.currentTime;
      if (nextPlayTimeRef.current < now) {
        nextPlayTimeRef.current = now + 0.05;
      }

      source.start(nextPlayTimeRef.current);
      setIsAiSpeaking(true);
      wasAiSpeakingRef.current = true;

      source.onended = () => {
        if (ctx.currentTime >= nextPlayTimeRef.current - 0.1) {
          window.clearTimeout(aiSpeakingTimerRef.current);
          aiSpeakingTimerRef.current = window.setTimeout(() => {
            if (nextPlayTimeRef.current <= (playbackCtxRef.current?.currentTime ?? 0) + 0.1) {
              setIsAiSpeaking(false);
              aiVolumeRef.current = 0;
              if (wasAiSpeakingRef.current) {
                wasAiSpeakingRef.current = false;
                haptic('ai-ready');
                playSound('ai-ready');
              }
            }
          }, 250);
        }
      };

      nextPlayTimeRef.current += audioBuffer.duration;
    },
    [ensurePlaybackCtx],
  );

  const stopPlayback = useCallback(() => {
    window.clearTimeout(aiSpeakingTimerRef.current);
    if (playbackCtxRef.current && playbackCtxRef.current.state !== 'closed') {
      playbackCtxRef.current.close();
    }
    playbackCtxRef.current = null;
    gainRef.current = null;
    nextPlayTimeRef.current = 0;
    setIsAiSpeaking(false);
    aiVolumeRef.current = 0;
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      return next;
    });
  }, []);

  const cleanup = useCallback(() => {
    stopCapture();
    stopPlayback();
  }, [stopCapture, stopPlayback]);

  const isUserSpeaking = userVolume > SILENCE_THRESHOLD;

  return {
    isCapturing,
    isMuted,
    isAiSpeaking,
    isUserSpeaking,
    userVolume,
    aiVolume,
    startCapture,
    stopCapture,
    playAudio,
    stopPlayback,
    toggleMute,
    cleanup,
  };
}
