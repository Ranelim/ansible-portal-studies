import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  MenuItem,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  makeStyles,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  useNavIaModel,
  writeNavIaModel,
  writeNavExperience,
  type NavIaModel,
} from '@ansible/plugin-backstage-self-service';
import { IA_BANNER_HEIGHT } from './chromeHeights';
import { isDay0SetupPath } from '../GlobalHeader/isDay0SetupPath';
import { modelHomePath } from './navIaLandings';
import {
  getNavIaScorecard,
  type JtbdScore,
} from './navIaJtbdScores';
import { getNavIaVisualScorecard } from './navIaVisualScores';

const SHOW_SCORES_KEY = 'portal-nav-ia-show-scores';

function readShowScores(): boolean {
  try {
    const raw = localStorage.getItem(SHOW_SCORES_KEY);
    if (raw === null) return true;
    return raw === '1' || raw === 'true';
  } catch {
    return true;
  }
}

const IA_MODEL_OPTIONS: Array<{
  id: NavIaModel;
  label: string;
  blurb: string;
}> = [
  {
    id: 'flat',
    label: 'Option 1 — Baseline (RHDH-like)',
    blurb:
      'Baseline for comparison — closest to current RHDH flat patterns (not shipped Portal SoT). Unlabeled rail: Home, Catalog, Templates, Activity, Documentation, Learning Paths, then a flat entity phonebook (Git Repositories, EEs, Collections, Inventories, Edge fleets by seat). No Develop/Operate/Learn section labels. Administration in a bottom drawer. Rail Search (modal); no masthead search. Entity tabs: Dashboard? → {Entity} list → domain → Templates | Settings.',
  },
  {
    id: 'curated',
    label: 'Option 2 — Pins + job-band sections',
    blurb:
      'Strong baseline proposal. Top stack: Home + Templates + Activity (no Catalog, no “Run” label). Then labeled job bands: Develop / Operate (by seat + plugins) → Learn → Administration (admin). One rail item per primary object; plugins extend hosts as tabs. Rail Search (modal); no masthead search. Seat landings: SME → Templates; Dev/Admin → Git Repositories; Operator → Inventories / Edge fleets.',
  },
  {
    id: 'homeband',
    label: 'Option 3 — Home band + job sections',
    blurb:
      'Fork of Option 2. When Home is the only band (SME), items are flat — no Home label/drawer. With Develop/Operate/Admin: collapsible Home (Dashboard, Search, Templates, Activity, Learn) then those bands. No Outcomes. No masthead search. Landings: SME → Templates; others → Dashboard.',
  },
  {
    id: 'hybrid',
    label: 'Option 4 — Run + gated Home',
    blurb:
      'Job-band rail with a labeled Run section (Templates + Activity); no floating rail Search. SME: Run + Learn + header OmniSearch. When Develop / Operate / Admin are present: gated Home section (Dashboard, Search) above Run — header OmniSearch stays. Differs from Option 2: Run label, no Home pin, gated Home instead.',
  },
  {
    id: 'experiences',
    label: 'Option 5 — Concept: Experiences',
    blurb:
      'Concept only — not a default-shell finalist. Job-mode switcher: enter one experience at a time (Automate, Develop, Compliance, Edge, Administration, or All). Develop / Compliance / Edge: Dashboard → Templates → Activity → entities → Settings. Automate: Templates → Activity → Catalog → Settings (no experience Dashboard). All (Home): insight Dashboard · Experiences catalog · Plugins (admin only) · Settings. No Learn band (Docs / Learning Paths) on the rail. Entity pages are list-first. Exploration only — listed last.',
  },
];

function scoreColor(score: JtbdScore): string {
  if (score === 'Pass') return '#3E8635';
  if (score === 'Weak') return '#F0AB00';
  if (score === 'Fail') return '#C9190B';
  return '#6A6E73';
}

function pctBadgeBg(pct: number): string {
  if (pct >= 90) return '#3E8635';
  if (pct >= 80) return '#486B00';
  if (pct >= 70) return '#F0AB00';
  return '#C9190B';
}

