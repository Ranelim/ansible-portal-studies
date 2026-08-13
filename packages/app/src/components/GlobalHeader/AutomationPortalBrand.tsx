import { Link } from '@backstage/core-components';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

/** Matches Backstage/RHDH open sidebar — brand column = rail width so search hits the gutter. */
export const SIDEBAR_WIDTH_OPEN = 224;

/**
 * Transparent fedora (RHDH DefaultLogo hat paths) — no black plate like the PNG asset.
 */
const RedHatFedora = ({ size = 36 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 194 146"
    width={size}
    height={size}
    aria-hidden
    style={{ display: 'block', flexShrink: 0 }}
  >
    <path
      fill="#e00"
      d="M129,85c12.5,0,30.6-2.6,30.6-17.5c0-1.2,0-2.3-0.3-3.4l-7.4-32.4c-1.7-7.1-3.2-10.3-15.7-16.6C126.4,10.2,105.3,2,99,2c-5.8,0-7.5,7.5-14.4,7.5c-6.7,0-11.6-5.6-17.9-5.6c-6,0-9.9,4.1-12.9,12.5c0,0-8.4,23.7-9.5,27.2C44,44.3,44,45,44,45.5C44,54.8,80.3,85,129,85 M161.5,73.6c1.7,8.2,1.7,9.1,1.7,10.1c0,14-15.7,21.8-36.4,21.8C80,105.5,39.1,78.1,39.1,60c0-2.8,0.6-5.4,1.5-7.3C23.8,53.5,2,56.5,2,75.7C2,107.2,76.6,146,135.7,146c45.3,0,56.7-20.5,56.7-36.6C192.3,96.6,181.4,82.2,161.5,73.6"
    />
    <path
      fill="#000"
      d="M161.5,73.6c1.7,8.2,1.7,9.1,1.7,10.1c0,14-15.7,21.8-36.4,21.8C80,105.5,39.1,78.1,39.1,60c0-2.8,0.6-5.4,1.5-7.3l3.7-9.1C44,44.3,44,45,44,45.5C44,54.8,80.3,85,129,85c12.5,0,30.6-2.6,30.6-17.5c0-1.2,0-2.3-0.3-3.4L161.5,73.6z"
    />
  </svg>
);

/**
 * Portal brand — AAP / RHDH masthead hierarchy:
 * fedora (transparent) + strong “Red Hat” + bold product name.
 */
export const AutomationPortalBrand = () => {
  const theme = useTheme();
  const ink = theme.palette.text.primary;

  return (
    <Box
      data-testid="global-header-company-logo"
      sx={{
        width: SIDEBAR_WIDTH_OPEN,
        minWidth: SIDEBAR_WIDTH_OPEN,
        maxWidth: SIDEBAR_WIDTH_OPEN,
        marginRight: 0,
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        flexShrink: 0,
        boxSizing: 'border-box',
        pl: 1.5,
        pr: 1,
      }}
    >
      <Link
        to="/"
        underline="none"
        color="inherit"
        aria-label="Home — Automation Portal"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: 'inherit',
          minWidth: 0,
        }}
      >
        <RedHatFedora size={36} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minWidth: 0,
            gap: '1px',
          }}
        >
          <Typography
            component="span"
            sx={{
              fontFamily:
                '"Red Hat Display", "RedHatDisplay", "Red Hat Text", Helvetica, Arial, sans-serif',
              fontSize: 16,
              fontWeight: 700,
              lineHeight: 1.15,
              color: ink,
              whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}
          >
            Red Hat
          </Typography>
          {/* Secondary product line — RHDH-like hierarchy under bold Red Hat */}
          <Typography
            component="span"
            sx={{
              fontFamily:
                '"Red Hat Text", "RedHatText", Helvetica, Arial, sans-serif',
              fontSize: 16,
              fontWeight: 400,
              lineHeight: 1.15,
              color: ink,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Automation Portal
          </Typography>
        </Box>
      </Link>
    </Box>
  );
};
