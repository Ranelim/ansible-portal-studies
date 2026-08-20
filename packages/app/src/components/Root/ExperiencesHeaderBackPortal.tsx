import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconButton, makeStyles } from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import { SHOW_EXPERIENCES_WAFFLE } from '../GlobalHeader/ExperiencesWaffleButton';
import {
  isGlobalShellPath,
  useGlobalShellResume,
} from './GlobalShellResumeBar';

const useStyles = makeStyles(theme => ({
  back: {
    marginLeft: theme.spacing(-0.5),
    marginRight: theme.spacing(0.25),
    color: 'inherit',
    flexShrink: 0,
  },
}));

const MOUNT_ATTR = 'data-experiences-header-back';
const TITLE_ROW_ATTR = 'data-experiences-header-title-row';

function findHeaderLeftBox(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    '[class*="BackstageHeader-leftItemsBox"]',
  );
}

function unwrapTitleRows() {
  document.querySelectorAll(`[${TITLE_ROW_ATTR}]`).forEach(row => {
    const parent = row.parentElement;
    if (!parent) {
      row.remove();
      return;
    }
    while (row.firstChild) {
      parent.insertBefore(row.firstChild, row);
    }
    row.remove();
  });
}

function ensureMount(box: HTMLElement): HTMLElement {
  // Keep subtitle under the title (stock Header stacks them). A row flex on
  // the left box put Back + title + subtitle on one line.
  box.style.display = 'flex';
  box.style.flexDirection = 'column';
  box.style.alignItems = 'flex-start';
  box.style.justifyContent = 'flex-start';
  box.style.gap = '0';

  let titleRow = box.querySelector<HTMLElement>(`[${TITLE_ROW_ATTR}]`);
  if (!titleRow) {
    const title =
      box.querySelector<HTMLElement>('[class*="BackstageHeader-title"]') ??
      box.querySelector<HTMLElement>('h1, h2');
    titleRow = document.createElement('span');
    titleRow.setAttribute(TITLE_ROW_ATTR, '');
    titleRow.style.display = 'inline-flex';
    titleRow.style.alignItems = 'center';
    titleRow.style.gap = '4px';
    if (title && title.parentElement === box) {
      box.insertBefore(titleRow, title);
      titleRow.appendChild(title);
    } else {
      box.insertBefore(titleRow, box.firstChild);
    }
  }

  box.querySelectorAll(`[${MOUNT_ATTR}]`).forEach(el => {
    if (!titleRow.contains(el)) el.remove();
  });

  let mount = titleRow.querySelector<HTMLElement>(`[${MOUNT_ATTR}]`);
  if (!mount) {
    mount = document.createElement('span');
    mount.setAttribute(MOUNT_ATTR, '');
    mount.style.display = 'inline-flex';
    mount.style.alignItems = 'center';
    mount.style.flexShrink = '0';
    titleRow.insertBefore(mount, titleRow.firstChild);
  }
  return mount;
}

/**
 * Icon-only ← to the left of the Header title on rail-less orphan pages
 * (Search, Create, Settings, profile, Notifications). Banner is not used.
 */
export const ExperiencesHeaderBackPortal = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const resume = useGlobalShellResume();
  const [mount, setMount] = useState<HTMLElement | null>(null);

  const enabled =
    !SHOW_EXPERIENCES_WAFFLE &&
    isGlobalShellPath(pathname, search) &&
    Boolean(resume);

  useLayoutEffect(() => {
    if (!enabled) {
      setMount(null);
      document.querySelectorAll(`[${MOUNT_ATTR}]`).forEach(el => el.remove());
      unwrapTitleRows();
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
      unwrapTitleRows();
    };
  }, [enabled, pathname, search]);

  if (!enabled || !mount || !resume) return null;

  return createPortal(
    <IconButton
      className={classes.back}
      size="small"
      color="inherit"
      aria-label={`Back to ${resume.label}`}
      onClick={() => navigate(resume.href)}
    >
      <ArrowBackIcon fontSize="small" />
    </IconButton>,
    mount,
  );
};
