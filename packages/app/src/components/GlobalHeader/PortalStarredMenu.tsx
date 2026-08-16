import type { FC } from 'react';
import {
  useEntityPresentation,
  useStarredEntities,
} from '@backstage/plugin-catalog-react';
import { Link } from '@backstage/core-components';
import { parseEntityRef } from '@backstage/catalog-model';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import Star from '@mui/icons-material/Star';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { HeaderDropdownComponent } from '@red-hat-developer-hub/backstage-plugin-global-header/dist/components/HeaderDropdownComponent/HeaderDropdownComponent.esm.js';
import { useDropdownManager } from '@red-hat-developer-hub/backstage-plugin-global-header/dist/hooks/useDropdownManager.esm.js';
import { DropdownEmptyState } from '@red-hat-developer-hub/backstage-plugin-global-header/dist/components/HeaderDropdownComponent/DropdownEmptyState.esm.js';
import { mastheadIconButtonSx } from './mastheadIconSx';

const StarredItem: FC<{
  entityRef: string;
  toggleStarredEntity: (ref: string) => void;
  handleClose: () => void;
}> = ({ entityRef, toggleStarredEntity, handleClose }) => {
  const { Icon, primaryTitle, secondaryTitle } =
    useEntityPresentation(entityRef);
  const { name, kind, namespace } = parseEntityRef(entityRef);
  const theme = useTheme();

  return (
    <MenuItem
      component={Link}
      to={`/catalog/${namespace || 'default'}/${kind}/${name}`}
      onClick={handleClose}
      disableRipple
      disableTouchRipple
    >
      {Icon && (
        <ListItemIcon sx={{ minWidth: 36 }}>
          <Icon />
        </ListItemIcon>
      )}
      <ListItemText
        primary={
          <Typography sx={{ color: theme.palette.text.primary }}>
            {primaryTitle || secondaryTitle}
          </Typography>
        }
        secondary={kind.toLocaleUpperCase()}
        sx={{ ml: 1, mr: 1 }}
      />
      <Tooltip title="Remove from list">
        <IconButton
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            toggleStarredEntity(entityRef);
          }}
        >
          <Star color="warning" />
        </IconButton>
      </Tooltip>
    </MenuItem>
  );
};

/**
 * RHDH StarredDropdown with masthead pressed state while the menu is open.
 * Open state is marked on a wrapper (`data-masthead-menu-open`) — Tooltip
 * freezes IconButton sx, so CSS in Root drives the pressed surface.
 */
export const PortalStarredMenu = () => {
  const { anchorEl, handleOpen, handleClose } = useDropdownManager();
  const { starredEntities, toggleStarredEntity } = useStarredEntities();
  const entitiesArray = Array.from(starredEntities);
  const open = Boolean(anchorEl);

  return (
    <Box data-masthead-menu-open={open ? 'true' : undefined}>
      <HeaderDropdownComponent
        buttonContent={<StarBorderIcon fontSize="small" />}
        onOpen={handleOpen}
        onClose={handleClose}
        anchorEl={anchorEl}
        tooltip="Your starred items"
        isIconButton
        buttonProps={{
          color: 'inherit',
          'aria-label': 'Your starred items',
          sx: mastheadIconButtonSx(false),
        }}
      >
        {entitiesArray.length > 0 ? (
          <>
            <ListItemText
              primary="Your starred items"
              sx={{ pl: 2, mt: 1, fontWeight: 'bold', color: 'text.secondary' }}
            />
            {entitiesArray.map(entityRef => (
              <StarredItem
                key={entityRef}
                entityRef={entityRef}
                toggleStarredEntity={toggleStarredEntity}
                handleClose={handleClose}
              />
            ))}
          </>
        ) : (
          <DropdownEmptyState
            title="No starred items yet"
            subTitle="Click the star icon next to an entity's name to save it here for quick access."
            icon={
              <AutoAwesomeIcon sx={{ fontSize: 64 }} color="disabled" />
            }
          />
        )}
      </HeaderDropdownComponent>
    </Box>
  );
};
