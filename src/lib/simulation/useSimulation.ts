/**
 * Simulation Hook for Frontend
 *
 * This hook triggers engagement simulation on certain events.
 * TO REMOVE: Delete this file and remove usage from components.
 */

'use client';

import { useCallback, useRef } from 'react';

const SIMULATION_COOLDOWN_MS = 5000; // 5 seconds between simulations (for testing)

/**
 * Hook to trigger engagement simulation
 * Includes cooldown to prevent spamming
 */
export function useSimulation() {
  const lastSimulationRef = useRef<number>(0);

  const triggerSimulation = useCallback(async (mode: 'light' | 'full' = 'light') => {
    const now = Date.now();

    // Check cooldown
    if (now - lastSimulationRef.current < SIMULATION_COOLDOWN_MS) {
      return { skipped: true, reason: 'cooldown' };
    }

    lastSimulationRef.current = now;

    try {
      const response = await fetch(`/api/simulate?mode=${mode}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Simulation request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('[Simulation] Error:', error);
      return { error: true };
    }
  }, []);

  return { triggerSimulation };
}

/**
 * Trigger simulation without hook (for use in non-component code)
 */
let lastGlobalSimulation = 0;

export async function triggerSimulationOnce(mode: 'light' | 'full' = 'light') {
  const now = Date.now();

  if (now - lastGlobalSimulation < SIMULATION_COOLDOWN_MS) {
    return { skipped: true, reason: 'cooldown' };
  }

  lastGlobalSimulation = now;

  try {
    const response = await fetch(`/api/simulate?mode=${mode}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Simulation request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('[Simulation] Error:', error);
    return { error: true };
  }
}
