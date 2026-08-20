import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Header, Content } from '@backstage/core-components';
import {
  Box,
  Button,
  Checkbox,
  Typography,
  makeStyles,
} from '@material-ui/core';
import { PageHelpIcon } from '../common/PageHelpIcon';
import {
  useNavIaModel,
  writeNavExperience,
} from '../../hooks/useNavIaModel';
import { DEVELOP_ADMIN_SUBTITLE } from './developAdminShared';

const ACTIONS = [
  { id: 'view', label: 'View' },
  { id: 'sync', label: 'Sync content' },
  { id: 'scan', label: 'Run scan' },
  { id: 'remediate', label: 'Remediate' },
  { id: 'ack', label: 'Acknowledge' },
] as const;

type ActionId = (typeof ACTIONS)[number]['id'];

const GROUPS: { id: string; name: string; grants: ActionId[] }[] = [
  {
    id: 'platform',
    name: 'Platform Engineering',
    grants: ['view', 'sync', 'scan', 'remediate'],
  },
  {
    id: 'appdev',
    name: 'Application Development',
    grants: ['view', 'scan', 'remediate'],
  },
  {
    id: 'security',
    name: 'Security',
    grants: ['view', 'ack'],
  },
];

const useStyles = makeStyles(theme => ({
  intro: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    lineHeight: 1.5,
    maxWidth: 640,
    marginBottom: theme.spacing(2),
  },
  tableWrap: {
    overflowX: 'auto',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    '& th, & td': {
      padding: theme.spacing(1, 1.5),
      textAlign: 'left',
      borderBottom: `1px solid ${theme.palette.divider}`,
      fontSize: 13,
    },
    '& th': {
      fontWeight: 600,
      color: theme.palette.text.secondary,
      whiteSpace: 'nowrap',
    },
    '& tr:last-child td': {
      borderBottom: 'none',
    },
  },
  group: {
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  cell: {
    textAlign: 'center',
    width: 96,
  },
  footer: {
    marginTop: theme.spacing(2),
  },
  btn: {
    textTransform: 'none',
    borderRadius: 20,
  },
}));

export const DevelopAccessPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { setExperience } = useNavIaModel();
  const [grants, setGrants] = useState<Record<string, ActionId[]>>(() =>
    Object.fromEntries(GROUPS.map(g => [g.id, [...g.grants]])),
  );

  const toggle = (groupId: string, action: ActionId) => {
    setGrants(prev => {
      const current = prev[groupId] ?? [];
      const next = current.includes(action)
        ? current.filter(a => a !== action)
        : [...current, action];
      return { ...prev, [groupId]: next };
    });
  };

  const openPlatformRbac = () => {
    setExperience('admin');
    writeNavExperience('admin');
    navigate('/rbac');
  };

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Access
            <PageHelpIcon
              tooltipLabel="What is Access?"
              title="Develop Access"
              description="Which groups may work in Develop. Groups themselves are defined in platform Access Control. This page only binds those groups to Develop actions."
            />
          </Box>
        }
        pageTitleOverride="Access"
        subtitle={DEVELOP_ADMIN_SUBTITLE}
      />
      <Content>
        <Typography className={classes.intro}>
          Bind existing groups to Develop actions. View, sync, scan, remediate,
          and acknowledge are separate on purpose — running a scan is not the
          same as applying a fix.
        </Typography>
        <Box className={classes.tableWrap}>
          <table className={classes.table}>
            <thead>
              <tr>
                <th>Group</th>
                {ACTIONS.map(action => (
                  <th key={action.id} className={classes.cell}>
                    {action.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GROUPS.map(group => (
                <tr key={group.id}>
                  <td className={classes.group}>{group.name}</td>
                  {ACTIONS.map(action => (
                    <td key={action.id} className={classes.cell}>
                      <Checkbox
                        color="primary"
                        size="small"
                        checked={(grants[group.id] ?? []).includes(action.id)}
                        onChange={() => toggle(group.id, action.id)}
                        inputProps={{
                          'aria-label': `${group.name} ${action.label}`,
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
        <Box className={classes.footer}>
          <Button
            className={classes.btn}
            variant="outlined"
            color="primary"
            onClick={openPlatformRbac}
          >
            Platform roles and groups
          </Button>
        </Box>
      </Content>
    </Page>
  );
};
