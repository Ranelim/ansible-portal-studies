import { Box, Typography, Button, makeStyles } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(6),
    minHeight: '45vh',
    padding: theme.spacing(6, 4),
  },
  textSection: {
    flex: '0 1 480px',
  },
  title: {
    fontWeight: 300,
    fontSize: '1.75rem',
    marginBottom: theme.spacing(2),
    color: theme.palette.text.primary,
  },
  description: {
    fontSize: 14,
    lineHeight: 1.7,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(3),
    maxWidth: 440,
  },
  cta: {
    textTransform: 'none',
    fontWeight: 600,
    borderRadius: 20,
  },
  illustrationSection: {
    flex: '0 1 420px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
}));

interface EmptyStateLayoutProps {
  title: string;
  description: string;
  illustration: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyStateLayout = ({
  title,
  description,
  illustration,
  actionLabel,
  onAction,
}: EmptyStateLayoutProps) => {
  const classes = useStyles();

  return (
    <Box className={classes.root}>
      <Box className={classes.textSection}>
        <Typography variant="h4" className={classes.title}>
          {title}
        </Typography>
        <Typography className={classes.description}>{description}</Typography>
        {actionLabel && onAction && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={onAction}
            className={classes.cta}
            startIcon={<AddIcon />}
          >
            {actionLabel}
          </Button>
        )}
      </Box>
      <Box className={classes.illustrationSection}>{illustration}</Box>
    </Box>
  );
};

const illustrationColor = {
  bg: '#f0f0f0',
  border: '#d2d2d2',
  line: '#c8c8c8',
  lineDark: '#a8a8a8',
  accent: '#2b9af3',
  accentLight: '#bee1f4',
};

export const ProjectsIllustration = () => (
  <svg
    width="380"
    height="270"
    viewBox="0 0 280 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Folder shape */}
    <rect
      x="30"
      y="40"
      width="220"
      height="140"
      rx="6"
      fill={illustrationColor.bg}
      stroke={illustrationColor.border}
      strokeWidth="1.5"
    />
    <path
      d="M30 46C30 42.6863 32.6863 40 36 40H100L115 55H244C247.314 55 250 57.6863 250 61V55H30V46Z"
      fill={illustrationColor.border}
      opacity="0.4"
    />
    {/* Git branch icon */}
    <circle cx="80" cy="95" r="6" fill={illustrationColor.accent} opacity="0.8" />
    <circle cx="80" cy="130" r="6" fill={illustrationColor.accent} opacity="0.5" />
    <line x1="80" y1="101" x2="80" y2="124" stroke={illustrationColor.accent} strokeWidth="2" opacity="0.6" />
    <circle cx="105" cy="112" r="5" fill={illustrationColor.accentLight} stroke={illustrationColor.accent} strokeWidth="1.5" />
    <line x1="84" y1="100" x2="101" y2="109" stroke={illustrationColor.accent} strokeWidth="1.5" opacity="0.5" />
    {/* Content lines */}
    <rect x="130" y="85" width="90" height="6" rx="3" fill={illustrationColor.line} />
    <rect x="130" y="100" width="70" height="6" rx="3" fill={illustrationColor.line} opacity="0.7" />
    <rect x="130" y="115" width="80" height="6" rx="3" fill={illustrationColor.line} opacity="0.5" />
    <rect x="130" y="130" width="55" height="6" rx="3" fill={illustrationColor.line} opacity="0.4" />
    {/* Pipeline steps */}
    <rect x="55" y="155" width="30" height="8" rx="4" fill={illustrationColor.accent} opacity="0.3" />
    <rect x="92" y="155" width="30" height="8" rx="4" fill={illustrationColor.accent} opacity="0.5" />
    <rect x="129" y="155" width="30" height="8" rx="4" fill={illustrationColor.accent} opacity="0.7" />
    <rect x="166" y="155" width="30" height="8" rx="4" fill={illustrationColor.accent} opacity="0.9" />
  </svg>
);

export const ExecutionEnvironmentsIllustration = () => (
  <svg
    width="380"
    height="270"
    viewBox="0 0 280 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Container box */}
    <rect
      x="60"
      y="35"
      width="160"
      height="130"
      rx="8"
      fill={illustrationColor.bg}
      stroke={illustrationColor.border}
      strokeWidth="1.5"
    />
    {/* Container top edge */}
    <rect x="60" y="35" width="160" height="24" rx="8" fill={illustrationColor.border} opacity="0.35" />
    <rect x="60" y="48" width="160" height="11" fill={illustrationColor.border} opacity="0.35" />
    {/* Dots in header */}
    <circle cx="78" cy="47" r="4" fill={illustrationColor.accent} opacity="0.7" />
    <circle cx="92" cy="47" r="4" fill="#f5a623" opacity="0.6" />
    <circle cx="106" cy="47" r="4" fill="#4caf50" opacity="0.6" />
    {/* Stack layers inside */}
    <rect x="80" y="72" width="120" height="20" rx="4" fill="white" stroke={illustrationColor.border} strokeWidth="1" />
    <rect x="88" y="79" width="50" height="6" rx="3" fill={illustrationColor.accent} opacity="0.5" />
    <rect x="80" y="98" width="120" height="20" rx="4" fill="white" stroke={illustrationColor.border} strokeWidth="1" />
    <rect x="88" y="105" width="65" height="6" rx="3" fill={illustrationColor.line} />
    <rect x="80" y="124" width="120" height="20" rx="4" fill="white" stroke={illustrationColor.border} strokeWidth="1" />
    <rect x="88" y="131" width="40" height="6" rx="3" fill={illustrationColor.line} opacity="0.6" />
    {/* Arrow pointing into container */}
    <path d="M35 100 L55 100" stroke={illustrationColor.accent} strokeWidth="2" strokeDasharray="4 3" opacity="0.5" />
    <polygon points="55,95 65,100 55,105" fill={illustrationColor.accent} opacity="0.5" />
  </svg>
);

