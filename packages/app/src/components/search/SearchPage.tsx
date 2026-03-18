import { useState, useMemo } from 'react';
import {
  Page,
  Header,
  Content,
  Table,
  TableColumn,
} from '@backstage/core-components';
import {
  Box,
  Typography,
  InputBase,
  Chip,
  makeStyles,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import ExtensionIcon from '@material-ui/icons/Extension';
import ViewModuleIcon from '@material-ui/icons/ViewModule';
import CategoryOutlinedIcon from '@material-ui/icons/CategoryOutlined';
import DescriptionOutlinedIcon from '@material-ui/icons/DescriptionOutlined';
import { CatalogFilterLayout } from '@backstage/plugin-catalog-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  SEARCH_CATALOG,
  KIND_LABELS,
  SearchResultItem,
  SearchResultKind,
} from './searchDemoData';

const KIND_ICONS: Record<SearchResultKind, React.ReactElement> = {
  project: <FolderOpenIcon style={{ fontSize: 18 }} />,
  collection: <ExtensionIcon style={{ fontSize: 18 }} />,
  ee: <ViewModuleIcon style={{ fontSize: 18 }} />,
  template: <CategoryOutlinedIcon style={{ fontSize: 18 }} />,
  documentation: <DescriptionOutlinedIcon style={{ fontSize: 18 }} />,
};

const useStyles = makeStyles(theme => ({
  searchInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1.5, 2),
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(3),
    gap: theme.spacing(1),
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchIcon: {
    color: theme.palette.text.disabled,
  },
  filterLabel: {
    marginTop: theme.spacing(2),
    fontWeight: 600,
    fontSize: '0.875rem',
    '&:first-child': {
      marginTop: 0,
    },
  },
  filterChipGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(0.5),
  },
  filterChip: {
    justifyContent: 'flex-start',
    fontSize: 13,
    cursor: 'pointer',
    width: '100%',
  },
  filterChipActive: {
    backgroundColor: theme.palette.primary.main,
    color: '#fff',
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  resultRow: {
    cursor: 'pointer',
  },
  resultTitle: {
    fontWeight: 500,
    fontSize: 14,
  },
  resultDesc: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    lineHeight: 1.4,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
    maxWidth: 400,
  },
  resultKindBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    fontSize: 13,
  },
  resultTags: {
    display: 'flex',
    gap: theme.spacing(0.5),
    flexWrap: 'wrap' as const,
  },
  resultTag: {
    fontSize: 10,
    height: 20,
  },
  summaryStrip: {
    display: 'flex',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  summaryChip: {
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
  },
  summaryChipActive: {
    backgroundColor: theme.palette.primary.main,
    color: '#fff',
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: theme.spacing(8, 2),
  },
  emptyIcon: {
    fontSize: 48,
    opacity: 0.2,
    marginBottom: theme.spacing(2),
  },
}));

const ALL_KINDS: SearchResultKind[] = [
  'project',
  'collection',
  'ee',
  'template',
  'documentation',
];

const ALL_SOURCES = [
  'GitHub',
  'Private Automation Hub',
  'Public Registries',
];

