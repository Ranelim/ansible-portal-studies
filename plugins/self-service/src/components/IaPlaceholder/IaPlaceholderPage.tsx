import { useMemo, useState } from 'react';
import { Page, Header, HeaderTabs, Content } from '@backstage/core-components';
import { Box, Chip, Typography } from '@material-ui/core';
import { IaPageConfig } from './navIaPages';

type Props = {
  config: IaPageConfig;
};

/**
 * Lightweight IA exploration page — purpose + tabs + one-line expectations.
 * Uses Backstage Page/Header/HeaderTabs + RHDH MUI theme (same shell as APME).
 */
export const IaPlaceholderPage = ({ config }: Props) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const tab = config.tabs[selectedTab] ?? config.tabs[0];

  const headerTabs = useMemo(
    () => config.tabs.map(t => ({ id: t.id, label: t.label })),
    [config.tabs],
  );

  return (
    <Page themeId="app">
      <Header
        title={
          <Box display="flex" alignItems="center" style={{ gap: 8 }}>
            <span>{config.title}</span>
            {config.preview && (
              <Chip
                label="Preview"
                size="small"
                variant="outlined"
                style={{ borderRadius: 16, fontSize: 11 }}
              />
            )}
            {config.antiPattern && (
              <Chip
                label="Anti-pattern"
                size="small"
                color="secondary"
                style={{ borderRadius: 16, fontSize: 11 }}
              />
            )}
            <Chip
              label="IA placeholder"
              size="small"
              variant="outlined"
              color="default"
              style={{ borderRadius: 16, fontSize: 11 }}
            />
          </Box>
        }
        pageTitleOverride={config.title}
        subtitle={config.subtitle}
      />
      {headerTabs.length > 0 && (
        <HeaderTabs
          selectedIndex={selectedTab}
          onChange={index => setSelectedTab(index)}
          tabs={headerTabs}
        />
      )}
      <Content>
        <Box maxWidth={640}>
          <Typography
            variant="body1"
            color="textSecondary"
            style={{ marginBottom: 16, lineHeight: 1.6 }}
          >
            {config.purpose}
          </Typography>
          {tab && (
            <Box
              style={{
                padding: 16,
                borderRadius: 4,
                backgroundColor: 'rgba(0,0,0,0.03)',
                marginBottom: 16,
              }}
            >
              <Typography variant="subtitle2" style={{ fontWeight: 600, marginBottom: 6 }}>
                {tab.label}
              </Typography>
              <Typography variant="body2" color="textSecondary" style={{ lineHeight: 1.5 }}>
                {tab.expect}
              </Typography>
            </Box>
          )}
          {config.also && (
            <Typography variant="body2" color="textSecondary" style={{ lineHeight: 1.5 }}>
              <strong>Also:</strong> {config.also}
            </Typography>
          )}
        </Box>
      </Content>
    </Page>
  );
};