const useStyles = makeStyles(theme => ({
  banner: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: IA_BANNER_HEIGHT,
    zIndex: theme.zIndex.drawer + 2,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(0, 2),
    backgroundColor: '#5e40c0',
    color: '#fff',
    borderBottom: '1px solid rgba(255,255,255,0.18)',
    boxSizing: 'border-box',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    opacity: 0.85,
    flexShrink: 0,
  },
  copy: {
    fontSize: 13,
    lineHeight: 1.35,
    opacity: 0.95,
    flex: '1 1 auto',
    minWidth: 0,
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  },
  select: {
    minWidth: 300,
    maxWidth: 420,
    flexShrink: 0,
    '& .MuiOutlinedInput-root': {
      height: 32,
      color: '#fff',
      backgroundColor: 'rgba(255,255,255,0.12)',
      fontSize: 13,
      fontWeight: 600,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255,255,255,0.35)',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255,255,255,0.55)',
    },
    '& .MuiSvgIcon-root': {
      color: '#fff',
    },
  },
  menuRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    width: '100%',
  },
  menuBadges: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flexShrink: 0,
    marginTop: 2,
  },
  menuBadge: {
    height: 20,
    fontWeight: 700,
    fontSize: 10,
    color: '#fff',
  },
  scoreBtn: {
    flexShrink: 0,
    height: 28,
    minWidth: 0,
    padding: '0 10px',
    borderRadius: 14,
    textTransform: 'none',
    fontWeight: 700,
    fontSize: 12,
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.45)',
    '&:hover': {
      borderColor: '#fff',
      backgroundColor: 'rgba(255,255,255,0.14)',
    },
  },
  gradeCell: {
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums' as const,
  },
  dialogTitle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: theme.spacing(1),
  },
  summaryRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  jobScore: {
    fontWeight: 700,
    whiteSpace: 'nowrap' as const,
  },
  groupLabel: {
    fontWeight: 700,
    fontSize: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1.5),
    marginBottom: theme.spacing(0.5),
  },
  scoresToggle: {
    flexShrink: 0,
    marginLeft: 0,
    marginRight: 0,
    '& .MuiFormControlLabel-label': {
      fontSize: 12,
      fontWeight: 600,
      color: '#fff',
      opacity: 0.95,
    },
  },
  scoresSwitch: {
    '& .MuiSwitch-switchBase': {
      color: 'rgba(255,255,255,0.7)',
    },
    '& .MuiSwitch-switchBase.Mui-checked': {
      color: '#fff',
    },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
      backgroundColor: 'rgba(255,255,255,0.55)',
    },
    '& .MuiSwitch-track': {
      backgroundColor: 'rgba(255,255,255,0.28)',
    },
  },
}));

/**
 * Full-width prototype chrome above the Automation Portal masthead.
 * Switches navigation IA models for design exploration (AAP-84131).
 */
