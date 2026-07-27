import { PropsWithChildren } from 'react';
import { makeStyles, Box, Typography, Button } from '@material-ui/core';
import WarningIcon from '@material-ui/icons/Warning';
import { useLocation } from 'react-router-dom';
import {
  RestartProvider,
  useRestartRequired,
  useNavIaModel,
} from '@ansible/plugin-backstage-self-service';
import {
  SidebarPage,
} from '@backstage/core-components';
import {
  BaselineSidebar,
  ExperiencesSidebar,
  FlatNavSidebar,
} from './navSidebars';
import { CHROME_TOP, NavIaRouteGuard } from '../IaPrototype';

const useRootStyles = makeStyles(theme => ({
  '@global': {
    '.BackstageSidebar-root': {
      top: `${CHROME_TOP}px !important`,
    },
    '.BackstageSidebar-drawer': {
      top: `${CHROME_TOP}px !important`,
      overflowY: 'auto !important' as any,
    },
    'body, html': {
      backgroundColor: `${theme.palette.background.default} !important`,
    },
    '.BackstageHeader-header': {
      position: 'relative',
      zIndex: 0,
    },
    '.BackstagePage-root': {
      overflow: 'hidden',
    },
  },
  fixedHeaderOffset: {
    paddingTop: CHROME_TOP,
    minHeight: '100vh',
    backgroundColor: theme.palette.background.default,
  },
}));

const GlobalRestartBanner = () => {
  const { restartRequired, setRestartRequired } = useRestartRequired();
  if (!restartRequired) return null;

  return (
    <Box
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 24px',
        backgroundColor: 'rgba(240,173,78,0.15)',
        borderBottom: '1px solid rgba(240,173,78,0.3)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(8px)',
      }}
    >
      <WarningIcon style={{ fontSize: 20, color: '#f0ad4e', flexShrink: 0 }} />
      <Typography style={{ flex: 1, fontSize: 13, lineHeight: 1.5 }}>
        Configuration changes have been saved but require a portal restart to take effect.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        size="small"
        onClick={() => setRestartRequired(false)}
        style={{ textTransform: 'none', fontSize: 12, whiteSpace: 'nowrap' }}
      >
        Restart now
      </Button>
    </Box>
  );
};

const RoleAdaptiveSidebar = () => {
  const { model } = useNavIaModel();
  if (model === 'experiences') return <ExperiencesSidebar />;
  if (model === 'flat') return <FlatNavSidebar />;
  return <BaselineSidebar />; // Option 2 — curated sections
};

export const Root = ({ children }: PropsWithChildren<{}>) => {
  const rootClasses = useRootStyles();
  const location = useLocation();
  const isSetup = location.pathname.includes('/setup');

  if (isSetup) {
    return <>{children}</>;
  }

  return (
    <RestartProvider>
      <div className={rootClasses.fixedHeaderOffset}>
        <NavIaRouteGuard />
        <SidebarPage>
          <RoleAdaptiveSidebar />
          <GlobalRestartBanner />
          {children}
        </SidebarPage>
      </div>
    </RestartProvider>
  );
};
