import { useEffect, useMemo, useRef, useState } from 'react';

import { introCinematicScenes } from '../demo/introCinematic';

type Props = {
  onSkip: () => void;
  onComplete: () => void;
};

const TYPEWRITER_MS = 18;

export function IntroCinematicScreen({ onSkip, onComplete }: Props) {
  const [started, setStarted] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [typedCount, setTypedCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scenes = introCinematicScenes;
  const scene = scenes[sceneIndex] ?? scenes[0];
  const isFinalScene = sceneIndex >= scenes.length - 1;

  const typedText = useMemo(() => scene.text.slice(0, typedCount), [scene.text, typedCount]);

  useEffect(() => {
    if (!started) return;
    setTypedCount(0);
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = scene.narrationUrl;
      audio.play().catch(() => {
        // Narration files are optional during development; the visual opener should still run.
      });
    }
  }, [scene.narrationUrl, started]);

  useEffect(() => {
    if (!started) return undefined;
    if (typedCount >= scene.text.length) return undefined;
    const timer = window.setTimeout(() => setTypedCount((count) => count + 1), TYPEWRITER_MS);
    return () => window.clearTimeout(timer);
  }, [scene.text.length, started, typedCount]);

  useEffect(() => {
    if (!started) return undefined;
    const timer = window.setTimeout(() => {
      if (isFinalScene) {
        onComplete();
        return;
      }
      setSceneIndex((index) => index + 1);
    }, scene.durationMs);
    return () => window.clearTimeout(timer);
  }, [isFinalScene, onComplete, scene.durationMs, sceneIndex, started]);

  function handleNext() {
    if (!started) {
      setStarted(true);
      return;
    }
    if (isFinalScene) {
      onComplete();
      return;
    }
    setSceneIndex((index) => index + 1);
  }

  return (
    <section className="lh-screen lh-screen--intro-cinematic" aria-label="Legendary Horizon intro cinematic">
      <div
        className="lh-intro-cinematic__backdrop"
        aria-hidden
        style={{ backgroundImage: `linear-gradient(rgba(5, 6, 10, 0.18), rgba(5, 6, 10, 0.9)), url("${scene.imageUrl}")` }}
      />
      <div className="lh-intro-cinematic__fallback" aria-hidden />
      <div className="lh-intro-cinematic__content">
        <p className="lh-eyebrow">Leadership opener</p>
        <h1 className="lh-intro-cinematic__title">{scene.title}</h1>
        <div className="lh-intro-cinematic__dialogue" aria-live="polite">
          <p>{started ? typedText : scene.text}</p>
        </div>
        <div className="lh-intro-cinematic__meta">
          <span>
            Scene {sceneIndex + 1} of {scenes.length}
          </span>
          <span>Prepared for Corey walkthrough</span>
        </div>
        <div className="lh-stack lh-stack--horizontal lh-intro-cinematic__actions">
          <button type="button" className="lh-button lh-button--primary" onClick={handleNext}>
            {!started ? 'Start opener' : isFinalScene ? 'Continue' : 'Next scene'}
          </button>
          <button type="button" className="lh-button lh-button--secondary" onClick={onSkip}>
            Skip opener
          </button>
        </div>
      </div>
      <audio ref={audioRef} preload="auto" />
    </section>
  );
}
