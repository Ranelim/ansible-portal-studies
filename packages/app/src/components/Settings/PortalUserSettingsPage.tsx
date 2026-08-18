import {
  SettingsLayout,
  UserSettingsAuthProviders,
  UserSettingsFeatureFlags,
  UserSettingsGeneral,
} from '@backstage/plugin-user-settings';
import { PortalNotificationSettings } from '../Notifications/PortalNotificationSettings';

/**
 * RHDH user-settings hub — titled so it is not confused with Administration.
 */
export const PortalUserSettingsPage = () => (
  <SettingsLayout title="User settings">
    <SettingsLayout.Route path="general" title="General">
      <UserSettingsGeneral />
    </SettingsLayout.Route>
    <SettingsLayout.Route
      path="auth-providers"
      title="Authentication Providers"
    >
      <UserSettingsAuthProviders />
    </SettingsLayout.Route>
    <SettingsLayout.Route path="feature-flags" title="Feature Flags">
      <UserSettingsFeatureFlags />
    </SettingsLayout.Route>
    <SettingsLayout.Route path="notifications" title="Notifications">
      <PortalNotificationSettings />
    </SettingsLayout.Route>
  </SettingsLayout>
);
