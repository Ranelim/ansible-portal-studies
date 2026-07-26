import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@material-ui/core';

type CatalogType =
  | 'all'
  | 'repositories'
  | 'collections'
  | 'execution-environments'
  | 'inventories'
  | 'edge-fleets';

type CatalogRow = {
  name: string;
  type: Exclude<CatalogType, 'all'>;
  typeLabel: string;
  status: string;
  /** List / area home for this entity type */
  areaHref: string;
  /** Concrete resource target when we have a Portal route */
  href: string;
};

const ROWS: CatalogRow[] = [
  {
    name: 'acme-corp/rhel-patching',
    type: 'repositories',
    typeLabel: 'Git repository',
    status: '1 critical',
    areaHref: '/self-service/repositories',
    href: '/self-service/repositories/rhel-patching',
  },
  {
    name: 'acme-corp/network-firewall-rules',
    type: 'repositories',
    typeLabel: 'Git repository',
    status: 'Scanning',
    areaHref: '/self-service/repositories',
    href: '/self-service/repositories/network-firewall-rules',
  },
  {
    name: 'ansible.posix',
    type: 'collections',
    typeLabel: 'Collection',
    status: 'Certified',
    areaHref: '/self-service/collections',
    href: '/self-service/collections/ansible.posix',
  },
  {
    name: 'ee-minimal-rhel9',
    type: 'execution-environments',
    typeLabel: 'Execution environment',
    status: 'Ready',
    areaHref: '/self-service/ee',
    href: '/self-service/ee/catalog',
  },
  {
    name: 'prod-datacenter',
    type: 'inventories',
    typeLabel: 'Inventory',
    status: '12 open findings',
    areaHref: '/self-service/inventories',
    href: '/self-service/inventories',
  },
  {
    name: 'retail-stores-eu',
    type: 'inventories',
    typeLabel: 'Inventory',
    status: 'Compliant',
    areaHref: '/self-service/inventories',
    href: '/self-service/inventories',
  },
  {
    name: 'edge-fleet-storefront',
    type: 'edge-fleets',
    typeLabel: 'Edge fleet',
    status: '98% healthy',
    areaHref: '/self-service/edge-fleets',
    href: '/self-service/edge-fleets',
  },
  {
    name: 'edge-fleet-factory',
    type: 'edge-fleets',
    typeLabel: 'Edge fleet',
    status: 'Update pending',
    areaHref: '/self-service/edge-fleets',
    href: '/self-service/edge-fleets',
  },
];

const TYPE_AREAS: Array<{
  type: Exclude<CatalogType, 'all'>;
  label: string;
  href: string;
}> = [
  {
    type: 'repositories',
    label: 'Git repositories',
    href: '/self-service/repositories',
  },
  {
    type: 'collections',
    label: 'Collections',
    href: '/self-service/collections',
  },
  {
    type: 'execution-environments',
    label: 'Execution environments',
    href: '/self-service/ee',
  },
  {
    type: 'inventories',
    label: 'Inventories',
    href: '/self-service/inventories',
  },
  {
    type: 'edge-fleets',
    label: 'Edge fleets',
    href: '/self-service/edge-fleets',
  },
];

/**
 * Option 1 — Portal Catalog hub: one table chrome; rows and type chips link to
 * real Portal entity areas (not the broken software-catalog API in this prototype).
 */
export const UnifiedCatalogPage = () => {
  const [type, setType] = useState<CatalogType>('all');
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    return ROWS.filter(row => {
      if (type !== 'all' && row.type !== type) return false;
      if (!query.trim()) return true;
      return row.name.toLowerCase().includes(query.trim().toLowerCase());
    });
  }, [type, query]);

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center" style={{ gap: 8 }}>
            <span>Catalog</span>
            <Chip
              label="Option 1"
              size="small"
              color="primary"
              style={{ borderRadius: 16, fontSize: 11 }}
            />
          </Box>
        }
        pageTitleOverride="Catalog"
        subtitle="Find Portal resources in one place — open a row or jump to an entity area"
      />
      <Content>
        <Typography
          variant="body2"
          color="textSecondary"
          style={{ marginBottom: 12, maxWidth: 720, lineHeight: 1.6 }}
        >
          Prototype Catalog hub (demo data). Each name opens the Portal page for that
          resource type. Use the chips to go straight to an entity list.
        </Typography>

        <Box
          display="flex"
          style={{ gap: 8, marginBottom: 16, flexWrap: 'wrap' }}
        >
          {TYPE_AREAS.map(area => (
            <Chip
              key={area.type}
              label={area.label}
              clickable
              component={RouterLink}
              to={area.href}
              variant={type === area.type ? 'default' : 'outlined'}
              color={type === area.type ? 'primary' : 'default'}
              onClick={() => setType(area.type)}
              style={{ borderRadius: 16 }}
            />
          ))}
        </Box>

        <Box display="flex" style={{ gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            variant="outlined"
            label="Search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ minWidth: 240 }}
          />
          <FormControl size="small" variant="outlined" style={{ minWidth: 220 }}>
            <InputLabel id="catalog-type-label">Resource type</InputLabel>
            <Select
              labelId="catalog-type-label"
              label="Resource type"
              value={type}
              onChange={e => setType(e.target.value as CatalogType)}
            >
              <MenuItem value="all">All types</MenuItem>
              {TYPE_AREAS.map(area => (
                <MenuItem key={area.type} value={area.type}>
                  {area.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Area</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(row => (
              <TableRow key={`${row.type}-${row.name}`} hover>
                <TableCell>
                  <Link
                    component={RouterLink}
                    to={row.href}
                    color="primary"
                    style={{ fontWeight: 500 }}
                  >
                    {row.name}
                  </Link>
                </TableCell>
                <TableCell>{row.typeLabel}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>
                  <Link component={RouterLink} to={row.areaHref} color="inherit">
                    Open {row.typeLabel.toLowerCase()} list
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography variant="body2" color="textSecondary">
                    No resources match this filter.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Content>
    </Page>
  );
};