export const IaPrototypeBanner = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const { model, setModel, setExperience } = useNavIaModel();
  const [scoreOpen, setScoreOpen] = useState(false);
  const [visualOpen, setVisualOpen] = useState(false);
  const [showScores, setShowScores] = useState(readShowScores);

  if (isDay0SetupPath(location.pathname)) {
    return null;
  }

  const active = IA_MODEL_OPTIONS.find(o => o.id === model) ?? IA_MODEL_OPTIONS[0];
  const card = getNavIaScorecard(model);
  const visual = getNavIaVisualScorecard(model);

  const onToggleScores = (checked: boolean) => {
    setShowScores(checked);
    try {
      localStorage.setItem(SHOW_SCORES_KEY, checked ? '1' : '0');
    } catch {
      /* ignore */
    }
    if (!checked) {
      setScoreOpen(false);
      setVisualOpen(false);
    }
  };

  const onChange = (next: NavIaModel) => {
    setModel(next);
    writeNavIaModel(next);
    if (next === 'experiences') {
      let role = 'sme';
      try {
        role = localStorage.getItem('portal-user-role') || 'sme';
      } catch {
        /* ignore */
      }
      // Opt 5 — SME locks to Automate (no All/Home bridge)
      const nextExp = role === 'sme' ? 'automate' : 'all';
      setExperience(nextExp);
      writeNavExperience(nextExp);
    }
    navigate(modelHomePath(next));
  };

  return (
    <>
      <Box
        className={classes.banner}
        role="region"
        aria-label="Navigation IA prototype"
      >
        <Typography className={classes.eyebrow} component="span">
          Nav IA prototype
        </Typography>
        <Typography className={classes.copy} component="span">
          Explore how Automation Portal could structure the rail (side nav) as
          we add plugins. Switch models — design exploration only.
          {showScores
            ? ' Click score badges for JTBD or visual results.'
            : ''}
        </Typography>
        <FormControl variant="outlined" size="small" className={classes.select}>
          <Select
            value={model}
            onChange={e => onChange(e.target.value as NavIaModel)}
            displayEmpty
            renderValue={() => active.label}
            inputProps={{ 'aria-label': 'Navigation IA model' }}
          >
            {IA_MODEL_OPTIONS.map(opt => {
              const optCard = getNavIaScorecard(opt.id);
              const optVisual = getNavIaVisualScorecard(opt.id);
              return (
                <MenuItem
                  key={opt.id}
                  value={opt.id}
                  style={{
                    whiteSpace: 'normal',
                    maxWidth: 560,
                    alignItems: 'flex-start',
                  }}
                >
                  <Box className={classes.menuRow}>
                    {showScores && (
                      <Box className={classes.menuBadges}>
                        <Chip
                          size="small"
                          label={`Jobs ${optCard.pct}%`}
                          className={classes.menuBadge}
                          style={{ backgroundColor: pctBadgeBg(optCard.pct) }}
                        />
                        <Chip
                          size="small"
                          label={`Visual ${optVisual.pct}%`}
                          className={classes.menuBadge}
                          style={{ backgroundColor: pctBadgeBg(optVisual.pct) }}
                        />
                      </Box>
                    )}
                    <Box py={0.5} minWidth={0}>
                      <Typography variant="body2" style={{ fontWeight: 600 }}>
                        {opt.label}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        style={{
                          display: 'block',
                          lineHeight: 1.4,
                          marginTop: 2,
                        }}
                      >
                        {opt.blurb}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
        <FormControlLabel
          className={classes.scoresToggle}
          control={
            <Switch
              className={classes.scoresSwitch}
              size="small"
              checked={showScores}
              onChange={(_, checked) => onToggleScores(checked)}
              color="default"
              inputProps={{ 'aria-label': 'Show score badges' }}
            />
          }
          label="Scores"
        />
        {showScores && (
          <>
            <Button
              className={classes.scoreBtn}
              style={{ backgroundColor: pctBadgeBg(card.pct) }}
              onClick={() => setScoreOpen(true)}
              aria-label={`JTBD score ${card.pct} percent — view job breakdown`}
            >
              {card.pct}% · jobs
            </Button>
            <Button
              className={classes.scoreBtn}
              style={{ backgroundColor: pctBadgeBg(visual.pct) }}
              onClick={() => setVisualOpen(true)}
              aria-label={`Visual score ${visual.pct} percent — view seat breakdown`}
            >
              {visual.pct}% · visual
            </Button>
          </>
        )}
      </Box>

      <Dialog
        open={scoreOpen}
        onClose={() => setScoreOpen(false)}
        maxWidth="md"
        fullWidth
        aria-labelledby="nav-ia-score-title"
      >
        <DialogTitle disableTypography className={classes.dialogTitle}>
          <Box>
            <Typography id="nav-ia-score-title" variant="h6">
              {active.label}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              JTBD judgment · Pass = 2 · Weak = 1 · Fail = 0 · jobs 1–14
            </Typography>
          </Box>
          <IconButton
            aria-label="Close"
            onClick={() => setScoreOpen(false)}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box className={classes.summaryRow}>
            <Chip
              label={`${card.pct}% · ${card.sum}/${card.max}`}
              style={{
                backgroundColor: pctBadgeBg(card.pct),
                color: '#fff',
                fontWeight: 700,
              }}
            />
            <Chip label={`${card.passes} Pass`} size="small" />
            <Chip label={`${card.weaks} Weak`} size="small" />
            <Chip label={`${card.fails} Fail`} size="small" />
            {card.killTest && (
              <Chip
                label={`Job 15 (Experiences): ${card.killTest}`}
                size="small"
                style={{
                  backgroundColor: scoreColor(card.killTest),
                  color: '#fff',
                  fontWeight: 600,
                }}
              />
            )}
          </Box>

          {(['Core', 'Cross-cutting', 'Stress'] as const).map(group => {
            const rows = card.jobs.filter(j => j.group === group);
            if (!rows.length) return null;
            return (
              <Box key={group} mb={2}>
                <Typography className={classes.groupLabel}>{group}</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width={40}>#</TableCell>
                      <TableCell>Job</TableCell>
                      <TableCell width={80}>Score</TableCell>
                      <TableCell>Why this score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map(job => (
                      <TableRow key={job.id}>
                        <TableCell>{job.id}</TableCell>
                        <TableCell>
                          <Typography variant="body2" style={{ fontWeight: 600 }}>
                            {job.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            display="block"
                            style={{ marginTop: 2, lineHeight: 1.35 }}
                          >
                            {job.meaning}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            className={classes.jobScore}
                            style={{ color: scoreColor(job.score) }}
                          >
                            {job.score}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="textSecondary">
                            {job.notes}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            );
          })}
          <Divider style={{ marginTop: 8, marginBottom: 12 }} />
          <Typography variant="caption" color="textSecondary">
            Design judgment against the live prototype (not a usability study).
            Each job shows what it means, then why this option scored that way.
            Totals use jobs 1–14 only; job 15 is an Experiences kill-test.
          </Typography>
        </DialogContent>
      </Dialog>

      <Dialog
        open={visualOpen}
        onClose={() => setVisualOpen(false)}
        maxWidth="md"
        fullWidth
        aria-labelledby="nav-ia-visual-title"
      >
        <DialogTitle disableTypography className={classes.dialogTitle}>
          <Box>
            <Typography id="nav-ia-visual-title" variant="h6">
              {active.label}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Visual rail judgment · cognitive load · clarity · orientation ·
              1–5 scale (shown as %)
            </Typography>
          </Box>
          <IconButton
            aria-label="Close"
            onClick={() => setVisualOpen(false)}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box className={classes.summaryRow}>
            <Chip
              label={`${visual.pct}% · ${visual.avg.toFixed(1)}/5`}
              style={{
                backgroundColor: pctBadgeBg(visual.pct),
                color: '#fff',
                fontWeight: 700,
              }}
            />
            <Chip
              label={`Load ${visual.byDim['Cognitive load'].toFixed(1)}`}
              size="small"
            />
            <Chip
              label={`Clarity ${visual.byDim.Clarity.toFixed(1)}`}
              size="small"
            />
            <Chip
              label={`Orient ${visual.byDim.Orientation.toFixed(1)}`}
              size="small"
            />
          </Box>

          <Typography className={classes.groupLabel}>
            By seat (SME / Developer / Ops-both / Admin)
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Seat</TableCell>
                <TableCell width={56}>Items</TableCell>
                <TableCell width={64}>Load</TableCell>
                <TableCell width={64}>Clarity</TableCell>
                <TableCell width={64}>Orient</TableCell>
                <TableCell width={56}>Avg</TableCell>
                <TableCell>Visual read</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visual.bySeat.map(row => (
                <TableRow key={row.seat}>
                  <TableCell>
                    <Typography variant="body2" style={{ fontWeight: 600 }}>
                      {row.seat}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.items}</TableCell>
                  <TableCell className={classes.gradeCell}>
                    {row.cognitiveLoad}
                  </TableCell>
                  <TableCell className={classes.gradeCell}>
                    {row.clarity}
                  </TableCell>
                  <TableCell className={classes.gradeCell}>
                    {row.orientation}
                  </TableCell>
                  <TableCell className={classes.gradeCell}>
                    {row.seatAvg.toFixed(1)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="textSecondary">
                      {row.read}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Divider style={{ marginTop: 16, marginBottom: 12 }} />
          <Typography variant="caption" color="textSecondary">
            From live screenshots in scratch/nav-ia-visual-eval/. % = average
            grade ÷ 5. Not a usability study.
          </Typography>
        </DialogContent>
      </Dialog>
    </>
  );
};
