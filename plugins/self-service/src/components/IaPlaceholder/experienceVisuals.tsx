import { Box } from '@material-ui/core';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import CodeIcon from '@material-ui/icons/Code';
import VerifiedUserIcon from '@material-ui/icons/VerifiedUser';
import DevicesOtherIcon from '@material-ui/icons/DevicesOther';
import AccountTreeIcon from '@material-ui/icons/AccountTree';
import type { ComponentType, CSSProperties } from 'react';
import type { JobExperienceId } from '../../hooks/experienceRecent';

/** Hub card / switcher swatches — one color per job-mode experience. */
export const EXPERIENCE_ACCENT: Record<JobExperienceId, string> = {
  automate: '#0066CC',
  develop: '#7B3DB8',
  compliance: '#C46100',
  edge: '#147EBC',
  orchestrator: '#3E8635',
};

const EXPERIENCE_ICONS: Record<
  JobExperienceId,
  ComponentType<{ style?: CSSProperties }>
> = {
  automate: PlayArrowIcon,
  develop: CodeIcon,
  compliance: VerifiedUserIcon,
  edge: DevicesOtherIcon,
  orchestrator: AccountTreeIcon,
};

type ExperienceThumbnailProps = {
  id: JobExperienceId;
  size?: number;
};

/** Colored tile used on the Bridge catalog and Administration → Experiences. */
export const ExperienceThumbnail = ({
  id,
  size = 40,
}: ExperienceThumbnailProps) => {
  const Icon = EXPERIENCE_ICONS[id];
  return (
    <Box
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: 3,
        backgroundColor: EXPERIENCE_ACCENT[id],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        flexShrink: 0,
      }}
    >
      <Icon style={{ fontSize: Math.round(size * 0.55) }} />
    </Box>
  );
};
