/**
 * Engagement Simulation Module
 *
 * TO REMOVE THIS MODULE:
 * 1. Delete this folder (src/lib/simulation/)
 * 2. Delete src/app/api/simulate/route.ts
 * 3. Remove imports from:
 *    - src/app/(main)/explore/page.tsx
 *    - src/app/(main)/feed/page.tsx
 *    - src/components/feed/CreatePostForm.tsx
 * 4. Remove ENABLE_ENGAGEMENT_SIMULATION from .env.local
 */

export { simulateEngagement, simulateLightEngagement, simulateBulkEngagement, isSimulationEnabled } from './engagement';
export { useSimulation, triggerSimulationOnce } from './useSimulation';
