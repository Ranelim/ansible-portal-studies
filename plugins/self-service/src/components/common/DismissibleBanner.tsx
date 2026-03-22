import { useState } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Link,
  makeStyles,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';

const useStyles = makeStyles(theme => ({
  banner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5, 2),
    marginBottom: theme.spacing(2),
    backgroundColor:
      theme.palette.type === 'light'
        ? '#e7f1fa'
        : 'rgba(38, 117, 195, 0.12)',
    border: `1px solid ${
      theme.palette.type === 'light' ? '#bee1f4' : 'rgba(38, 117, 195, 0.3)'
    }`,
    borderRadius: theme.shape.borderRadius,
  },
  icon: {
    color: '#2b9af3',
    fontSize: 20,
    marginTop: 2,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  message: {
    fontSize: 13,
    lineHeight: 1.6,
    color: theme.palette.text.primary,
  },
  cta: {
    fontSize: 13,
    fontWeight: 600,
    marginTop: 4,
    display: 'inline-block',
  },
  close: {
    marginTop: -4,
    marginRight: -8,
    flexShrink: 0,
  },
}));

export interface DismissibleBannerProps {
  storageKey: string;
  message: string;
  ctaText?: string;
  ctaHref?: string;
}

export const DismissibleBanner = ({
  storageKey,
  message,
  ctaText,
  ctaHref,
}: DismissibleBannerProps) => {
  const classes = useStyles();
  const fullKey = `portal-banner-${storageKey}`;

  const [visible, setVisible] = useState(
    () => localStorage.getItem(fullKey) !== 'dismissed',
  );

  if (!visible) return null;

  const handleDismiss = () => {
    localStorage.setItem(fullKey, 'dismissed');
    setVisible(false);
  };

  return (
    <Box className={classes.banner}>
      <InfoOutlinedIcon className={classes.icon} />
      <Box className={classes.content}>
        <Typography className={classes.message}>{message}</Typography>
        {ctaText && ctaHref && (
          <Link href={ctaHref} className={classes.cta}>
            {ctaText}
          </Link>
        )}
      </Box>
      <IconButton
        size="small"
        onClick={handleDismiss}
        className={classes.close}
        aria-label="Dismiss"
      >
        <CloseIcon style={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
};
