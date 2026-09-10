/**
 * APME usability study lock — this branch only
 * (`design/portal-apme-usability-studies-2`).
 *
 * Do not copy into the experiences-shell Plugin Factory prototype.
 */
import {
  applySetupDemoWorld,
  writeNavExperience,
  writeNavPlugins,
  writeSetupDemoMode,
} from '@ansible/plugin-backstage-self-service';

export const STUDY_DISPLAY_NAME = 'Ansible Automation Portal Prototype - APME V2';
export const STUDY_LANDING = '/self-service/home';
export const STUDY_PASSWORD = 'fish-dawn';

export function lockStudyWorld() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('portal-user-role', 'developer');
    localStorage.setItem('portal-nav-seat', 'developer');
    writeSetupDemoMode('post-setup');
    applySetupDemoWorld('post-setup');
    writeNavPlugins({ apme: true, compliance: false, rhem: false });
    writeNavExperience('develop');
  } catch {
    /* ignore */
  }
}
