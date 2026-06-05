import { useCallback, useEffect, useRef, useState } from 'react';

/** Character-by-character text reveal. Resets when `text` changes. */
export function useTypewriter(text: string, speedMs = 22) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexRef = useRef(0);
  const textRef = useRef(text);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    textRef.current = text;
    indexRef.current = 0;
    setDisplayed('');
    setDone(false);
    clearTimer();

    const tick = () => {
      const idx = indexRef.current;
      const t = textRef.current;
      if (idx >= t.length) {
        setDone(true);
        return;
      }
      indexRef.current = idx + 1;
      setDisplayed(t.slice(0, idx + 1));
      timerRef.current = setTimeout(tick, speedMs);
    };

    timerRef.current = setTimeout(tick, speedMs);
    return clearTimer;
  }, [text, speedMs]);

  const skipToEnd = useCallback(() => {
    clearTimer();
    setDisplayed(textRef.current);
    setDone(true);
    indexRef.current = textRef.current.length;
  }, []);

  return { displayed, done, skipToEnd };
}
