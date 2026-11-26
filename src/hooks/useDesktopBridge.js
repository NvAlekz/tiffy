import { useCallback, useEffect, useState } from 'react';

const bridge = typeof window !== 'undefined' ? window.tiffy : undefined;

const initialState = {
  ghostMode: false,
  opacity: 1,
  visible: true,
  contentProtected: false,
  ready: false,
  available: Boolean(bridge),
};

export function useDesktopBridge() {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    if (!bridge) return undefined;

    let active = true;

    bridge
      .getState()
      .then((next) => {
        if (!active || !next) return;
        setState((previous) => ({ ...previous, ...next, ready: true, available: true }));
      })
      .catch(() => {
        if (active) setState((previous) => ({ ...previous, ready: true }));
      });

    const offGhost = bridge.onGhostModeChange((ghostMode) => {
      setState((previous) => ({ ...previous, ghostMode: Boolean(ghostMode) }));
    });

    const offOpacity = bridge.onOpacityChange((opacity) => {
      setState((previous) => ({ ...previous, opacity: Number(opacity) || 1 }));
    });

    return () => {
      active = false;
      offGhost();
      offOpacity();
    };
  }, []);

  const applyState = useCallback((next) => {
    if (!next) return;
    setState((previous) => ({ ...previous, ...next, ready: true, available: Boolean(bridge) }));
  }, []);

  const toggleGhostMode = useCallback(async () => {
    if (!bridge) return;
    try {
      applyState(await bridge.toggleGhostMode());
    } catch {
      // Si IPC falla, el estado global se mantiene.
    }
  }, [applyState]);

  const cycleOpacity = useCallback(async () => {
    if (!bridge) return;
    try {
      applyState(await bridge.cycleOpacity());
    } catch {
      // Sin cambios si la ventana no está disponible.
    }
  }, [applyState]);

  const hideWindow = useCallback(async () => {
    if (!bridge) return;
    try {
      applyState(await bridge.hideWindow());
    } catch {
      // Sin cambios si la ventana no está disponible.
    }
  }, [applyState]);

  const copyText = useCallback(async (text) => {
    if (!text) return false;

    if (bridge?.copyText) {
      try {
        return Boolean(await bridge.copyText(text));
      } catch {
        return false;
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }, []);

  const quit = useCallback(() => {
    bridge?.quit();
  }, []);

  return {
    ...state,
    toggleGhostMode,
    cycleOpacity,
    hideWindow,
    copyText,
    quit,
  };
}
