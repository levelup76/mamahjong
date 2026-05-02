"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type SoundSlot = "click" | "match" | "win" | "stuck";

type AudioBundle = {
  sounds: Map<SoundSlot, string>;
  music: string[]; // ordered list of music track URLs
};

type AudioControls = AudioBundle & {
  play: (slot: SoundSlot) => void;
  musicEnabled: boolean;
  setMusicEnabled: (v: boolean) => void;
  trackIndex: number;
  setTrackIndex: (i: number) => void;
  volume: number;
  setVolume: (v: number) => void;
};

const Ctx = createContext<AudioControls | null>(null);

export function useAudio(): AudioControls {
  const v = useContext(Ctx);
  if (!v) {
    // Allow components to call useAudio outside the provider — return a no-op.
    // Useful when Supabase isn't configured and we don't render the provider.
    return {
      sounds: new Map(),
      music: [],
      play: () => {},
      musicEnabled: false,
      setMusicEnabled: () => {},
      trackIndex: 0,
      setTrackIndex: () => {},
      volume: 0.5,
      setVolume: () => {},
    };
  }
  return v;
}

type Props = AudioBundle & { children: React.ReactNode };

export default function AudioProvider({ sounds, music, children }: Props) {
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.5);

  // Pre-create one Audio element per sound slot so playback is instant after
  // the first paint. Recycled by setting currentTime=0 before play().
  const sfxRef = useRef<Map<SoundSlot, HTMLAudioElement>>(new Map());
  useEffect(() => {
    const map = new Map<SoundSlot, HTMLAudioElement>();
    sounds.forEach((url, slot) => {
      const el = new Audio(url);
      el.preload = "auto";
      el.volume = volume;
      map.set(slot, el);
    });
    sfxRef.current = map;
    return () => {
      for (const el of map.values()) el.pause();
    };
  }, [sounds, volume]);

  const play = useCallback((slot: SoundSlot) => {
    const el = sfxRef.current.get(slot);
    if (!el) return;
    try {
      el.currentTime = 0;
      void el.play();
    } catch {
      /* autoplay block — ignore until user interacts */
    }
  }, []);

  // Background music — single <audio> element advanced through the playlist.
  const musicRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (!musicEnabled || music.length === 0) {
      musicRef.current?.pause();
      return;
    }
    if (!musicRef.current) musicRef.current = new Audio();
    const el = musicRef.current;
    el.src = music[trackIndex % music.length];
    el.volume = volume;
    el.loop = false;
    el.onended = () => setTrackIndex((i) => (i + 1) % music.length);
    void el.play().catch(() => {
      // autoplay blocked — user has to toggle again after interacting
      setMusicEnabled(false);
    });
    return () => {
      el.pause();
    };
  }, [musicEnabled, music, trackIndex, volume]);

  // Keep volume in sync with live elements without re-creating them.
  useEffect(() => {
    sfxRef.current.forEach((el) => (el.volume = volume));
    if (musicRef.current) musicRef.current.volume = volume;
  }, [volume]);

  const value = useMemo<AudioControls>(
    () => ({
      sounds,
      music,
      play,
      musicEnabled,
      setMusicEnabled,
      trackIndex,
      setTrackIndex,
      volume,
      setVolume,
    }),
    [sounds, music, play, musicEnabled, trackIndex, volume],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
