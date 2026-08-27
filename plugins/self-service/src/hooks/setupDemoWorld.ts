import {
  POST_SETUP_RESET_EVENT,
  SETUP_EXPERIENCE_IDS,
  resetExperienceSetupForSetupLanding,
  writeAllExperienceSetup,
} from './experienceSetup';
import { writeAllBridgeExperienceVisibility } from './bridgeExperienceVisibility';
import { writeNavPlugins } from './useNavPlugins';
import { writeDevSpacesSetup } from './devSpacesSetup';
import { seedQuickstartCompleted } from './adminQuickstart';
import type { SetupDemoMode } from './setupDemoMode';

function emitDemoWorldChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(POST_SETUP_RESET_EVENT));
  }
}

function seedFirstPortalSession() {
  resetExperienceSetupForSetupLanding();
  writeDevSpacesSetup({ connected: false, url: '' });
  writeNavPlugins({ apme: true, compliance: true, rhem: false });
  writeAllBridgeExperienceVisibility({
    automate: true,
    develop: true,
    compliance: true,
    edge: true,
    orchestrator: false,
  });
}

function seedFullyConfiguredPortal() {
  const setup: Record<string, boolean> = {};
  SETUP_EXPERIENCE_IDS.forEach(id => {
    setup[id] = true;
  });
  writeAllExperienceSetup(setup);
  writeAllBridgeExperienceVisibility({
    automate: true,
    develop: true,
    compliance: true,
    edge: true,
    orchestrator: true,
  });
  writeNavPlugins({ apme: true, compliance: true, rhem: true });
  writeDevSpacesSetup({
    connected: true,
    url: 'https://devspaces.apps.example.com',
  });
  seedQuickstartCompleted();
  emitDemoWorldChanged();
}

/**
 * Seed prototype stores so the jumper beats match the story.
 * Landing only remounts the wizard (epoch) — no Portal world to seed.
 */
export function applySetupDemoWorld(mode: SetupDemoMode) {
  if (mode === 'landing') return;
  if (mode === 'setup') {
    seedFirstPortalSession();
    return;
  }
  seedFullyConfiguredPortal();
}
