import { useEffect, useMemo, useState } from 'react';
import { Page, Header, HeaderTabs, Content } from '@backstage/core-components';
import { Box, Button, Chip, Typography, makeStyles } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import { useNavIaModel } from '../../hooks/useNavIaModel';
import { CreateFromTemplateDialog } from '../common/CreateFromTemplateDialog';
import { RESOURCE_TEMPLATE_COPY, ResourceTemplateKind } from '../common/resourceTemplates';
import { IaPageConfig, IaTab, landingTabIndex } from './navIaPages';

type Props = {
  config: IaPageConfig;
};

const useStyles = makeStyles(() => ({
  createButton: {
    textTransform: 'none',
    fontWeight: 500,
    borderRadius: 20,
    whiteSpace: 'nowrap',
  },
}));

function tabsForModel(
  tabs: IaTab[],
  experiencesModel: boolean,
): IaTab[] {
  // Experiences: overview on experience Dashboard; entity pages list-first.
  // Object create = header CTA → modal (no trailing Templates tab).
  let next = tabs;
  if (experiencesModel) {
    next = next.filter(t => t.slot !== 'dashboard' && t.id !== 'dashboard');
  }
  return next.filter(t => t.slot !== 'trailing' && t.id !== 'templates');
}

function createKindForPage(config: IaPageConfig): ResourceTemplateKind | null {
  if (config.createKind) return config.createKind;
  if (config.title === 'Inventories') return 'inventory';
  if (config.title === 'Edge fleets') return 'edge-fleet';
  return null;
}

/**
 * Lightweight IA exploration page — purpose + tabs + one-line expectations.
 * Lands on Dashboard when present, else the entity list tab.
 * Under Experiences, Dashboard + trailing Templates tabs are omitted;
 * Create is a header button that opens a filtered template modal.
 */
export const IaPlaceholderPage = ({ config }: Props) => {
  const classes = useStyles();
  const { model } = useNavIaModel();
  const experiencesModel = model === 'experiences';
  const createKind = createKindForPage(config);
  const [createOpen, setCreateOpen] = useState(false);

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
    ? `${config.purpose
        .replace(/Dashboard \(landing\)\s*→\s*/i, '')
        .replace(
          /\s*→\s*Templates\.?/i,
          '. Create uses a header button → template modal.',
        )} Under Experiences, experience Dashboard owns overview — this page lands on the list.`
    : config.purpose;

  const createCopy = createKind ? RESOURCE_TEMPLATE_COPY[createKind] : null;

  return (
    <Page themeId="app">
      <Header
        title={
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            width="100%"
            style={{ gap: 8 }}
          >
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
            {createKind && createCopy && (
              <Button
                variant="contained"
                color="primary"
                size="small"
                className={classes.createButton}
                startIcon={<AddIcon />}
                onClick={() => setCreateOpen(true)}
              >
                {createCopy.createLabel}
              </Button>
            )}
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
      {createKind && (
        <CreateFromTemplateDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          kind={createKind}
        />
      )}
    </Page>
  );
};
