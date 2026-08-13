import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import type { GlobalHeaderComponentMountPoint } from '@red-hat-developer-hub/backstage-plugin-global-header';

// Concrete RHDH modules only — avoid Help/Profile/CreateDropdown (circular defaultMountPoints).
import { GlobalHeaderComponent } from '@red-hat-developer-hub/backstage-plugin-global-header/dist/components/GlobalHeaderComponent.esm.js';
import { Spacer } from '@red-hat-developer-hub/backstage-plugin-global-header/dist/components/Spacer/Spacer.esm.js';
import { StarredDropdown } from '@red-hat-developer-hub/backstage-plugin-global-header/dist/components/HeaderDropdownComponent/StarredDropdown.esm.js';
import { Divider } from '@red-hat-developer-hub/backstage-plugin-global-header/dist/components/Divider/Divider.esm.js';

import { AutomationPortalBrand } from './AutomationPortalBrand';
import { PortalHeaderSearch } from './PortalHeaderSearch';
import { PortalCreateButton } from './PortalCreateButton';
import { PortalNotificationButton } from './PortalNotificationButton';
import { PortalHelpMenu } from './PortalHelpMenu';
import { PortalProfileMenu } from './PortalProfileMenu';
// import { ExperiencesWaffleButton } from './ExperiencesWaffleButton';

/**
 * Brand (224 = sidebar) → Search → Spacer →
 * Create → Starred → Help → Bell → Divider → Profile
 *
 * Experiences waffle (blue Apps slice → Bridge) parked — set SHOW_EXPERIENCES_WAFFLE
 * in ExperiencesWaffleButton + remount priority 210 when trying again.
 */
export const GlobalHeader = () => {
  const location = useLocation();

  const portalHeaderMountPoints: GlobalHeaderComponentMountPoint[] = useMemo(
    () => [
      // {
      //   Component: ExperiencesWaffleButton,
      //   config: { priority: 210 },
      // },
      {
        Component: AutomationPortalBrand,
        config: { priority: 200 },
      },
      {
        Component: PortalHeaderSearch,
        config: { priority: 100 },
      },
      {
        Component: Spacer,
        config: {
          priority: 99,
          props: { growFactor: 1 },
        },
      },
      {
        Component: PortalCreateButton,
        config: { priority: 90 },
      },
      {
        Component: StarredDropdown,
        config: { priority: 85 },
      },
      {
        Component: PortalHelpMenu,
        config: { priority: 80 },
      },
      {
        Component: PortalNotificationButton,
        config: { priority: 70 },
      },
      {
        Component: Divider,
        config: { priority: 50 },
      },
      {
        Component: PortalProfileMenu,
        config: { priority: 10 },
      },
    ],
    [],
  );

  if (location.pathname.includes('/setup')) {
    return null;
  }

  return (
    <GlobalHeaderComponent globalHeaderMountPoints={portalHeaderMountPoints} />
  );
};
