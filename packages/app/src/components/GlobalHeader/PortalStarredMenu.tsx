import StarBorderIcon from '@mui/icons-material/StarBorder';
import { DisabledMastheadAction } from './DisabledMastheadAction';

/**
 * RHDH Starred slot — visible in the study, not navigable.
 */
export const PortalStarredMenu = () => (
  <DisabledMastheadAction title="Your starred items">
    <StarBorderIcon />
  </DisabledMastheadAction>
);