export const SearchPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQuery = searchParams.get('query') ?? '';
  const initialKind = searchParams.get('kind') as SearchResultKind | null;

  const [query, setQuery] = useState(initialQuery);
  const [kindFilter, setKindFilter] = useState<SearchResultKind | 'all'>(
    initialKind ?? 'all',
  );
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return SEARCH_CATALOG.filter(item => {
      if (kindFilter !== 'all' && item.kind !== kindFilter) return false;
      if (sourceFilter !== 'all' && item.source !== sourceFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.tags.some(t => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [query, kindFilter, sourceFilter]);

  const kindCounts = useMemo(() => {
    const base = SEARCH_CATALOG.filter(item => {
      if (sourceFilter !== 'all' && item.source !== sourceFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.tags.some(t => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
    const counts: Partial<Record<SearchResultKind, number>> = {};
    for (const item of base) {
      counts[item.kind] = (counts[item.kind] ?? 0) + 1;
    }
    return counts;
  }, [query, sourceFilter]);

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    const params = new URLSearchParams(searchParams);
    if (newQuery.trim()) {
      params.set('query', newQuery);
    } else {
      params.delete('query');
    }
    setSearchParams(params, { replace: true });
  };

  const handleKindChange = (kind: SearchResultKind | 'all') => {
    setKindFilter(kind);
    const params = new URLSearchParams(searchParams);
    if (kind !== 'all') {
      params.set('kind', kind);
    } else {
      params.delete('kind');
    }
    setSearchParams(params, { replace: true });
  };

  const columns: TableColumn<SearchResultItem>[] = [
    {
      title: 'Name',
      field: 'title',
      render: (row: SearchResultItem) => (
        <Typography className={classes.resultTitle}>{row.title}</Typography>
      ),
    },
    {
      title: 'Type',
      field: 'kind',
      render: (row: SearchResultItem) => (
        <Box className={classes.resultKindBadge}>
          {KIND_ICONS[row.kind]}
          <Typography variant="body2">{KIND_LABELS[row.kind]}</Typography>
        </Box>
      ),
    },
    {
      title: 'Description',
      field: 'description',
      sorting: false,
      render: (row: SearchResultItem) => (
        <Typography className={classes.resultDesc}>
          {row.description}
        </Typography>
      ),
    },
    {
      title: 'Source',
      field: 'source',
      render: (row: SearchResultItem) => (
        <Typography variant="body2" color="textSecondary">
          {row.source ?? '—'}
        </Typography>
      ),
    },
    {
      title: 'Tags',
      field: 'tags',
      sorting: false,
      render: (row: SearchResultItem) => (
        <Box className={classes.resultTags}>
          {row.tags.slice(0, 3).map(tag => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              variant="outlined"
              className={classes.resultTag}
            />
          ))}
        </Box>
      ),
    },
    {
      title: 'Updated',
      field: 'lastUpdated',
      render: (row: SearchResultItem) => (
        <Typography variant="body2" color="textSecondary" style={{ fontSize: 13 }}>
          {row.lastUpdated ?? '—'}
        </Typography>
      ),
    },
  ];

  return (
    <Page themeId="app">
      <Header
        title="Search"
        subtitle="Find projects, collections, execution environments, templates, and documentation"
      />
      <Content>
        <Box className={classes.searchInputWrapper}>
          <SearchIcon className={classes.searchIcon} />
          <InputBase
            className={classes.searchInput}
            placeholder="Search by name, description, or tag..."
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            autoFocus
          />
          {query && (
            <Typography variant="body2" color="textSecondary" style={{ flexShrink: 0 }}>
              {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
            </Typography>
          )}
        </Box>

        <CatalogFilterLayout>
          <CatalogFilterLayout.Filters>
            <Typography className={classes.filterLabel}>Type</Typography>
            <Box className={classes.filterChipGroup}>
              <Chip
                label={`All (${Object.values(kindCounts).reduce((a, b) => a + (b ?? 0), 0)})`}
                size="small"
                variant={kindFilter === 'all' ? 'default' : 'outlined'}
                className={`${classes.filterChip} ${kindFilter === 'all' ? classes.filterChipActive : ''}`}
                onClick={() => handleKindChange('all')}
              />
              {ALL_KINDS.map(kind => {
                const count = kindCounts[kind] ?? 0;
                return (
                  <Chip
                    key={kind}
                    icon={KIND_ICONS[kind]}
                    label={`${KIND_LABELS[kind]} (${count})`}
                    size="small"
                    variant={kindFilter === kind ? 'default' : 'outlined'}
                    className={`${classes.filterChip} ${kindFilter === kind ? classes.filterChipActive : ''}`}
                    onClick={() => handleKindChange(kind)}
                  />
                );
              })}
            </Box>

            <Typography className={classes.filterLabel}>Source</Typography>
            <Box className={classes.filterChipGroup}>
              <Chip
                label="All"
                size="small"
                variant={sourceFilter === 'all' ? 'default' : 'outlined'}
                className={`${classes.filterChip} ${sourceFilter === 'all' ? classes.filterChipActive : ''}`}
                onClick={() => setSourceFilter('all')}
              />
              {ALL_SOURCES.map(source => (
                <Chip
                  key={source}
                  label={source}
                  size="small"
                  variant={sourceFilter === source ? 'default' : 'outlined'}
                  className={`${classes.filterChip} ${sourceFilter === source ? classes.filterChipActive : ''}`}
                  onClick={() =>
                    setSourceFilter(prev =>
                      prev === source ? 'all' : source,
                    )
                  }
                />
              ))}
            </Box>
          </CatalogFilterLayout.Filters>

          <CatalogFilterLayout.Content>
            {filtered.length > 0 ? (
              <>
                <Box className={classes.summaryStrip}>
                  {ALL_KINDS.filter(k => (kindCounts[k] ?? 0) > 0).map(
                    kind => (
                      <Chip
                        key={kind}
                        icon={KIND_ICONS[kind]}
                        label={`${kindCounts[kind]} ${KIND_LABELS[kind]}`}
                        size="small"
                        variant={kindFilter === kind ? 'default' : 'outlined'}
                        className={`${classes.summaryChip} ${kindFilter === kind ? classes.summaryChipActive : ''}`}
                        onClick={() =>
                          handleKindChange(
                            kindFilter === kind ? 'all' : kind,
                          )
                        }
                      />
                    ),
                  )}
                </Box>

                <Table<SearchResultItem>
                  columns={columns}
                  data={filtered}
                  title={`${filtered.length} ${filtered.length === 1 ? 'result' : 'results'}`}
                  options={{
                    paging: filtered.length > 20,
                    pageSize: 20,
                    pageSizeOptions: [10, 20, 50],
                    emptyRowsWhenPaging: false,
                    search: false,
                    sorting: true,
                    padding: 'dense',
                    rowStyle: { cursor: 'pointer' },
                  }}
                  style={{ width: '100%', overflowX: 'hidden' }}
                  onRowClick={(_event, rowData) => {
                    if (rowData) {
                      navigate((rowData as SearchResultItem).url);
                    }
                  }}
                />
              </>
            ) : (
              <Box className={classes.emptyState}>
                <SearchIcon className={classes.emptyIcon} />
                <Typography variant="h6" gutterBottom>
                  {query.trim()
                    ? `No results for "${query}"`
                    : 'Start typing to search'}
                </Typography>
                <Typography color="textSecondary">
                  {query.trim()
                    ? 'Try different keywords or adjust your filters'
                    : 'Search across projects, collections, execution environments, and more'}
                </Typography>
              </Box>
            )}
          </CatalogFilterLayout.Content>
        </CatalogFilterLayout>
      </Content>
    </Page>
  );
};
