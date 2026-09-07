import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { DisabledMastheadAction } from './DisabledMastheadAction';

/**
 * RHDH Help slot — visible in the study, not navigable.
 */
export const PortalHelpMenu = () => (
  <DisabledMastheadAction title="Help">
    <HelpOutlineIcon />
  </DisabledMastheadAction>
);
