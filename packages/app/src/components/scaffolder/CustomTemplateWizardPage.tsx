import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Box, Typography, useTheme } from '@material-ui/core';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { useLocation } from 'react-router-dom';

const BANNER_ID = 'workflow-approval-banner';

const ApprovalBannerContent = () => {
  const theme = useTheme();
  const isDark = theme.palette.type === 'dark';
  return (
    <Box
      id={BANNER_ID}
      display="flex"
      alignItems="flex-start"
      style={{
        gap: 10,
        padding: '12px 16px',
        marginBottom: 16,
        borderRadius: 4,
        backgroundColor: isDark ? 'rgba(41, 121, 255, 0.08)' : 'rgba(41, 121, 255, 0.06)',
        border: `1px solid ${isDark ? 'rgba(41, 121, 255, 0.25)' : 'rgba(41, 121, 255, 0.2)'}`,
      }}
    >
      <InfoOutlinedIcon style={{ fontSize: 18, color: '#2979ff', marginTop: 2, flexShrink: 0 }} />
      <Typography variant="body2" style={{ color: isDark ? '#e0e0e0' : 'rgba(0,0,0,0.7)', lineHeight: 1.5 }}>
        This workflow requires approval at one or more steps. Completion time depends on when approvals are granted.
      </Typography>
    </Box>
  );
};

export const WorkflowApprovalBanner = () => {
  const location = useLocation();
  const catalogApi = useApi(catalogApiRef);
  const [isWorkflow, setIsWorkflow] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    const match = location.pathname.match(/\/create\/templates\/([^/]+)\/([^/]+)/);
    if (!match) {
      setIsWorkflow(false);
      return;
    }
    const [, namespace, templateName] = match;
    const checkType = async () => {
      try {
        const ref = stringifyEntityRef({ kind: 'Template', namespace, name: templateName });
        const entity = await catalogApi.getEntityByRef(ref);
        const specType = (entity?.spec as Record<string, unknown>)?.type;
        setIsWorkflow(specType === 'workflow-job-template');
      } catch {
        setIsWorkflow(false);
      }
    };
    checkType();
  }, [location.pathname, catalogApi]);

  const findAndSetTarget = useCallback(() => {
    if (!isWorkflow) return;
    if (document.getElementById(BANNER_ID)) return;

    // Find the Stepper container inside the scaffolder wizard — the banner goes before it
    const stepper = document.querySelector('[class*="MuiStepper-root"]');
    if (stepper?.parentElement) {
      // Create a container div before the stepper
      const container = document.createElement('div');
      stepper.parentElement.insertBefore(container, stepper);
      setPortalTarget(container);
    }
  }, [isWorkflow]);

  useEffect(() => {
    if (!isWorkflow) {
      setPortalTarget(null);
      return;
    }

    // Try immediately
    findAndSetTarget();

    // Observe DOM for when the wizard form renders
    observerRef.current = new MutationObserver(() => findAndSetTarget());
    observerRef.current.observe(document.body, { childList: true, subtree: true });

    return () => {
      observerRef.current?.disconnect();
      if (portalTarget?.parentElement) {
        portalTarget.parentElement.removeChild(portalTarget);
      }
    };
  }, [isWorkflow, findAndSetTarget]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isWorkflow || !portalTarget) return null;
  return createPortal(<ApprovalBannerContent />, portalTarget);
};
