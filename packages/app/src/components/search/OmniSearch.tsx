import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  InputBase,
  Paper,
  Popper,
  ClickAwayListener,
  Divider,
  Chip,
  makeStyles,
  alpha,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import HistoryIcon from '@material-ui/icons/History';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import ExtensionIcon from '@material-ui/icons/Extension';
import ViewModuleIcon from '@material-ui/icons/ViewModule';
import DescriptionOutlinedIcon from '@material-ui/icons/DescriptionOutlined';
import CategoryOutlinedIcon from '@material-ui/icons/CategoryOutlined';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import { useNavigate } from 'react-router-dom';
import {
  SEARCH_CATALOG,
  RECENT_SEARCHES,
  KIND_LABELS,
  KIND_URLS,
  SearchResultItem,
  SearchResultKind,
} from './searchDemoData';

const KIND_ICONS: Record<SearchResultKind, React.ReactElement> = {
  project: <FolderOpenIcon style={{ fontSize: 16 }} />,
  collection: <ExtensionIcon style={{ fontSize: 16 }} />,
  ee: <ViewModuleIcon style={{ fontSize: 16 }} />,
  template: <CategoryOutlinedIcon style={{ fontSize: 16 }} />,
  documentation: <DescriptionOutlinedIcon style={{ fontSize: 16 }} />,
};

