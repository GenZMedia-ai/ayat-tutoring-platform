
// DEPRECATED: This hook has been consolidated into useTeacherMixedTrialData.ts
// This file is kept for backward compatibility but should not be used in new code
// TODO: Remove this file after confirming all imports have been updated

import { useTeacherMixedTrialData } from './useTeacherMixedTrialData';

// Re-export everything from the new consolidated hook
export * from './useTeacherMixedTrialData';

// Provide a deprecation warning for the old hook name
export const useTeacherMixedTrialSessions = () => {
  console.warn('⚠️ useTeacherMixedTrialSessions is deprecated. Use useTeacherMixedTrialData instead.');
  return useTeacherMixedTrialData();
};
