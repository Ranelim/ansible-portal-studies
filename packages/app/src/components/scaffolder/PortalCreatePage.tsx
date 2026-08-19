import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Content, Header, ItemCardGrid, Page } from '@backstage/core-components';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Tooltip,
  makeStyles,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import ClearIcon from '@material-ui/icons/Clear';
import CancelIcon from '@material-ui/icons/Cancel';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import MoreVertIcon from '@material-ui/icons/MoreVert';

const DEMO_TEMPLATES = [
  {
    name: 'create-playbook-project',
    title: 'Ansible Playbook Project',
    type: 'Git repository',
    owner: 'platform-engineering',
    description:
      'Scaffold a general-purpose Ansible playbook repository with a standard directory structure, role scaffolding, inventory layout, and CI linting pipeline.',
    tags: ['ansible', 'playbook', 'starter'],
  },
  {
    name: 'create-cloud-provisioning-project',
    title: 'Cloud Provisioning Project',
    type: 'Git repository',
    owner: 'platform-engineering',
    description:
      'Scaffold an automation repository for cloud infrastructure provisioning. Includes cloud collections, credential structure, and dynamic inventory plugins.',
    tags: ['ansible', 'cloud', 'aws', 'azure'],
  },
  {
    name: 'create-network-automation-project',
    title: 'Network Automation Project',
    type: 'Git repository',
    owner: 'network-operations',
    description:
      'Scaffold an automation repository for network device configuration and compliance. Pre-configured with collections for Cisco, Juniper, or Arista platforms.',
    tags: ['ansible', 'network', 'cisco'],
  },
  {
    name: 'aws-provisioning-workflow',
    title: 'AWS Provisioning Workflow',
    type: 'Workflow template',
    owner: 'cloud-operations',
    description:
      'Run a multi-step workflow that provisions AWS infrastructure, configures servers, and validates the deployment. Includes an approval step before production changes.',
    tags: ['aws', 'provisioning', 'cloud-ops'],
    requiresApproval: true,
  },
  {
    name: 'deploy-database-update',
    title: 'Deploy Database Update',
    type: 'Job template',
    owner: 'platform-engineering',
    description:
      'Run a job to apply database schema updates and data migrations. Validates the migration plan before executing changes.',
    tags: ['database', 'deployment', 'migration'],
  },
  {
    name: 'rhel-server-patching',
    title: 'RHEL Server Patching',
    type: 'Job template',
    owner: 'platform-engineering',
    description:
      'Apply the latest security and OS patches to target RHEL servers. Select the environment, patch window, and reboot policy.',
    tags: ['rhel', 'patching', 'security'],
  },
];

const useStyles = makeStyles(theme => ({
  filterBand: {
    marginBottom: theme.spacing(2.5),
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    flexWrap: 'wrap',
  },
  searchField: {
    flex: '1 1 240px',
    maxWidth: 360,
  },
  typeFilter: {
    minWidth: 180,
  },
  ownerFilter: {
    minWidth: 200,
  },
  activeFiltersRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    paddingTop: theme.spacing(1),
    flexWrap: 'wrap' as const,
  },
  activeChip: {
    borderRadius: 16,
    textTransform: 'none' as const,
    fontSize: 12,
  },
  card: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    transition: 'box-shadow 0.2s ease',
    '&:hover': { boxShadow: theme.shadows[4] },
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.spacing(2, 2, 0),
  },
  typeBadge: {
    fontSize: 11,
    fontWeight: 600,
    height: 22,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    marginLeft: theme.spacing(1),
    flexShrink: 0,
  },
  smallIconBtn: { padding: 4 },
  cardContent: { flex: '0 0 auto', padding: theme.spacing(1.5, 2, 1) },
  title: {
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 1.3,
    marginBottom: theme.spacing(0.5),
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.primary.main,
      textDecoration: 'underline',
    },
  },
  description: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: theme.spacing(0.5),
    padding: theme.spacing(0, 2, 1),
  },
  tag: { fontSize: 11, height: 20 },
  ownerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    padding: theme.spacing(0, 2, 1),
    fontSize: 12,
    color: theme.palette.text.secondary,
  },
  actions: {
    padding: theme.spacing(0, 2, 2),
    justifyContent: 'flex-start',
    marginTop: 'auto',
  },
  useButton: {
    textTransform: 'none' as const,
    fontWeight: 600,
    borderRadius: 20,
    paddingLeft: theme.spacing(2.5),
    paddingRight: theme.spacing(2.5),
  },
}));

/**
 * Masthead Create catalog — demo templates (local catalog is empty).
 * Filters match Portal lists (Git Repositories): toolbar above the grid, not
 * Backstage Scaffolder's left catalog filter rail.
 */
