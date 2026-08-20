import { useNavigate } from 'react-router-dom';
import { Page, Header, Content, Table, TableColumn } from '@backstage/core-components';
import { Box, Button, Chip, Typography, makeStyles } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import { PageHelpIcon } from '../common/PageHelpIcon';
import {
  useNavIaModel,
  writeNavExperience,
} from '../../hooks/useNavIaModel';
import { DEVELOP_ADMIN_SUBTITLE } from './developAdminShared';

type DevelopRole = {
  name: string;
  description: string;
  users: number;
  groups: string[];
  permissions: string[];
};

/** Prototype: same role list as Access Control, filtered to Develop policies. */
const DEVELOP_ROLES: DevelopRole[] = [
  {
    name: 'role:default/develop-maintainer',
    description: 'Scan and remediate Git Repositories.',
    users: 4,
    groups: ['group:default/platform-engineering'],
    permissions: [
      'catalog.entity.read',
      'ansible.apme.scan.create',
      'ansible.apme.remediate',
    ],
  },
  {
    name: 'role:default/develop-developer',
    description: 'View, scan, and remediate in Develop.',
    users: 12,
    groups: ['group:default/application-development'],
    permissions: [
      'catalog.entity.read',
      'ansible.apme.scan.create',
      'ansible.apme.remediate',
    ],
  },
  {
    name: 'role:default/develop-auditor',
    description: 'View findings and acknowledge them.',
    users: 3,
    groups: ['group:default/security'],
    permissions: ['catalog.entity.read', 'ansible.apme.acknowledge'],
  },
];

const useStyles = makeStyles(theme => ({
  intro: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    lineHeight: 1.5,
    maxWidth: 720,
    marginBottom: theme.spacing(2),
  },
  btn: {
    textTransform: 'none',
    borderRadius: 20,
  },
  name: {
    fontFamily: 'ui-monospace, monospace',
    fontSize: 13,
    fontWeight: 600,
  },
  chip: {
    marginRight: 4,
    marginBottom: 4,
    height: 22,
    fontSize: 11,
  },
  perms: {
    fontSize: 12,
    color: theme.palette.text.secondary,
    lineHeight: 1.5,
  },
}));

export const DevelopAccessPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { setExperience } = useNavIaModel();

  const openPlatformRbac = () => {
    setExperience('admin');
    writeNavExperience('admin');
    navigate('/rbac');
  };

  const columns: TableColumn<DevelopRole>[] = [
    {
      title: 'Name',
      field: 'name',
      highlight: true,
      render: row => <span className={classes.name}>{row.name}</span>,
    },
    {
      title: 'Description',
      field: 'description',
    },
    {
      title: 'Users',
      field: 'users',
      width: '80px',
    },
    {
      title: 'Groups',
      field: 'groups',
      render: row => (
        <Box>
          {row.groups.map(group => (
            <Chip
              key={group}
              className={classes.chip}
              size="small"
              label={group}
              variant="outlined"
            />
          ))}
        </Box>
      ),
    },
    {
      title: 'Permission policies',
      field: 'permissions',
      render: row => (
        <Typography className={classes.perms}>
          {row.permissions.join(', ')}
        </Typography>
      ),
    },
  ];

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center">
            Access
            <PageHelpIcon
              tooltipLabel="What is Access?"
              title="Develop Access"
              description="The same Access Control roles as the rest of the Portal, limited to permissions that apply in Develop. Create and edit roles in Access Control. Groups and users are defined there."
            />
          </Box>
        }
        pageTitleOverride="Access"
        subtitle={DEVELOP_ADMIN_SUBTITLE}
      >
        <Button
          className={classes.btn}
          color="primary"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openPlatformRbac}
        >
          Create
        </Button>
      </Header>
      <Content>
        <Typography className={classes.intro}>
          Roles that grant Develop permissions. Create and edit them in Access
          Control — this list is that same interface, filtered to this
          experience.
        </Typography>
        <Table<DevelopRole>
          title="Roles"
          columns={columns}
          data={DEVELOP_ROLES}
          options={{
            paging: false,
            search: true,
            sorting: true,
            padding: 'dense',
            header: true,
            rowStyle: { cursor: 'pointer' },
          }}
          onRowClick={() => openPlatformRbac()}
        />
      </Content>
    </Page>
  );
};
