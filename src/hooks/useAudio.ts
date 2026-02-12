import { useRef, useState, useCallback } from 'react';
import { INPUT_SAMPLE_RATE, OUTPUT_SAMPLE_RATE } from '@/config/constants';
import { pcmEncode, arrayBufferToBase64, base64ToArrayBuffer } from '@/services/mediaUtils';

interface UseAudioOptions {
  onAudioChunk: (base64Pcm: string) => void;
}

export function useAudio({ onAudioChunk }: UseAudioOptions) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  const captureCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const playbackCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const nextPlayTimeRef = useRef(0);
  const isMutedRef = useRef(false);
  const onAudioChunkRef = useRef(onAudioChunk);
  onAudioChunkRef.current = onAudioChunk;

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
      if (isMutedRef.current) return;
      const inputData = e.inputBuffer.getChannelData(0);
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

      source.onended = () => {
        // Check if this was the last queued chunk
        if (ctx.currentTime >= nextPlayTimeRef.current - 0.1) {
          setIsAiSpeaking(false);
        }
      };

      nextPlayTimeRef.current += audioBuffer.duration;
    },
    [ensurePlaybackCtx],
  );

  const stopPlayback = useCallback(() => {
    if (playbackCtxRef.current && playbackCtxRef.current.state !== 'closed') {
      playbackCtxRef.current.close();
    }
    playbackCtxRef.current = null;
    gainRef.current = null;
    nextPlayTimeRef.current = 0;
    setIsAiSpeaking(false);
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

  return {
    isCapturing,
    isMuted,
    isAiSpeaking,
    startCapture,
    stopCapture,
    playAudio,
    stopPlayback,
    toggleMute,
    cleanup,
  };
}