export const CollectionsIllustration = () => (
  <svg
    width="380"
    height="270"
    viewBox="0 0 280 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Stacked module cards */}
    <rect
      x="45"
      y="65"
      width="100"
      height="80"
      rx="6"
      fill="white"
      stroke={illustrationColor.border}
      strokeWidth="1.5"
    />
    <rect x="58" y="80" width="50" height="5" rx="2.5" fill={illustrationColor.accent} opacity="0.6" />
    <rect x="58" y="92" width="70" height="5" rx="2.5" fill={illustrationColor.line} />
    <rect x="58" y="104" width="55" height="5" rx="2.5" fill={illustrationColor.line} opacity="0.6" />
    <rect x="58" y="116" width="40" height="5" rx="2.5" fill={illustrationColor.line} opacity="0.4" />
    {/* Second card offset */}
    <rect
      x="135"
      y="45"
      width="100"
      height="80"
      rx="6"
      fill="white"
      stroke={illustrationColor.border}
      strokeWidth="1.5"
    />
    <rect x="148" y="60" width="45" height="5" rx="2.5" fill={illustrationColor.accent} opacity="0.6" />
    <rect x="148" y="72" width="65" height="5" rx="2.5" fill={illustrationColor.line} />
    <rect x="148" y="84" width="50" height="5" rx="2.5" fill={illustrationColor.line} opacity="0.6" />
    <rect x="148" y="96" width="35" height="5" rx="2.5" fill={illustrationColor.line} opacity="0.4" />
    {/* Third card offset */}
    <rect
      x="120"
      y="115"
      width="100"
      height="65"
      rx="6"
      fill="white"
      stroke={illustrationColor.border}
      strokeWidth="1.5"
    />
    <rect x="133" y="130" width="55" height="5" rx="2.5" fill={illustrationColor.accent} opacity="0.6" />
    <rect x="133" y="142" width="60" height="5" rx="2.5" fill={illustrationColor.line} />
    <rect x="133" y="154" width="45" height="5" rx="2.5" fill={illustrationColor.line} opacity="0.6" />
    {/* Connection dots */}
    <circle cx="145" cy="108" r="3" fill={illustrationColor.accent} opacity="0.4" />
    <circle cx="120" cy="135" r="3" fill={illustrationColor.accent} opacity="0.4" />
  </svg>
);

export const RepositoriesIllustration = () => (
  <svg
    width="380"
    height="270"
    viewBox="0 0 280 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Repo card 1 */}
    <rect
      x="30"
      y="40"
      width="220"
      height="45"
      rx="6"
      fill="white"
      stroke={illustrationColor.border}
      strokeWidth="1.5"
    />
    <circle cx="55" cy="62" r="10" fill={illustrationColor.accent} opacity="0.2" />
    <path
      d="M52 58 L55 62 L58 58 M55 62 L55 68"
      stroke={illustrationColor.accent}
      strokeWidth="1.5"
      fill="none"
      opacity="0.8"
    />
    <rect x="75" y="54" width="80" height="5" rx="2.5" fill={illustrationColor.lineDark} />
    <rect x="75" y="64" width="55" height="4" rx="2" fill={illustrationColor.line} opacity="0.6" />
    <rect x="195" y="55" width="40" height="14" rx="7" fill={illustrationColor.accent} opacity="0.15" />
    <rect x="202" y="59" width="26" height="5" rx="2.5" fill={illustrationColor.accent} opacity="0.6" />
    {/* Repo card 2 */}
    <rect
      x="30"
      y="95"
      width="220"
      height="45"
      rx="6"
      fill="white"
      stroke={illustrationColor.border}
      strokeWidth="1.5"
    />
    <circle cx="55" cy="117" r="10" fill={illustrationColor.accent} opacity="0.2" />
    <path
      d="M52 113 L55 117 L58 113 M55 117 L55 123"
      stroke={illustrationColor.accent}
      strokeWidth="1.5"
      fill="none"
      opacity="0.8"
    />
    <rect x="75" y="109" width="95" height="5" rx="2.5" fill={illustrationColor.lineDark} />
    <rect x="75" y="119" width="60" height="4" rx="2" fill={illustrationColor.line} opacity="0.6" />
    <circle cx="210" cy="117" r="8" fill="#4caf50" opacity="0.15" />
    <path d="M206 117 L209 120 L214 114" stroke="#4caf50" strokeWidth="1.5" fill="none" opacity="0.6" />
    {/* Repo card 3 */}
    <rect
      x="30"
      y="150"
      width="220"
      height="45"
      rx="6"
      fill="white"
      stroke={illustrationColor.border}
      strokeWidth="1.5"
    />
    <circle cx="55" cy="172" r="10" fill={illustrationColor.accent} opacity="0.2" />
    <path
      d="M52 168 L55 172 L58 168 M55 172 L55 178"
      stroke={illustrationColor.accent}
      strokeWidth="1.5"
      fill="none"
      opacity="0.8"
    />
    <rect x="75" y="164" width="70" height="5" rx="2.5" fill={illustrationColor.lineDark} />
    <rect x="75" y="174" width="50" height="4" rx="2" fill={illustrationColor.line} opacity="0.6" />
    <rect x="195" y="165" width="40" height="14" rx="7" fill={illustrationColor.accent} opacity="0.15" />
    <rect x="202" y="169" width="26" height="5" rx="2.5" fill={illustrationColor.accent} opacity="0.6" />
  </svg>
);
