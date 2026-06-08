import {
  Page,
  Header,
  Content,
} from '@backstage/core-components';
import {
  Box,
  Typography,
  makeStyles,
} from '@material-ui/core';
import AssignmentTurnedInIcon from '@material-ui/icons/AssignmentTurnedIn';

const useStyles = makeStyles(theme => ({
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(8, 4),
    textAlign: 'center',
  },
  icon: {
    fontSize: 64,
    color: theme.palette.text.disabled,
    marginBottom: theme.spacing(2),
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: theme.spacing(1),
  },
  description: {
    fontSize: 14,
    color: theme.palette.text.secondary,
    maxWidth: 480,
    lineHeight: 1.6,
  },
}));

export const CompliancePage = () => {
  const classes = useStyles();

  return (
    <Page themeId="tool">
      <Header
        title="Compliance"
        subtitle="Monitor and enforce security and regulatory compliance across your infrastructure"
      />
      <Content>
        <Box className={classes.emptyState}>
          <AssignmentTurnedInIcon className={classes.icon} />
          <Typography className={classes.title}>
            No compliance profiles configured
          </Typography>
          <Typography className={classes.description}>
            Compliance scanning lets you assess hosts against security and
            regulatory frameworks such as DISA STIG, PCI-DSS, CIS, and NIST.
            Configure a compliance profile to get started.
          </Typography>
        </Box>
      </Content>
    </Page>
  );
};
