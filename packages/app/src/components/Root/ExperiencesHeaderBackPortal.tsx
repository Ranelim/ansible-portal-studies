import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconButton, makeStyles } from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import {
  isSmeRole,
  useUserRoleContext,
  writeNavExperience,
} from '@ansible/plugin-backstage-self-service';
import { isGlobalShellPath } from './GlobalShellResumeBar';

const useStyles = makeStyles(theme => ({
  back: {
    marginLeft: theme.spacing(-0.5),
    marginRight: theme.spacing(0.25),
    color: 'inherit',
    flexShrink: 0,
  },
}));

const MOUNT_ATTR = 'data-experiences-header-back';

function findHeaderLeftBox(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    '[class*="BackstageHeader-leftItemsBox"]',
  );
}

function ensureMount(box: HTMLElement): HTMLElement {
  let mount = box.querySelector<HTMLElement>(`[${MOUNT_ATTR}]`);
  if (!mount) {
    mount = document.createElement('span');
    mount.setAttribute(MOUNT_ATTR, '');
    mount.style.display = 'inline-flex';
    mount.style.alignItems = 'center';
    mount.style.flexShrink = '0';
    box.insertBefore(mount, box.firstChild);
  }
  // Title + back on one row (stock Header left box is not always flex).
  box.style.display = 'flex';
  box.style.alignItems = 'center';
  box.style.gap = '4px';
  return mount;
}

/**
 * Injects ← next to the stock Backstage page Header title on rail-less
 * orphan pages (Settings, Search, Create, user profile, Notifications, …).
 * Multi-seat only — SME has no Experiences catalog to return to.
 */
export const ExperiencesHeaderBackPortal = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { role } = useUserRoleContext();
  const [mount, setMount] = useState<HTMLElement | null>(null);

  const enabled = !isSmeRole(role) && isGlobalShellPath(pathname, search);

  useLayoutEffect(() => {
    if (!enabled) {
      setMount(null);
      document.querySelectorAll(`[${MOUNT_ATTR}]`).forEach(el => el.remove());
      return undefined;
    }

    const sync = () => {
      const box = findHeaderLeftBox();
      if (!box) {
        setMount(null);
        return;
      }
      setMount(ensureMount(box));
    };

    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      document.querySelectorAll(`[${MOUNT_ATTR}]`).forEach(el => el.remove());
    };
  }, [enabled, pathname, search]);

  if (!enabled || !mount) return null;

  return createPortal(
    <IconButton
      className={classes.back}
      size="small"
      color="inherit"
      aria-label="Back to Experiences"
      onClick={() => {
        writeNavExperience('all');
        navigate('/self-service/experiences');
      }}
    >
      <ArrowBackIcon fontSize="small" />
    </IconButton>,
    mount,
  );
};
