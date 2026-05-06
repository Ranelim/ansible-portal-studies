import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Paper,
  Button,
} from '@material-ui/core';
import { Table, TableColumn } from '@backstage/core-components';
import WarningIcon from '@material-ui/icons/Warning';
import ErrorIcon from '@material-ui/icons/Error';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import GetAppIcon from '@material-ui/icons/GetApp';
import { useProjectDetailStyles } from './styles';
import { statusColors } from '../../common/statusColors';
import {
  type ProjectQualityData,
  type CollectionDependency,
  type PythonDependency,
  type SeverityClass,
  SEVERITY_COLORS,
} from './qualityDemoData';

const SeverityIcon = ({ severity }: { severity?: SeverityClass }) => {
  if (!severity) return <CheckCircleIcon style={{ fontSize: 16, color: statusColors.success }} />;
  if (severity === 'critical' || severity === 'high') {
    return <ErrorIcon style={{ fontSize: 16, color: SEVERITY_COLORS[severity] }} />;
  }
  return <WarningIcon style={{ fontSize: 16, color: SEVERITY_COLORS[severity] }} />;
};

export const DependenciesTab = ({ quality }: { quality: ProjectQualityData | null }) => {
  const classes = useProjectDetailStyles();

  if (!quality || !quality.ansibleCoreVersion) {
    return (
      <Box style={{ marginTop: 24 }}>
        <Card variant="outlined" style={{ borderRadius: 12 }}>
          <CardContent style={{ padding: '64px 24px', textAlign: 'center' }}>
            <WarningIcon style={{ fontSize: 48, opacity: 0.2, marginBottom: 12 }} />
            <Typography style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
              No dependency data available
            </Typography>
            <Typography style={{ fontSize: 13, color: '#666', maxWidth: 400, margin: '0 auto' }}>
              Run a quality check to discover collections, Python packages, and their security status.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const totalCves = quality.pythonPackages.reduce((sum, p) => sum + p.cveCount, 0);
  const collectionFindings = quality.collections.reduce((sum, c) => sum + c.violations, 0);

  const collectionColumns: TableColumn<CollectionDependency>[] = [
    {
      title: 'Collection',
      field: 'fqcn',
      render: (row: CollectionDependency) => (
        <Typography style={{ fontSize: 13, fontWeight: 500, fontFamily: 'monospace' }}>
          {row.fqcn}
        </Typography>
      ),
    },
    { title: 'Version', field: 'version' },
    {
      title: 'Source',
      field: 'source',
      render: (row: CollectionDependency) => (
        <Chip
          size="small"
          label={row.source === 'automation_hub' ? 'Automation Hub' : 'Galaxy'}
          variant="outlined"
          style={{ fontSize: 11, height: 20 }}
        />
      ),
    },
    {
      title: 'Findings',
      field: 'violations',
      render: (row: CollectionDependency) => (
        <Box display="flex" alignItems="center" style={{ gap: 6 }}>
          {row.violations === 0 ? (
            <CheckCircleIcon style={{ fontSize: 16, color: statusColors.success }} />
          ) : (
            <WarningIcon style={{ fontSize: 16, color: statusColors.warning }} />
          )}
          <Typography style={{ fontSize: 13 }}>
            {row.violations === 0 ? 'Clean' : `${row.violations} issue${row.violations !== 1 ? 's' : ''}`}
          </Typography>
        </Box>
      ),
    },
  ];

  const pythonColumns: TableColumn<PythonDependency>[] = [
    {
      title: 'Package',
      field: 'name',
      render: (row: PythonDependency) => (
        <Typography style={{ fontSize: 13, fontWeight: 500, fontFamily: 'monospace' }}>
          {row.name}
        </Typography>
      ),
    },
    { title: 'Version', field: 'version' },
    {
      title: 'CVEs',
      field: 'cveCount',
      render: (row: PythonDependency) => (
        <Box display="flex" alignItems="center" style={{ gap: 6 }}>
          <SeverityIcon severity={row.cveCount > 0 ? row.highestSeverity : undefined} />
          <Typography style={{
            fontSize: 13,
            color: row.cveCount > 0 ? SEVERITY_COLORS[row.highestSeverity ?? 'medium'] : statusColors.success,
          }}>
            {row.cveCount === 0 ? 'None' : `${row.cveCount} CVE${row.cveCount !== 1 ? 's' : ''}`}
          </Typography>
          {row.highestSeverity && row.cveCount > 0 && (
            <Chip
              size="small"
              label={row.highestSeverity}
              style={{
                fontSize: 10, height: 18, textTransform: 'capitalize',
                backgroundColor: `${SEVERITY_COLORS[row.highestSeverity]}20`,
                color: SEVERITY_COLORS[row.highestSeverity],
              }}
            />
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box style={{ marginTop: 24 }}>
      {(totalCves > 0 || collectionFindings > 0) && (
        <Paper
          variant="outlined"
          style={{
            padding: '12px 16px', marginBottom: 24, borderRadius: 8,
            borderLeft: `4px solid ${statusColors.warning}`,
            backgroundColor: `${statusColors.warning}08`,
          }}
        >
          <Box display="flex" alignItems="center" style={{ gap: 8 }}>
            <WarningIcon style={{ fontSize: 18, color: statusColors.warning }} />
            <Typography style={{ fontSize: 13 }}>
              <strong>Dependency health:</strong>{' '}
              {totalCves > 0 && `${totalCves} CVE${totalCves !== 1 ? 's' : ''} found in Python packages`}
              {totalCves > 0 && collectionFindings > 0 && ' · '}
              {collectionFindings > 0 && `${collectionFindings} finding${collectionFindings !== 1 ? 's' : ''} in collections`}
            </Typography>
          </Box>
        </Paper>
      )}

      <Card variant="outlined" style={{ borderRadius: 12, marginBottom: 24 }}>
        <CardContent style={{ padding: 20 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" style={{ marginBottom: 16 }}>
            <Typography style={{ fontWeight: 600, fontSize: '1.25rem' }}>
              Ansible core
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<GetAppIcon style={{ fontSize: 14 }} />}
              style={{ textTransform: 'none', fontSize: 12 }}
              onClick={() => {
                const blob = new Blob(['{"bomFormat":"CycloneDX","specVersion":"1.5"}'], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'sbom.cdx.json';
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download SBOM
            </Button>
          </Box>
          <Box className={classes.summaryGrid}>
            <Paper className={classes.summaryCard} variant="outlined">
              <Typography className={classes.summaryLabel}>ansible-core</Typography>
              <Typography className={classes.summaryValue}>{quality.ansibleCoreVersion}</Typography>
            </Paper>
            <Paper className={classes.summaryCard} variant="outlined">
              <Typography className={classes.summaryLabel}>Collections</Typography>
              <Typography className={classes.summaryValue}>{quality.collections.length}</Typography>
            </Paper>
            <Paper className={classes.summaryCard} variant="outlined">
              <Typography className={classes.summaryLabel}>Python packages</Typography>
              <Typography className={classes.summaryValue}>{quality.pythonPackages.length}</Typography>
            </Paper>
          </Box>
        </CardContent>
      </Card>

      <Card variant="outlined" style={{ borderRadius: 12, marginBottom: 24 }}>
        <CardContent style={{ padding: 20 }}>
          <Typography style={{ fontWeight: 600, fontSize: '1.25rem', marginBottom: 16 }}>
            Collections ({quality.collections.length})
          </Typography>
          <Table<CollectionDependency>
            columns={collectionColumns}
            data={quality.collections}
            title=""
            options={{ paging: false, search: false, sorting: false, padding: 'dense', header: true }}
            style={{ boxShadow: 'none' }}
          />
        </CardContent>
      </Card>

      <Card variant="outlined" style={{ borderRadius: 12 }}>
        <CardContent style={{ padding: 20 }}>
          <Typography style={{ fontWeight: 600, fontSize: '1.25rem', marginBottom: 16 }}>
            Python packages ({quality.pythonPackages.length})
          </Typography>
          <Table<PythonDependency>
            columns={pythonColumns}
            data={quality.pythonPackages}
            title=""
            options={{ paging: false, search: false, sorting: false, padding: 'dense', header: true }}
            style={{ boxShadow: 'none' }}
          />
        </CardContent>
      </Card>
    </Box>
  );
};
