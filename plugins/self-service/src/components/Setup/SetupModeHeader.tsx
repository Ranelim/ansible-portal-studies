import { Box, Typography, makeStyles } from '@material-ui/core';
import redHatLogo from '../../assets/redhat-logo.png';

const useStyles = makeStyles(theme => {
  const rhdhGeneral = (theme.palette as any).rhdh?.general ?? {};
  const appBarBg =
    rhdhGeneral.appBarBackgroundColor ??
    (theme.palette.type === 'dark' ? '#151515' : '#f2f2f2');
  const appBarFg =
    rhdhGeneral.appBarForegroundColor ?? theme.palette.text.primary;

  return {
    header: {
      height: 64,
      flexShrink: 0,
      backgroundColor: appBarBg,
      color: appBarFg,
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px 0 32px',
      gap: 12,
      boxSizing: 'border-box',
    },
    logo: {
      width: 36,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      color: appBarFg,
      fontSize: 16,
      fontWeight: 700,
      lineHeight: 1.15,
    },
    subtitle: {
      color: appBarFg,
      fontSize: 16,
      fontWeight: 400,
      lineHeight: 1.15,
    },
    chip: {
      marginLeft: 'auto',
      padding: '4px 10px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: 0.5,
      backgroundColor: 'rgba(0, 102, 204, 0.12)',
      color: theme.palette.type === 'dark' ? '#8BC1F7' : '#0066CC',
      border: `1px solid ${
        theme.palette.type === 'dark' ? 'rgba(139, 193, 247, 0.35)' : 'rgba(0, 102, 204, 0.35)'
      }`,
    },
  };
});

/** Day 0 chrome — same SETUP MODE badge on every screen before the Portal. */
export const SetupModeHeader = () => {
  const classes = useStyles();
  return (
    <Box className={classes.header}>
      <Box className={classes.logo}>
        <img
          src={redHatLogo}
          alt="Red Hat"
          style={{ width: 36, height: 36, objectFit: 'contain' }}
        />
      </Box>
      <Box>
        <Typography className={classes.title}>Red Hat</Typography>
        <Typography className={classes.subtitle}>Automation Portal</Typography>
      </Box>
      <Box className={classes.chip}>SETUP MODE</Box>
    </Box>
  );
};
