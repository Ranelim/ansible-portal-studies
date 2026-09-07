import AddIcon from '@mui/icons-material/Add';
import { DisabledMastheadAction } from './DisabledMastheadAction';

/**
 * RHDH Create slot — visible in the study, not navigable.
 */
export const PortalCreateButton = () => (
  <DisabledMastheadAction title="Create">
    <AddIcon />
  </DisabledMastheadAction>
);