export const PortalCreatePage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { search } = useLocation();
  const experienceScoped =
    new URLSearchParams(search).get('scope') === 'experience';
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');

  const types = useMemo(
    () => Array.from(new Set(DEMO_TEMPLATES.map(t => t.type))).sort(),
    [],
  );
  const owners = useMemo(
    () => Array.from(new Set(DEMO_TEMPLATES.map(t => t.owner))).sort(),
    [],
  );

  const filteredTemplates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DEMO_TEMPLATES.filter(t => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (ownerFilter !== 'all' && t.owner !== ownerFilter) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q)) ||
        t.owner.toLowerCase().includes(q)
      );
    });
  }, [ownerFilter, query, typeFilter]);

  const filterLabels: { key: 'type' | 'owner'; label: string; value: string }[] =
    [];
  if (typeFilter !== 'all') {
    filterLabels.push({ key: 'type', label: 'Type', value: typeFilter });
  }
  if (ownerFilter !== 'all') {
    filterLabels.push({ key: 'owner', label: 'Owner', value: ownerFilter });
  }

  return (
    <Page themeId="home">
      {!experienceScoped && (
        <Header
          title="Create"
          subtitle="Choose a template to create automation content."
          pageTitleOverride="Create"
        />
      )}
      <Content>
        <Box className={classes.filterBand}>
        <Box className={classes.toolbar}>
          <TextField
            className={classes.searchField}
            placeholder="Search templates"
            variant="outlined"
            size="small"
            value={query}
            onChange={e => setQuery(e.target.value)}
            inputProps={{ 'aria-label': 'Search templates' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="disabled" fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: query ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          <FormControl
            variant="outlined"
            size="small"
            className={classes.typeFilter}
          >
            <InputLabel id="create-type-label">Type</InputLabel>
            <Select
              labelId="create-type-label"
              label="Type"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as string)}
            >
              <MenuItem value="all">All</MenuItem>
              {types.map(type => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl
            variant="outlined"
            size="small"
            className={classes.ownerFilter}
          >
            <InputLabel id="create-owner-label">Owner</InputLabel>
            <Select
              labelId="create-owner-label"
              label="Owner"
              value={ownerFilter}
              onChange={e => setOwnerFilter(e.target.value as string)}
            >
              <MenuItem value="all">All</MenuItem>
              {owners.map(owner => (
                <MenuItem key={owner} value={owner}>
                  {owner}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {filterLabels.length > 0 && (
          <Box className={classes.activeFiltersRow}>
            <Typography
              variant="body2"
              color="textSecondary"
              style={{ fontSize: 12 }}
            >
              Active filters:
            </Typography>
            {filterLabels.map(f => (
              <Chip
                key={f.key}
                label={`${f.label}: ${f.value}`}
                size="small"
                onDelete={() =>
                  f.key === 'type' ? setTypeFilter('all') : setOwnerFilter('all')
                }
                deleteIcon={<CancelIcon style={{ fontSize: 16 }} />}
                className={classes.activeChip}
                color="primary"
                variant="outlined"
              />
            ))}
            <Button
              size="small"
              onClick={() => {
                setTypeFilter('all');
                setOwnerFilter('all');
              }}
              style={{ textTransform: 'none', fontSize: 12 }}
            >
              Clear all
            </Button>
          </Box>
        )}
        </Box>

        <ItemCardGrid>
          {filteredTemplates.map(t => (
              <Card key={t.name} className={classes.card} variant="outlined">
                <Box className={classes.cardHeader}>
                  <Chip
                    label={t.type}
                    size="small"
                    variant="outlined"
                    className={classes.typeBadge}
                  />
                  <Box className={classes.headerActions}>
                    <IconButton
                      className={classes.smallIconBtn}
                      size="small"
                      aria-label="Star template"
                    >
                      <StarBorderIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      className={classes.smallIconBtn}
                      size="small"
                      aria-label="Template actions"
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <CardContent className={classes.cardContent}>
                  <Typography
                    className={classes.title}
                    onClick={() =>
                      navigate(`/self-service/catalog/default/${t.name}`)
                    }
                  >
                    {t.title}
                  </Typography>
                  <Typography className={classes.description}>
                    {t.description}
                  </Typography>
                </CardContent>
                <Box className={classes.tags}>
                  {t.requiresApproval && (
                    <Tooltip title="This template includes a step that waits for someone to review and approve before it continues.">
                      <Chip
                        label="requires-approval"
                        size="small"
                        variant="outlined"
                        className={classes.tag}
                        style={{ borderColor: '#f9a825', color: '#f9a825' }}
                      />
                    </Tooltip>
                  )}
                  {t.tags
                    .slice(0, t.requiresApproval ? 4 : 5)
                    .map(tag => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                        className={classes.tag}
                      />
                    ))}
                </Box>
                <Box className={classes.ownerRow}>
                  <span>by</span>
                  <Typography
                    variant="body2"
                    style={{ fontSize: 12, fontWeight: 500 }}
                  >
                    {t.owner}
                  </Typography>
                </Box>
                <CardActions className={classes.actions}>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    className={classes.useButton}
                    onClick={() =>
                      navigate(
                        `/self-service/create/templates/default/${t.name}`,
                      )
                    }
                  >
                    Use template
                  </Button>
                </CardActions>
              </Card>
          ))}
        </ItemCardGrid>
        {filteredTemplates.length === 0 && (
          <Box py={4}>
            <Typography color="textSecondary">
              No templates match the current filters.
            </Typography>
          </Box>
        )}
      </Content>
    </Page>
  );
};
