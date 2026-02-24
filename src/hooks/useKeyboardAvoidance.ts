import { useState, useEffect } from 'react';

interface KeyboardAvoidanceState {
  keyboardOpen: boolean;
  keyboardHeight: number;
}

/**
 * Detects the software keyboard open/close state using the `visualViewport`
 * API.  Falls back gracefully when `visualViewport` is not available (e.g.
 * desktop browsers, older mobile browsers).
 *
 * Returns `{ keyboardOpen, keyboardHeight }` where `keyboardHeight` is the
 * approximate pixel height consumed by the keyboard.
 */
export function useKeyboardAvoidance(): KeyboardAvoidanceState {
  const [state, setState] = useState<KeyboardAvoidanceState>({
    keyboardOpen: false,
    keyboardHeight: 0,
  });

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return; // API not available — nothing to do

    function update() {
      const vv = window.visualViewport;
      if (!vv) return;

      const keyboardHeight = Math.max(0, window.innerHeight - vv.height);
      // A small threshold avoids false positives from browser chrome changes
      const keyboardOpen = keyboardHeight > 50;

      setState((prev) => {
        if (prev.keyboardOpen === keyboardOpen && prev.keyboardHeight === keyboardHeight) {
          return prev; // no change — skip re-render
        }
        return { keyboardOpen, keyboardHeight };
      });
    }

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);

    // Run once on mount
    update();

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return state;
}
