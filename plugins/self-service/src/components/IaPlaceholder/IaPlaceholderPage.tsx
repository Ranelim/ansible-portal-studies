import { useEffect, useMemo, useState } from 'react';
import { Page, Header, HeaderTabs, Content } from '@backstage/core-components';
import { Box, Chip, Typography } from '@material-ui/core';
import { useNavIaModel } from '../../hooks/useNavIaModel';
import { IaPageConfig, IaTab, landingTabIndex } from './navIaPages';

type Props = {
  config: IaPageConfig;
};

function tabsForModel(
  tabs: IaTab[],
  experiencesModel: boolean,
): IaTab[] {
  // Option 3: overview lives on the experience Dashboard rail item —
  // entity pages stay list-first (no Dashboard tab).
  if (!experiencesModel) return tabs;
  return tabs.filter(t => t.slot !== 'dashboard' && t.id !== 'dashboard');
}

/**
 * Lightweight IA exploration page — purpose + tabs + one-line expectations.
 * Lands on Dashboard when present, else the entity list tab.
 * Under Option 3, Dashboard tabs are omitted (experience Dashboard owns overview).
 */
export const IaPlaceholderPage = ({ config }: Props) => {
  const { model } = useNavIaModel();
  const experiencesModel = model === 'experiences';
  const tabs = useMemo(
    () => tabsForModel(config.tabs, experiencesModel),
    [config.tabs, experiencesModel],
  );

  const [selectedTab, setSelectedTab] = useState(() =>
    landingTabIndex(tabsForModel(config.tabs, experiencesModel)),
  );

  useEffect(() => {
    setSelectedTab(landingTabIndex(tabs));
  }, [tabs]);

  const tab = tabs[selectedTab] ?? tabs[0];

  const headerTabs = useMemo(
    () => tabs.map(t => ({ id: t.id, label: t.label })),
    [tabs],
  );

  const purpose = experiencesModel
    ? `${config.purpose.replace(
        /Dashboard \(landing\)\s*→\s*/i,
        '',
      )} Under Option 3, experience Dashboard owns overview — this page lands on the list.`
    : config.purpose;

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
        <Box maxWidth={720}>
          <Typography
            variant="body1"
            color="textSecondary"
            style={{ marginBottom: 16, lineHeight: 1.6 }}
          >
            {purpose}
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
              <Typography
                variant="subtitle2"
                style={{ fontWeight: 600, marginBottom: 6 }}
              >
                {tab.label}
                {tab.slot ? (
                  <Typography
                    component="span"
                    variant="caption"
                    color="textSecondary"
                    style={{ marginLeft: 8 }}
                  >
                    ({tab.slot}
                    {(tab.slot === 'dashboard' ||
                      (tab.slot === 'list' &&
                        !tabs.some(t => t.slot === 'dashboard'))) &&
                      ' · landing'}
                    )
                  </Typography>
                ) : null}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                style={{ lineHeight: 1.5 }}
              >
                {tab.expect}
              </Typography>
            </Box>
          )}
          {config.also && (
            <Typography
              variant="body2"
              color="textSecondary"
              style={{ lineHeight: 1.5 }}
            >
              <strong>Also:</strong> {config.also}
            </Typography>
          )}
        </Box>
      </Content>
    </Page>
  );
};
