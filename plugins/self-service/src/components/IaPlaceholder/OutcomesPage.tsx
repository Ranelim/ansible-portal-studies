import { Link as RouterLink } from 'react-router-dom';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Chip,
  Link,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@material-ui/core';

type OutcomeRow = {
  name: string;
  kind: string;
  fromTemplate: string;
  created: string;
  href: string;
};

/** Demo artifacts produced by template runs — not Platform Catalog discovery. */
const ROWS: OutcomeRow[] = [
  {
    name: 'acme-corp/rhel-patching',
    kind: 'Git repository',
    fromTemplate: 'Create Git repository',
    created: '2 days ago',
    href: '/self-service/repositories/rhel-patching',
  },
  {
    name: 'ee-minimal-rhel9',
    kind: 'Execution environment',
    fromTemplate: 'Build execution environment',
    created: '5 days ago',
    href: '/self-service/ee/catalog',
  },
  {
    name: 'ansible.posix',
    kind: 'Collection',
    fromTemplate: 'Import collection',
    created: '1 week ago',
    href: '/self-service/collections/ansible.posix',
  },
  {
    name: 'prod-datacenter',
    kind: 'Inventory',
    fromTemplate: 'Scaffold inventory',
    created: '2 weeks ago',
    href: '/self-service/inventories',
  },
];

/**
 * Option 4 — Outcomes: light catalog of things template runs produced.
 * Distinct from Activity (what ran) and from Platform Catalog (discovery).
 */
export const OutcomesPage = () => (
  <Page themeId="app">
    <Header
      title="Outcomes"
      pageTitleOverride="Outcomes"
      subtitle="Artifacts created from template runs"
    />
    <Content>
      <Box mb={2}>
        <Typography variant="body2" color="textSecondary">
          Things your runs produced — repositories, execution environments,
          collections, inventories. Open an item to continue work. For run
          history, use Activity; for platform-wide discovery, use Catalog
          (other IA models).
        </Typography>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>From template</TableCell>
            <TableCell>Created</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ROWS.map(row => (
            <TableRow key={row.name} hover>
              <TableCell>
                <Link component={RouterLink} to={row.href}>
                  {row.name}
                </Link>
              </TableCell>
              <TableCell>
                <Chip size="small" label={row.kind} />
              </TableCell>
              <TableCell>{row.fromTemplate}</TableCell>
              <TableCell>{row.created}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Content>
  </Page>
);
