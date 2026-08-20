import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Select,
  Typography,
  makeStyles,
} from '@material-ui/core';
import { PageHelpIcon } from '../common/PageHelpIcon';
import { DEVELOP_ADMIN_SUBTITLE } from './developAdminShared';

const useStyles = makeStyles(theme => ({
  intro: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    lineHeight: 1.5,
    maxWidth: 640,
    marginBottom: theme.spacing(2),
  },
  card: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    padding: theme.spacing(2.5),
    maxWidth: 560,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 6,
  },
  field: {
    marginBottom: theme.spacing(2.5),
  },
  hint: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    marginTop: 4,
  },
  checkCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  pill: {
    textTransform: 'none',
    borderRadius: 20,
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
  },
}));

export const DevelopQualityPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [target, setTarget] = useState('aap-2.7');
  const [onCommit, setOnCommit] = useState(true);
  const [weekly, setWeekly] = useState(true);

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Quality
            <PageHelpIcon
              tooltipLabel="What is Quality admin?"
              title="Develop Quality settings"
              description="Scan schedule and target AAP version for APME. This is not a connection — GitHub, Hub, and AAP stay under Integrations. Scans run against repositories already in the Portal."
            />
          </Box>
        }
        pageTitleOverride="Quality"
        subtitle={DEVELOP_ADMIN_SUBTITLE}
      />
      <Content>
        <Typography className={classes.intro}>
          Policy for Quality on Git Repositories. Per-repo Scan stays on the
          repository. APME is enabled under Plugins. Sources are wired in
          Administration → Integrations.
        </Typography>
        <Box className={classes.card}>
          <Box className={classes.field}>
            <Typography className={classes.fieldLabel}>
              Target AAP version
            </Typography>
            <Select
              variant="outlined"
              value={target}
              onChange={event => setTarget(String(event.target.value))}
              fullWidth
            >
              <MenuItem value="aap-2.5">AAP 2.5 (ansible-core 2.16)</MenuItem>
              <MenuItem value="aap-2.7">AAP 2.7 (ansible-core 2.17)</MenuItem>
            </Select>
          </Box>
          <Box className={classes.field}>
            <Typography className={classes.fieldLabel}>Scan schedule</Typography>
            <Box className={classes.checkCol}>
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    checked={onCommit}
                    onChange={(_, v) => setOnCommit(v)}
                  />
                }
                label="On every commit"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    checked={weekly}
                    onChange={(_, v) => setWeekly(v)}
                  />
                }
                label="Weekly"
              />
            </Box>
          </Box>
          <Typography className={classes.hint}>
            Scans run on repositories already ingested from Integrations. Quality
            does not keep a second repo picker.
          </Typography>
        </Box>
        <Box className={classes.actions}>
          <Button
            className={classes.pill}
            variant="outlined"
            color="primary"
            onClick={() => navigate('/self-service/repositories/list')}
          >
            Open Git Repositories
          </Button>
          <Button
            className={classes.pill}
            variant="outlined"
            color="primary"
            onClick={() => navigate('/self-service/admin/integrations')}
          >
            Open Integrations
          </Button>
        </Box>
      </Content>
    </Page>
  );
};
