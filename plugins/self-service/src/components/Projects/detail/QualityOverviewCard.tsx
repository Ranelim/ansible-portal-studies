import type { CSSProperties } from 'react';
import { Box, Button, Card, CardContent, Typography } from '@material-ui/core';
import { useNavigate } from 'react-router-dom';
import { QualityScoreMark } from '../catalog/HealthScorePopover';
import { useNavIaModel } from '../../../hooks/useNavIaModel';
import { scansListPath } from '../quality/qualitySurfacePaths';
import { useProjectDetailStyles } from './styles';
import type { ProjectQualityData } from './qualityDemoData';

const liveSession = (status: ProjectQualityData['remediationStatus']) =>
  status === 'in-progress' || status === 'proposals-ready';

const shortSha = (sha: string) => sha.slice(0, 7);

const pill: CSSProperties = {
  textTransform: 'none',
  fontWeight: 600,
  borderRadius: 20,
};

/**
 * Object-home summary when Remediations / Scans live on a fleet surface.
 * Last scan time + scanned commit are APME scan metadata.
 * Do not claim default-branch HEAD has moved unless has_new_commits is consumed.
 */
export const QualityOverviewCard = ({
  repoName,
  quality,
}: {
  repoName: string;
  quality: ProjectQualityData | null;
}) => {
  const classes = useProjectDetailStyles();
  const navigate = useNavigate();
  const { experience } = useNavIaModel();

  const lastScanPath = () => {
    const qs = new URLSearchParams({ repo: repoName });
    if (quality?.latestScan.scanId) qs.set('scan', quality.latestScan.scanId);
    return `${scansListPath(experience)}?${qs.toString()}`;
  };

  const scanPath = (resume?: boolean) => {
    const qs = new URLSearchParams({ from: 'repo' });
    if (resume) qs.set('resume', '1');
    return `/self-service/apme/remediate/${encodeURIComponent(
      repoName,
    )}?${qs.toString()}`;
  };

  if (!quality) {
    return (
      <Card className={classes.card} variant="outlined">
        <CardContent className={classes.cardContent}>
          <Typography className={classes.cardTitle}>Quality score</Typography>
          <Typography color="textSecondary" style={{ fontSize: 14, marginBottom: 16 }}>
            This repository has not been scanned yet.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="small"
            style={pill}
            onClick={() => navigate(scanPath())}
          >
            Start scan
          </Button>
        </CardContent>
      </Card>
    );
  }

  const live = liveSession(quality.remediationStatus);
  const scannedSha = quality.lastScannedCommit
    ? shortSha(quality.lastScannedCommit)
    : null;

  return (
    <Card className={classes.card} variant="outlined">
      <CardContent className={classes.cardContent}>
        <Typography className={classes.cardTitle} style={{ marginBottom: 8 }}>
          Quality score
        </Typography>
        <QualityScoreMark score={quality.healthScore} fontSize={36} denomSize={18} />
        <Typography color="textSecondary" style={{ fontSize: 13, marginTop: 8 }}>
          Last scan {quality.lastScannedAt}
          {scannedSha && (
            <>
              {' · '}
              <span style={{ fontFamily: 'monospace' }}>{scannedSha}</span>
            </>
          )}
        </Typography>
        <Box
          display="flex"
          alignItems="center"
          style={{ gap: 8, marginTop: 16, flexWrap: 'wrap' }}
        >
          {live ? (
            <>
              <Button
                variant="contained"
                color="primary"
                size="small"
                style={pill}
                onClick={() => navigate(scanPath(true))}
              >
                Resume remediation
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                style={pill}
                onClick={() => navigate(lastScanPath())}
              >
                View last scan
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                style={pill}
                onClick={() => navigate(scanPath())}
              >
                Start new scan
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                color="primary"
                size="small"
                style={pill}
                onClick={() => navigate(scanPath())}
              >
                Start new scan
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                style={pill}
                onClick={() => navigate(lastScanPath())}
              >
                View last scan
              </Button>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
