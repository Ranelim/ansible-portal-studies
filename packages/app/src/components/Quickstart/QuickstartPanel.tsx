import { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Slide,
  Tooltip,
  Divider,
  LinearProgress,
  Collapse,
  makeStyles,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import SettingsIcon from '@material-ui/icons/Settings';
import LockIcon from '@material-ui/icons/Lock';
import StorageIcon from '@material-ui/icons/Storage';
import SecurityIcon from '@material-ui/icons/Security';
import SyncIcon from '@material-ui/icons/Sync';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import CodeIcon from '@material-ui/icons/Code';
import VerifiedUserIcon from '@material-ui/icons/VerifiedUser';
import DevicesOtherIcon from '@material-ui/icons/DevicesOther';
import AccountTreeIcon from '@material-ui/icons/AccountTree';
import ViewModuleIcon from '@material-ui/icons/ViewModule';
import { useNavigate } from 'react-router-dom';
import { useQuickstart, QuickstartItem } from './QuickstartContext';
import { CHROME_TOP } from '../IaPrototype';

const PANEL_WIDTH = 380;

const useStyles = makeStyles(theme => ({
  panel: {
    position: 'fixed',
    top: CHROME_TOP,
    right: 0,
    bottom: 0,
    width: PANEL_WIDTH,
    zIndex: theme.zIndex.drawer + 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.paper,
    borderLeft: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.shadows[8],
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(2, 2.5),
    gap: theme.spacing(1),
    flexShrink: 0,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor:
      theme.palette.type === 'dark'
        ? theme.palette.grey[800]
        : theme.palette.grey[100],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    fontWeight: 600,
    fontSize: 15,
    flex: 1,
    lineHeight: 1.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    lineHeight: 1.3,
  },
  closeButton: {
    opacity: 0.6,
    '&:hover': { opacity: 1 },
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: theme.spacing(0, 2.5, 2),
  },
  itemContainer: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    marginBottom: theme.spacing(1),
    overflow: 'hidden',
    transition: 'border-color 200ms',
    '&:hover': {
      borderColor: theme.palette.primary.light,
    },
  },
  itemContainerCompleted: {
    borderColor: 'transparent',
    backgroundColor:
      theme.palette.type === 'dark'
        ? 'rgba(99, 153, 61, 0.08)'
        : 'rgba(99, 153, 61, 0.05)',
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5, 2),
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  itemIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: 16,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: 600,
    flex: 1,
  },
  itemTitleCompleted: {
    textDecoration: 'line-through',
    opacity: 0.6,
  },
  expandIcon: {
    fontSize: 18,
    color: theme.palette.text.secondary,
  },
  itemBody: {
    padding: theme.spacing(0, 2, 2),
  },
  itemDescription: {
    fontSize: 13,
    lineHeight: 1.6,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1.5),
  },
  ctaButton: {
    textTransform: 'none',
    fontWeight: 500,
    fontSize: 13,
  },
  markDoneButton: {
    textTransform: 'none',
    fontWeight: 500,
    fontSize: 12,
    marginLeft: theme.spacing(1),
  },
  footer: {
    padding: theme.spacing(1.5, 2.5),
    borderTop: `1px solid ${theme.palette.divider}`,
    flexShrink: 0,
  },
  progressRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(0.5),
  },
  progressText: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    fontWeight: 500,
  },
  progressBar: {
    borderRadius: 4,
    height: 6,
    backgroundColor:
      theme.palette.type === 'dark'
        ? theme.palette.grey[800]
        : theme.palette.grey[200],
  },
  progressBarFill: {
    borderRadius: 4,
    backgroundColor: '#63993D',
  },
  hideButton: {
    textTransform: 'none',
    fontWeight: 500,
    fontSize: 13,
    marginTop: theme.spacing(1),
  },
}));

const iconMap: Record<string, typeof SettingsIcon> = {
  aap: SettingsIcon,
  auth: LockIcon,
  registry: StorageIcon,
  scm: CodeIcon,
  rbac: SecurityIcon,
  sync: SyncIcon,
  play: PlayArrowIcon,
  develop: CodeIcon,
  compliance: VerifiedUserIcon,
  edge: DevicesOtherIcon,
  orchestrator: AccountTreeIcon,
  experiences: ViewModuleIcon,
};

