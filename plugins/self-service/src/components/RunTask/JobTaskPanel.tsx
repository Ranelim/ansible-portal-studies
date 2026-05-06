/*
 * Copyright 2026 The Ansible plugin Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import {
  Box,
  Button,
  CircularProgress,
  Link,
  Tooltip,
  Typography,
  useTheme,
} from '@material-ui/core';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import { Alert } from '@material-ui/lab';
import type { AapLogEntry } from './buildWorkflowLayers';

const STDOUT_POLL_MS = 4000;

function isTerminalJobStatus(status: string): boolean {
  const s = status.toLowerCase();
  return ['successful', 'failed', 'error', 'canceled'].includes(s);
}

function NodeStatusIcon({ status, isDark }: { status?: string; isDark: boolean }) {
  const sl = (status ?? '').toLowerCase();
  if (sl === 'successful') return <CheckCircleOutlineIcon style={{ fontSize: 16, color: '#4caf50' }} />;
  if (sl === 'failed' || sl === 'error') return <ErrorOutlineIcon style={{ fontSize: 16, color: '#f44336' }} />;
  if (sl === 'running') return <CircularProgress size={14} style={{ color: '#42a5f5' }} />;
  if (sl === 'pending' || sl === 'waiting') return <MoreHorizIcon style={{ fontSize: 16, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)' }} />;
  return <Box style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}` }} />;
}

export type JobTaskPanelProps = {
  jobId: number;
  jobName?: string;
  aapToken: string;
  openInAapUrl?: string;
  initialStatus?: string;
  outputText?: Array<{ content?: string; title?: string }>;
  onLogsChange?: (logs: AapLogEntry[]) => void;
};

export function JobTaskPanel(props: JobTaskPanelProps) {
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const theme = useTheme();
  const isDark = theme.palette.type === 'dark';

  const [jobData, setJobData] = useState<Record<string, unknown> | null>(null);
  const [stdout, setStdout] = useState<string | null>(null);
  const [stdoutLoading, setStdoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<'strip' | 'logs'>('strip');
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});

  const toggleNode = (id: number) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchJobState = useCallback(async () => {
    const base = await discoveryApi.getBaseUrl('catalog');
    try {
      const r = await fetchApi.fetch(
        `${base}/ansible/aap/jobs/${props.jobId}`,
        { headers: { 'X-AAP-Bearer-Token': props.aapToken } },
      );
      if (!r.ok) throw new Error(`Job fetch failed: ${r.status}`);
      const data = (await r.json()) as Record<string, unknown>;
      setJobData(data);
      setLoading(false);
      return data;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load job from AAP.');
      setLoading(false);
      return null;
    }
  }, [discoveryApi, fetchApi, props.jobId, props.aapToken]);

  const fetchStdout = useCallback(async () => {
    const base = await discoveryApi.getBaseUrl('catalog');
    try {
      const r = await fetchApi.fetch(
        `${base}/ansible/aap/jobs/${props.jobId}/stdout`,
        { headers: { 'X-AAP-Bearer-Token': props.aapToken } },
      );
      setStdout(await r.text());
    } catch {
      setStdout('Could not load job output from Ansible Automation Platform.');
    }
    setStdoutLoading(false);
  }, [discoveryApi, fetchApi, props.jobId, props.aapToken]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setStdoutLoading(true);

    void fetchJobState();
    void fetchStdout();

    const pollTimer = window.setInterval(async () => {
      if (cancelled) return;
      const data = await fetchJobState();
      await fetchStdout();
      if (data) {
        const status = String(data.status ?? '').toLowerCase();
        if (isTerminalJobStatus(status)) window.clearInterval(pollTimer);
      }
    }, STDOUT_POLL_MS);

    return () => { cancelled = true; window.clearInterval(pollTimer); };
  }, [fetchJobState, fetchStdout]);

  const jobStatus = useMemo(() => {
    if (jobData?.status) return String(jobData.status);
    return props.initialStatus ?? undefined;
  }, [jobData, props.initialStatus]);

  const jobName = useMemo(() => {
    if (props.jobName) return props.jobName;
    if (jobData?.name) return String(jobData.name);
    const sf = jobData?.summary_fields as Record<string, unknown> | undefined;
    const jt = sf?.job_template as { name?: string } | undefined;
    return jt?.name ?? `Job ${props.jobId}`;
  }, [props.jobName, props.jobId, jobData]);

  useEffect(() => {
    if (!props.onLogsChange) return;
    props.onLogsChange([{
      id: props.jobId,
      label: jobName,
      status: jobStatus,
      hasPlaybookOutput: true,
      content: stdout ?? undefined,
      loading: stdoutLoading && !stdout,
    }]);
  }, [props.jobId, jobName, jobStatus, stdout, stdoutLoading, props.onLogsChange]); // eslint-disable-line react-hooks/exhaustive-deps

  const statusColor = (s?: string) => {
    if (!s) return isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)';
    const sl = s.toLowerCase();
    if (sl === 'successful') return '#4caf50';
    if (sl === 'failed' || sl === 'error') return '#f44336';
    if (sl === 'running') return '#42a5f5';
    return isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)';
  };

  const jobStatusColor = jobStatus === 'successful' ? '#4caf50' : jobStatus === 'failed' || jobStatus === 'error' ? '#f44336' : jobStatus === 'canceled' ? '#ff9800' : jobStatus === 'running' ? '#42a5f5' : isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';

  const viewLabels: Record<string, string> = { strip: 'Pipeline', logs: 'Logs' };
  const logEntry: AapLogEntry = useMemo(() => ({
    id: props.jobId,
    label: jobName,
    status: jobStatus,
    hasPlaybookOutput: true,
    content: stdout ?? undefined,
    loading: stdoutLoading && !stdout,
  }), [props.jobId, jobName, jobStatus, stdout, stdoutLoading]);

  return (
    <Box>
      {/* Header: title + tooltip */}
      <Box display="flex" alignItems="center" style={{ gap: 6 }}>
        <Typography variant="h6" color="textPrimary">
          AAP Automation job
        </Typography>
        <Tooltip title="This section shows the execution details of the AAP Job Template, including playbook output and status from Ansible Automation Platform.">
          <HelpOutlineIcon style={{ fontSize: 16, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)', cursor: 'help' }} />
        </Tooltip>
      </Box>

      {/* Job ID link + status */}
      <Box display="flex" alignItems="center" style={{ gap: 8, marginBottom: 12, marginTop: 4 }}>
        {props.openInAapUrl ? (
          <Link
            href={props.openInAapUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="body2"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            Job {props.jobId}
            <OpenInNewIcon style={{ fontSize: 14 }} />
          </Link>
        ) : (
          <Typography variant="body2" color="textSecondary">
            Job {props.jobId}
          </Typography>
        )}
        {jobStatus && (
          <>
            <Typography variant="body2" color="textSecondary">—</Typography>
            <Typography variant="body2" style={{ fontWeight: 500, color: jobStatusColor }}>
              {jobStatus}
            </Typography>
          </>
        )}
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" padding={2}>
          <CircularProgress size={28} />
        </Box>
      ) : null}

      {error && !(jobStatus === 'successful') ? (
        <Alert severity="error" style={{ marginBottom: 12 }}>{error}</Alert>
      ) : null}

      {/* View mode selector */}
      <Box display="flex" alignItems="center" justifyContent="flex-end" marginBottom={1}>
        <Box display="flex" style={{ gap: 0, border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.23)'}`, borderRadius: 4, overflow: 'hidden' }}>
          {(['strip', 'logs'] as const).map(mode => (
            <Button
              key={mode}
              size="small"
              onClick={() => setViewMode(mode)}
              style={{
                textTransform: 'none',
                fontSize: 12,
                padding: '3px 12px',
                minWidth: 0,
                borderRadius: 0,
                background: viewMode === mode ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)') : 'transparent',
                color: viewMode === mode ? (isDark ? '#fff' : '#000') : (isDark ? '#b0b0b0' : 'rgba(0,0,0,0.5)'),
                fontWeight: viewMode === mode ? 600 : 400,
              }}
            >
              {viewLabels[mode]}
            </Button>
          ))}
        </Box>
      </Box>

      {/* === STRIP VIEW (default) === */}
      {viewMode === 'strip' && (
        <Box>
          {/* Single-node strip */}
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              overflowX: 'auto',
              padding: '12px 8px',
              marginBottom: 16,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
              borderRadius: 4,
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
            }}
          >
            <Box
              display="flex"
              alignItems="center"
              style={{
                gap: 6,
                padding: '4px 10px',
                borderRadius: 16,
                border: `1px solid ${statusColor(logEntry.status)}`,
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <NodeStatusIcon status={logEntry.status} isDark={isDark} />
              <Typography variant="caption" color="textPrimary" style={{ fontWeight: 500 }}>
                {logEntry.label}
              </Typography>
            </Box>
          </Box>

          {/* Node card with expandable log */}
          <Box
            style={{
              borderRadius: 4,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
              marginBottom: 8,
              overflow: 'hidden',
            }}
          >
            <Box
              display="flex"
              alignItems="center"
              style={{
                gap: 8,
                padding: '10px 12px',
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                borderLeft: `3px solid ${statusColor(logEntry.status)}`,
              }}
            >
              <NodeStatusIcon status={logEntry.status} isDark={isDark} />
              <Typography variant="subtitle2" color="textPrimary">{logEntry.label}</Typography>
              <Typography variant="caption" style={{ color: isDark ? '#b0b0b0' : 'rgba(0,0,0,0.5)' }}>{logEntry.status}</Typography>
              <Box style={{ flex: 1 }} />
              {logEntry.content ? (
                <Button
                  size="small"
                  onClick={() => toggleNode(logEntry.id)}
                  style={{ textTransform: 'none', fontSize: 12, padding: '2px 8px', minWidth: 0, color: isDark ? '#90caf9' : undefined }}
                >
                  {expandedNodes[logEntry.id] ? 'Hide log' : 'View log'}
                </Button>
              ) : logEntry.loading ? (
                <CircularProgress size={14} />
              ) : null}
            </Box>
            {expandedNodes[logEntry.id] && logEntry.content && (
              <Box
                component="pre"
                style={{
                  margin: 0,
                  padding: '10px 12px 10px 15px',
                  borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                  background: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.03)',
                  color: isDark ? '#e0e0e0' : '#1e1e1e',
                  fontSize: 12,
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  overflowX: 'auto',
                }}
              >
                {logEntry.content}
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* === LOGS VIEW (flat) === */}
      {viewMode === 'logs' && (
        <Box>
          {stdoutLoading && !stdout ? (
            <Box display="flex" alignItems="center" style={{ gap: 8 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="textSecondary">Loading job output...</Typography>
            </Box>
          ) : stdout ? (
            <Box>
              <Box display="flex" alignItems="center" style={{ gap: 8, marginBottom: 6 }}>
                <NodeStatusIcon status={logEntry.status} isDark={isDark} />
                <Typography variant="subtitle2" color="textPrimary">{logEntry.label}</Typography>
                <Typography variant="caption" style={{ color: isDark ? '#b0b0b0' : 'rgba(0,0,0,0.5)' }}>{logEntry.status}</Typography>
              </Box>
              <Box
                component="pre"
                style={{
                  margin: 0,
                  padding: '10px 12px',
                  borderRadius: 4,
                  background: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.03)',
                  color: isDark ? '#e0e0e0' : '#1e1e1e',
                  fontSize: 12,
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  overflowX: 'auto',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                }}
              >
                {stdout}
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" color="textSecondary">No output available yet.</Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
