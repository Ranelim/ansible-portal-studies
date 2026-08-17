import { makeStyles } from '@material-ui/core/styles';

export const useProjectDetailStyles = makeStyles(theme => ({
  breadcrumbs: {
    marginBottom: theme.spacing(1),
    '& a': {
      color: theme.palette.primary.main,
      textDecoration: 'none',
      fontSize: 14,
      '&:hover': {
        textDecoration: 'underline',
      },
    },
    '& .MuiBreadcrumbs-separator': {
      fontSize: 14,
    },
  },
  breadcrumbCurrent: {
    fontSize: 14,
    color: theme.palette.text.secondary,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(0.5),
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
  },
  titleText: {
    fontWeight: 700,
    fontSize: '1.75rem',
  },
  subtitle: {
    color: theme.palette.text.secondary,
    fontSize: 14,
    marginBottom: theme.spacing(1.5),
  },
  chipsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  /** Pad custom chrome when Content is noPadding so HeaderTabs can span the page column. */
  detailHeader: {
    paddingLeft: 'var(--portal-page-gutter, 32px)',
    paddingRight: 'var(--portal-page-gutter, 32px)',
    paddingTop: theme.spacing(3),
  },
  detailBody: {
    paddingLeft: 'var(--portal-page-gutter, 32px)',
    paddingRight: 'var(--portal-page-gutter, 32px)',
    paddingBottom: theme.spacing(3),
  },
  tabsHost: {
    borderBottom: `1px solid ${theme.palette.divider}`,
    '& .MuiTabs-scrollButtons': {
      display: 'none',
    },
    '& .MuiTabs-flexContainer': {
      overflow: 'visible',
    },
    '& .MuiTabs-indicator': {
      height: 3,
    },
  },
  tabContent: {
    display: 'flex',
    gap: theme.spacing(3),
    marginTop: theme.spacing(3),
    alignItems: 'flex-start',
  },
  mainColumn: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
  },
  sidebarColumn: {
    width: 340,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
  },
  card: {
    borderRadius: 12,
    border: `1px solid ${theme.palette.divider}`,
  },
  cardContent: {
    padding: theme.spacing(2.5),
  },
  cardTitle: {
    fontWeight: 600,
    fontSize: '1.25rem',
    marginBottom: theme.spacing(2),
  },
  cardSection: {
    marginTop: theme.spacing(2),
  },
  cardLabel: {
    color: theme.palette.text.secondary,
    fontWeight: 600,
    fontSize: '0.75rem',
    textTransform: 'uppercase' as const,
    marginBottom: theme.spacing(0.5),
    letterSpacing: '0.5px',
  },
  cardValue: {
    fontSize: '0.875rem',
    wordBreak: 'break-word' as const,
  },
  cardDivider: {
    margin: theme.spacing(2, -2.5),
  },
  sourceLink: {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    fontSize: '0.875rem',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  sourceLinkIcon: {
    fontSize: '0.875rem',
    flexShrink: 0,
  },
  maturityContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(1),
  },
  maturityStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  maturityLabel: {
    fontSize: 11,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
    textAlign: 'center' as const,
    lineHeight: 1.3,
    maxWidth: 80,
  },
  maturityConnector: {
    flex: 1,
    height: 2,
    minWidth: 12,
    alignSelf: 'center',
    marginTop: -10,
  },
  activityItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5, 0),
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  activityText: {
    fontSize: 13,
    flex: 1,
  },
  activityTime: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    flexShrink: 0,
  },
  pipelineStageRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 1.5),
    borderRadius: 4,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  pipelineStageExpanded: {
    backgroundColor: theme.palette.action.selected,
  },
  pipelineExpandedContent: {
    padding: theme.spacing(0.5, 1.5, 1.5, 5),
  },
  stageName: {
    fontSize: 13,
    flex: 1,
  },
  stageDuration: {
    color: theme.palette.text.secondary,
    fontSize: 12,
    flexShrink: 0,
  },
  expandIcon: {
    fontSize: 16,
    color: theme.palette.text.secondary,
  },
  stageDescription: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    lineHeight: 1.5,
    marginBottom: theme.spacing(0.5),
  },
  stageDetail: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    fontStyle: 'italic',
    marginBottom: theme.spacing(0.5),
  },
  viewLogLink: {
    fontSize: 11,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
  },
  historyTable: {
    '& th': {
      fontWeight: 600,
      fontSize: 12,
      textTransform: 'uppercase' as const,
    },
  },
  statusChip: {
    fontWeight: 500,
    fontSize: 12,
  },
  resourceItem: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1.5),
    borderRadius: 8,
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  resourceIcon: {
    marginRight: theme.spacing(1.5),
    color: theme.palette.primary.main,
    fontSize: '1.25rem',
  },
  resourceName: {
    fontWeight: 500,
    fontSize: 14,
  },
  resourcePath: {
    fontSize: 12,
    color: theme.palette.text.secondary,
  },
  resourceTypeChip: {
    marginLeft: 'auto',
    fontSize: 11,
    height: 24,
  },
  linksCard: {
    borderRadius: 12,
    border: `1px solid ${theme.palette.divider}`,
  },
  linkItem: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(0.5),
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    textDecoration: 'none',
    color: 'inherit',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '&:last-child': {
      marginBottom: 0,
    },
  },
  linkIcon: {
    marginRight: theme.spacing(1.5),
    color: theme.palette.primary.main,
    fontSize: '1.25rem',
  },
  linkText: {
    fontWeight: 500,
    fontSize: 14,
  },
  linkDescription: {
    fontSize: '0.8rem',
    color: theme.palette.text.secondary,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
  },
  summaryCard: {
    padding: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: theme.spacing(0.5),
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 500,
  },
  '@keyframes spin': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  spinIcon: {
    animation: '$spin 1.5s linear infinite',
  },
}));
