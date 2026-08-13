/*
 * Copyright The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Vendored from redhat-developer/rhdh-plugins
 * workspaces/extensions/plugins/extensions/src/components/Badges.tsx
 * (i18n wired to English strings from extensions translation ref)
 */

import Chip from '@mui/material/Chip';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import Tooltip from '@mui/material/Tooltip';
import {
  ExtensionsAnnotation,
  ExtensionsPlugin,
  ExtensionsSupportLevel,
} from './types';
import { colors } from './consts';

interface BadgeOptions {
  isBadge?: boolean;
  color?: string;
  label?: string;
  tooltip?: string;
  statusTooltip?: string;
}

const getBadgeOptions = (entity: ExtensionsPlugin): BadgeOptions | null => {
  const supportLevel = entity.spec?.support?.level;
  const supportProvider = entity.spec?.support?.provider;

  if (supportLevel === ExtensionsSupportLevel.GENERALLY_AVAILABLE) {
    return {
      isBadge: true,
      color: colors.generallyAvailable,
      label: 'Generally available (GA)',
      tooltip: supportProvider
        ? `Generally available and supported by ${supportProvider}`
        : 'Generally available and supported',
      statusTooltip: supportProvider
        ? `Production ready — supported by ${supportProvider}`
        : 'Production ready',
    };
  }
  if (supportLevel === ExtensionsSupportLevel.COMMUNITY) {
    return {
      isBadge: false,
      label: 'Community plugin',
      statusTooltip: 'Open source with no commercial support',
    };
  }
  if (supportLevel === ExtensionsSupportLevel.TECH_PREVIEW) {
    return {
      isBadge: false,
      label: 'Tech Preview',
      statusTooltip: 'Plugin in development',
    };
  }
  if (supportLevel === ExtensionsSupportLevel.DEV_PREVIEW) {
    return {
      isBadge: false,
      label: 'Dev Preview',
      statusTooltip: 'Early stage experimental',
    };
  }

  if (
    entity.metadata?.annotations?.[ExtensionsAnnotation.PRE_INSTALLED] !==
    'true'
  ) {
    return {
      isBadge: true,
      color: colors.custom,
      label: 'Custom plugin',
      tooltip: 'Custom plugin',
      statusTooltip: 'Added by admin',
    };
  }

  return null;
};

export const BadgeChip = ({ plugin }: { plugin: ExtensionsPlugin }) => {
  if (!plugin) {
    return null;
  }
  const options = getBadgeOptions(plugin);
  if (!options) {
    return null;
  }
  return (
    <Tooltip title={options.statusTooltip} placement="right" arrow>
      <Chip
        avatar={
          options.isBadge ? (
            <TaskAltIcon style={{ color: options.color }} />
          ) : undefined
        }
        label={options.label}
        variant="outlined"
        size="small"
        title={options.tooltip}
        sx={{
          cursor: 'pointer',
        }}
      />
    </Tooltip>
  );
};

export const BadgeTriange = ({ plugin }: { plugin: ExtensionsPlugin }) => {
  if (!plugin) {
    return null;
  }
  const options = getBadgeOptions(plugin);
  if (!options || !options.isBadge) {
    return null;
  }
  // We can't extract as a prop because the icon size depends on it.
  const size = 40;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute' }}>
        <Tooltip title={options.tooltip} placement="top" arrow>
          <div
            role="img"
            aria-label={options.tooltip}
            style={{ width: size, height: size }}
          >
            <div
              style={{
                position: 'absolute',
                width: size,
                height: size,
                backgroundColor: options.color,
                clipPath: 'polygon(0 0, 100% 0, 0 100%)',
              }}
            />
            <TaskAltIcon
              style={{
                position: 'absolute',
                top: 4,
                left: 4,
                width: 16,
                height: 16,
                color: 'white',
              }}
            />
          </div>
        </Tooltip>
      </div>
    </div>
  );
};
