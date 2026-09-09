import type { CSSProperties } from 'react';
import { Box, Button, Card, CardContent, Tooltip, Typography } from '@material-ui/core';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import { useNavigate } from 'react-router-dom';
import {
  CategoryMixMini,
  HEALTH_SCORE_HINT,
  HealthScorePopover,
  getCardRemediationStatusLabel,
  isRemediateButtonDisabled,
  remediationSessionResume,
  shouldShowRemediateButton,
} from '../catalog/HealthScorePopover';
import { useNavIaModel } from '../../../hooks/useNavIaModel';
import { scansListPath } from '../quality/qualitySurfacePaths';
import { useProjectDetailStyles } from './styles';
import type { ProjectQualityData } from './qualityDemoData';

const shortSha = (sha: string) => sha.slice(0, 7);

const pill: CSSProperties = {
  textTransform: 'none',
  fontWeight: 600,
  borderRadius: 20,
  width: '100%',
};

function HealthScoreHeading({ className }: { className: string }) {
  return (
    <Box display="flex" alignItems="center" style={{ gap: 4, marginBottom: 8 }}>
      <Typography className={className} component="span" style={{ marginBottom: 0 }}>
        Health score
      </Typography>
      <Tooltip title={HEALTH_SCORE_HINT} arrow>
        <span
          tabIndex={0}
          role="img"
          aria-label="About health score"
          style={{ display: 'inline-flex', cursor: 'help' }}
        >
          <InfoOutlinedIcon style={{ fontSize: 16, opacity: 0.55 }} aria-hidden />
        </span>
      </Tooltip>
    </Box>
  );
}

/**
 * Repo Overview metric card (right column, above About).
 * Score + View details opens the findings popover. Findings count is metadata.
 * Start health scan is on this card and in the page Actions menu.
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

  const historyPath = () => {
    const qs = new URLSearchParams({ repo: repoName });
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
          <HealthScoreHeading className={classes.cardTitle} />
          <Typography color="textSecondary" style={{ fontSize: 14, marginBottom: 16 }}>
            This repository has not been scanned yet.
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            style={pill}
            onClick={() => navigate(scanPath())}
          >
            Start health scan
          </Button>
        </CardContent>
      </Card>
    );
  }

  const scannedSha = quality.lastScannedCommit
    ? shortSha(quality.lastScannedCommit)
    : null;
  const cardStatus = getCardRemediationStatusLabel(quality.remediationStatus);
  const showRemediate = shouldShowRemediateButton(
    quality.remediationStatus,
    quality.totalViolations,
  );
  const prUrl = quality.remediationPrUrl;

  return (
    <Card className={classes.card} variant="outlined">
      <CardContent className={classes.cardContent}>
        <HealthScoreHeading className={classes.cardTitle} />
        <HealthScorePopover
          repoName={repoName}
          quality={quality}
          fontSize={28}
          denomSize={16}
          openHint="View details"
          onStartScan={() => navigate(scanPath())}
          onViewLastScan={() => navigate(historyPath())}
        />
        <Typography color="textSecondary" style={{ fontSize: 13, marginTop: 8 }}>
          {quality.totalViolations === 0
            ? 'No findings'
            : `${quality.totalViolations} findings`}
          {' · '}
          {quality.lastScannedAt}
          {scannedSha && (
            <>
              {' · '}
              <span style={{ fontFamily: 'monospace' }}>{scannedSha}</span>
            </>
          )}
        </Typography>
        {cardStatus && (
          <Typography color="textSecondary" style={{ fontSize: 13, marginTop: 4 }}>
            Status: {cardStatus}
          </Typography>
        )}
        <CategoryMixMini repoName={repoName} divided={false} />
        <Box
          display="flex"
          flexDirection="column"
          alignItems="stretch"
          style={{ gap: 8, marginTop: 16 }}
        >
          {showRemediate && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              style={pill}
              disabled={isRemediateButtonDisabled(quality.remediationStatus)}
              onClick={() =>
                navigate(
                  scanPath(remediationSessionResume(quality.remediationStatus)),
                )
              }
            >
              Remediate
            </Button>
          )}
          {quality.remediationStatus === 'pr-open' && prUrl && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              style={pill}
              onClick={() => window.open(prUrl, '_blank', 'noopener,noreferrer')}
            >
              View pull request
            </Button>
          )}
          <Button
            variant="outlined"
            color="primary"
            size="small"
            style={pill}
            onClick={() => navigate(scanPath())}
          >
            Start health scan
          </Button>
          <Button
            variant="text"
            color="primary"
            size="small"
            onClick={() => navigate(historyPath())}
            style={{
              textTransform: 'none',
              fontWeight: 600,
              alignSelf: 'flex-start',
              paddingLeft: 0,
              minWidth: 0,
            }}
          >
            View scan history
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
