import { sanitizeProgress } from '../../../shared/progress';
import type { RunSubmission } from '../../../shared/scoring';
import { Save } from '../systems/Save';
import { api } from './api';

/**
 * Two-way sync: pull the cloud copy, merge it into local, push the merged result.
 * Both ends merge with max(), so order doesn't matter and nothing regresses.
 * Failures are swallowed: localStorage always has the latest progress.
 */
export async function syncProgress(): Promise<boolean> {
  if (!Save.session) return false;
  try {
    const cloud = await api.me();
    Save.merge(sanitizeProgress(cloud.progress));
    const merged = await api.putProgress(Save.progress);
    Save.merge(sanitizeProgress(merged.progress));
    return true;
  } catch {
    return false;
  }
}

export async function submitRun(run: RunSubmission): Promise<{ rank: number } | null> {
  if (!Save.session) return null;
  try {
    const res = await api.submitRun(run);
    return res.accepted ? { rank: res.rank } : null;
  } catch {
    return null;
  }
}