const iconColorMap: Record<string, string> = {
  aap: '#ee0000',
  auth: '#0066CC',
  registry: '#6753AC',
  scm: '#24292e',
  rbac: '#C9190B',
  sync: '#009596',
  play: '#0066CC',
  develop: '#3D1C7C',
  compliance: '#C9190B',
  edge: '#009596',
  orchestrator: '#6753AC',
  experiences: '#151515',
};

const QuickstartItemRow = ({ item }: { item: QuickstartItem }) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { toggleItem, isCompleted, close } = useQuickstart();
  const [expanded, setExpanded] = useState(false);
  const completed = isCompleted(item.id);

  const IconComponent = iconMap[item.icon] || SettingsIcon;
  const iconBg = iconColorMap[item.icon] || '#757575';

  return (
    <Box
      className={`${classes.itemContainer} ${completed ? classes.itemContainerCompleted : ''}`}
    >
      <Box
        className={classes.itemHeader}
        onClick={() => setExpanded(prev => !prev)}
      >
        {completed ? (
          <CheckCircleIcon style={{ fontSize: 20, color: '#63993D' }} />
        ) : (
          <Box
            className={classes.itemIcon}
            style={{ backgroundColor: iconBg, color: '#fff' }}
          >
            <IconComponent style={{ fontSize: 16 }} />
          </Box>
        )}
        <Typography
          className={`${classes.itemTitle} ${completed ? classes.itemTitleCompleted : ''}`}
        >
          {item.title}
        </Typography>
        {expanded ? (
          <ExpandLessIcon className={classes.expandIcon} />
        ) : (
          <ExpandMoreIcon className={classes.expandIcon} />
        )}
      </Box>
      <Collapse in={expanded}>
        <Box className={classes.itemBody}>
          <Typography className={classes.itemDescription}>
            {item.description}
          </Typography>
          <Box display="flex" alignItems="center">
            {item.cta && (
              <Button
                variant="outlined"
                color="primary"
                size="small"
                className={classes.ctaButton}
                onClick={() => {
                  close();
                  navigate(item.cta!.link);
                }}
              >
                {item.cta.text}
              </Button>
            )}
            <Button
              size="small"
              className={classes.markDoneButton}
              startIcon={
                completed ? (
                  <CheckCircleIcon style={{ fontSize: 14, color: '#63993D' }} />
                ) : (
                  <RadioButtonUncheckedIcon style={{ fontSize: 14 }} />
                )
              }
              onClick={() => toggleItem(item.id)}
            >
              {completed ? 'Completed' : 'Mark as done'}
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export const QuickstartPanel = () => {
  const classes = useStyles();
  const { isOpen, items, progress, close, isCompleted: isItemCompleted } = useQuickstart();

  if (items.length === 0) return null;

  return (
    <Slide direction="left" in={isOpen} mountOnEnter unmountOnExit>
      <Box className={classes.panel}>
        <Box className={classes.header}>
          <Box className={classes.headerIcon}>
            <CheckCircleOutlineIcon
              style={{ fontSize: 20, color: '#63993D' }}
            />
          </Box>
          <Box flex={1}>
            <Typography className={classes.headerTitle}>
              Quick start
            </Typography>
            <Typography className={classes.headerSubtitle}>
              Platform steps after connecting Ansible Automation Platform.
              Experience setup is on the Bridge and in Administration →
              Experiences.
            </Typography>
          </Box>
          <Tooltip title="Close" arrow>
            <IconButton
              size="small"
              onClick={close}
              className={classes.closeButton}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider />

        <Box className={classes.content}>
          <Box style={{ paddingTop: 16 }}>
            {items.map(item => (
              <QuickstartItemRow key={item.id} item={item} />
            ))}
          </Box>
        </Box>

        <Box className={classes.footer}>
          <Box className={classes.progressRow}>
            <Typography className={classes.progressText}>
              {progress}% complete
            </Typography>
            <Typography className={classes.progressText}>
              {items.filter(i => !isItemCompleted(i.id)).length} remaining
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            classes={{
              root: classes.progressBar,
              bar: classes.progressBarFill,
            }}
          />
          <Button
            fullWidth
            size="small"
            className={classes.hideButton}
            onClick={close}
          >
            Hide
          </Button>
        </Box>
      </Box>
    </Slide>
  );
};