const useStyles = makeStyles(theme => ({
  searchWrapper: {
    position: 'relative',
    borderRadius: 20,
    backgroundColor: alpha(theme.palette.common.white, 0.1),
    '&:hover': {
      backgroundColor: alpha(theme.palette.common.white, 0.16),
    },
    transition: theme.transitions.create(['background-color']),
    flexShrink: 1,
  },
  searchWrapperFocused: {
    backgroundColor: alpha(theme.palette.common.white, 0.16),
    borderRadius: '20px 20px 4px 4px',
  },
  searchIconWrapper: {
    padding: theme.spacing(0, 1.5),
    height: '100%',
    position: 'absolute' as const,
    pointerEvents: 'none' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
    zIndex: 1,
  },
  inputRoot: {
    color: 'inherit',
    width: '100%',
  },
  inputInput: {
    padding: theme.spacing(1, 2, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(3)}px)`,
    transition: theme.transitions.create('width'),
    width: '26ch',
    fontSize: 13,
    color: 'inherit',
    '&:focus': {
      width: '38ch',
    },
    '&::placeholder': {
      opacity: 0.5,
    },
  },
  popper: {
    zIndex: theme.zIndex.modal + 1,
    width: '100%',
    minWidth: 480,
    maxWidth: 600,
  },
  dropdown: {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: '0 0 8px 8px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    maxHeight: '70vh',
    overflow: 'auto',
  },
  sectionHeader: {
    padding: theme.spacing(1, 2, 0.5),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.8px',
    color: theme.palette.text.secondary,
  },
  sectionViewAll: {
    fontSize: 12,
    color: theme.palette.primary.main,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    fontWeight: 500,
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  resultItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1, 2),
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  resultItemHighlighted: {
    backgroundColor: theme.palette.action.hover,
  },
  resultIcon: {
    marginTop: 2,
    color: theme.palette.text.secondary,
    flexShrink: 0,
  },
  resultContent: {
    flex: 1,
    minWidth: 0,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1.3,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
  },
  resultDesc: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    lineHeight: 1.3,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
  },
  resultMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginTop: 2,
  },
  resultTag: {
    fontSize: 10,
    height: 18,
  },
  recentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(0.75, 2),
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  recentIcon: {
    color: theme.palette.text.disabled,
    fontSize: 16,
  },
  recentText: {
    fontSize: 13,
    color: theme.palette.text.secondary,
  },
  browseItem: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(0.75, 2),
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  browseIcon: {
    color: theme.palette.text.secondary,
    fontSize: 16,
  },
  browseText: {
    fontSize: 13,
    fontWeight: 500,
  },
  footer: {
    padding: theme.spacing(1, 2),
    borderTop: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLink: {
    fontSize: 12,
    color: theme.palette.primary.main,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontWeight: 500,
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  kindChip: {
    fontSize: 10,
    height: 18,
    fontWeight: 500,
  },
  noResults: {
    padding: theme.spacing(3, 2),
    textAlign: 'center' as const,
    color: theme.palette.text.secondary,
  },
}));

const BROWSE_LINKS: { kind: SearchResultKind; label: string }[] = [
  { kind: 'project', label: 'All Projects' },
  { kind: 'collection', label: 'All Collections' },
  { kind: 'ee', label: 'All Execution Environments' },
  { kind: 'template', label: 'All Templates' },
];

export const OmniSearch = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return SEARCH_CATALOG.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q)),
    );
  }, [query]);

  const groupedResults = useMemo(() => {
    const groups: Partial<Record<SearchResultKind, SearchResultItem[]>> = {};
    for (const item of searchResults) {
      if (!groups[item.kind]) groups[item.kind] = [];
      groups[item.kind]!.push(item);
    }
    return groups;
  }, [searchResults]);

  const flatResults = useMemo(() => {
    const flat: { type: 'result'; item: SearchResultItem }[] = [];
    for (const kind of Object.keys(groupedResults) as SearchResultKind[]) {
      const items = groupedResults[kind]!.slice(0, 3);
      for (const item of items) {
        flat.push({ type: 'result', item });
      }
    }
    return flat;
  }, [groupedResults]);

  const handleSelect = useCallback(
    (url: string) => {
      setIsOpen(false);
      setQuery('');
      navigate(url);
    },
    [navigate],
  );

  const handleSearchSubmit = useCallback(() => {
    if (query.trim()) {
      setIsOpen(false);
      navigate(`/search?query=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  }, [query, navigate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
        return;
      }
      if (e.key === 'Enter') {
        if (highlightedIndex >= 0 && highlightedIndex < flatResults.length) {
          e.preventDefault();
          handleSelect(flatResults[highlightedIndex].item.url);
        } else {
          handleSearchSubmit();
        }
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < flatResults.length - 1 ? prev + 1 : 0,
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : flatResults.length - 1,
        );
      }
    },
    [flatResults, highlightedIndex, handleSelect, handleSearchSubmit],
  );

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [query]);

  const hasQuery = query.trim().length > 0;
  const hasResults = searchResults.length > 0;

  return (
    <ClickAwayListener onClickAway={() => setIsOpen(false)}>
      <div
        ref={anchorRef}
        className={`${classes.searchWrapper} ${isOpen ? classes.searchWrapperFocused : ''}`}
      >
        <div className={classes.searchIconWrapper}>
          <SearchIcon fontSize="small" />
        </div>
        <InputBase
          inputRef={inputRef}
          placeholder="Search projects, collections, EEs, docs..."
          classes={{ root: classes.inputRoot, input: classes.inputInput }}
          inputProps={{ 'aria-label': 'search' }}
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />

        <Popper
          open={isOpen}
          anchorEl={anchorRef.current}
          placement="bottom-start"
          className={classes.popper}
          style={{ width: anchorRef.current?.offsetWidth }}
          modifiers={{
            flip: { enabled: false },
            preventOverflow: { enabled: true, boundariesElement: 'viewport' },
          }}
        >
          <Paper className={classes.dropdown} elevation={0}>
            {!hasQuery && (
              <>
                {RECENT_SEARCHES.length > 0 && (
                  <>
                    <Box className={classes.sectionHeader}>
                      <Typography className={classes.sectionTitle}>
                        Recent searches
                      </Typography>
                    </Box>
                    {RECENT_SEARCHES.map(term => (
                      <Box
                        key={term}
                        className={classes.recentItem}
                        onClick={() => {
                          setQuery(term);
                        }}
                      >
                        <HistoryIcon className={classes.recentIcon} />
                        <Typography className={classes.recentText}>
                          {term}
                        </Typography>
                      </Box>
                    ))}
                    <Divider style={{ margin: '4px 0' }} />
                  </>
                )}
                <Box className={classes.sectionHeader}>
                  <Typography className={classes.sectionTitle}>
                    Browse
                  </Typography>
                </Box>
                {BROWSE_LINKS.map(link => (
                  <Box
                    key={link.kind}
                    className={classes.browseItem}
                    onClick={() => handleSelect(KIND_URLS[link.kind])}
                  >
                    <span className={classes.browseIcon}>
                      {KIND_ICONS[link.kind]}
                    </span>
                    <Typography className={classes.browseText}>
                      {link.label}
                    </Typography>
                  </Box>
                ))}
                <Box className={classes.footer}>
                  <Typography
                    className={classes.footerLink}
                    onClick={() => handleSelect('/search')}
                  >
                    Open full search
                    <ArrowForwardIcon style={{ fontSize: 14 }} />
                  </Typography>
                </Box>
              </>
            )}

            {hasQuery && !hasResults && (
              <Box className={classes.noResults}>
                <Typography variant="body2">
                  No results for &ldquo;{query}&rdquo;
                </Typography>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  style={{ marginTop: 4, display: 'block' }}
                >
                  Try different keywords or browse by category
                </Typography>
              </Box>
            )}

            {hasQuery && hasResults && (
              <>
                {(Object.keys(groupedResults) as SearchResultKind[]).map(
                  (kind, groupIdx, allKinds) => {
                    const items = groupedResults[kind]!;
                    const displayItems = items.slice(0, 3);
                    const totalForKind = items.length;

                    return (
                      <Box key={kind}>
                        <Box className={classes.sectionHeader}>
                          <Typography className={classes.sectionTitle}>
                            {KIND_LABELS[kind]} ({totalForKind})
                          </Typography>
                          {totalForKind > 3 && (
                            <Typography
                              className={classes.sectionViewAll}
                              onClick={() => {
                                setIsOpen(false);
                                setQuery('');
                                navigate(
                                  `/search?query=${encodeURIComponent(query)}&kind=${kind}`,
                                );
                              }}
                            >
                              View all
                              <ArrowForwardIcon style={{ fontSize: 12 }} />
                            </Typography>
                          )}
                        </Box>
                        {displayItems.map(item => {
                          const flatIdx = flatResults.findIndex(
                            f => f.item.id === item.id,
                          );
                          return (
                            <Box
                              key={item.id}
                              className={`${classes.resultItem} ${flatIdx === highlightedIndex ? classes.resultItemHighlighted : ''}`}
                              onClick={() => handleSelect(item.url)}
                            >
                              <span className={classes.resultIcon}>
                                {KIND_ICONS[item.kind]}
                              </span>
                              <Box className={classes.resultContent}>
                                <Typography className={classes.resultTitle}>
                                  {item.title}
                                </Typography>
                                <Typography className={classes.resultDesc}>
                                  {item.description}
                                </Typography>
                                <Box className={classes.resultMeta}>
                                  {item.tags.slice(0, 3).map(tag => (
                                    <Chip
                                      key={tag}
                                      label={tag}
                                      size="small"
                                      variant="outlined"
                                      className={classes.resultTag}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            </Box>
                          );
                        })}
                        {groupIdx < allKinds.length - 1 && (
                          <Divider style={{ margin: '4px 0' }} />
                        )}
                      </Box>
                    );
                  },
                )}
                <Box className={classes.footer}>
                  <Typography
                    className={classes.footerLink}
                    onClick={() => {
                      setIsOpen(false);
                      navigate(
                        `/search?query=${encodeURIComponent(query)}`,
                      );
                      setQuery('');
                    }}
                  >
                    See all {searchResults.length} results
                    <ArrowForwardIcon style={{ fontSize: 14 }} />
                  </Typography>
                </Box>
              </>
            )}
          </Paper>
        </Popper>
      </div>
    </ClickAwayListener>
  );
};
