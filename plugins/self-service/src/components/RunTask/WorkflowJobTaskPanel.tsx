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
import {
  computeWorkflowLayers,
  extractWorkflowEdges,
  groupNodesIntoLayers,
  isTerminalUnifiedJobStatus,
  resolveSpawnedJobId,
  spawnedUnifiedJobStatus,
  type AapLogEntry,
} from './buildWorkflowLayers';
import { WorkflowGraph } from './WorkflowGraph';

const POLL_INTERVAL_MS = 8000;
const STDOUT_POLL_WHILE_RUNNING_MS = 4000;

function isTerminalWorkflowStatus(status: string): boolean {
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

export type WorkflowJobTaskPanelProps = {
  workflowJobId?: number;
  aapToken: string;
  workflowJobTemplateId?: number;
  openInAapUrl?: string;
  initialStatus?: string;
  previewBanner?: string;
  outputText?: Array<{ content?: string; title?: string }>;
  onLogsChange?: (logs: AapLogEntry[]) => void;
};

export function WorkflowJobTaskPanel(props: WorkflowJobTaskPanelProps) {
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const theme = useTheme();
  const isDark = theme.palette.type === 'dark';

  const hasLiveWorkflowJob = useMemo(() => {
    const id = props.workflowJobId;
    return id !== undefined && Number.isFinite(Number(id)) && Number(id) > 0;
  }, [props.workflowJobId]);

  const [workflowJob, setWorkflowJob] = useState<Record<string, unknown> | null>(null);
  const [nodes, setNodes] = useState<Record<string, unknown>[]>([]);
  const [templateNodes, setTemplateNodes] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nodeStdouts, setNodeStdouts] = useState<Record<number, string>>({});
  const [nodeStdoutsLoading, setNodeStdoutsLoading] = useState(false);

  const [viewMode, setViewMode] = useState<'strip' | 'logs' | 'graph'>('strip');
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});

  const toggleNode = (id: number) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchLiveState = useCallback(async () => {
    const base = await discoveryApi.getBaseUrl('catalog');
    const headers = { 'X-AAP-Bearer-Token': props.aapToken };

    if (!hasLiveWorkflowJob) {
      let wfjtId =
        props.workflowJobTemplateId !== undefined &&
        Number.isFinite(Number(props.workflowJobTemplateId))
          ? Number(props.workflowJobTemplateId)
          : undefined;

      if (!(wfjtId !== undefined && wfjtId > 0)) {
        throw new Error('Workflow template id missing — cannot load workflow preview.');
      }

      setWorkflowJob(null);
      setNodes([]);

      const templateRes = await fetchApi.fetch(
        `${base}/ansible/aap/workflow-job-templates/${wfjtId}/workflow_nodes`,
        { headers },
      );
      if (!templateRes.ok) {
        const t = await templateRes.text();
        throw new Error(t || templateRes.statusText);
      }
      const templateJson = await templateRes.json();
      setTemplateNodes(
        Array.isArray(templateJson.results) ? (templateJson.results as Record<string, unknown>[]) : [],
      );
      setError(null);
      return;
    }

    const wfJobId = Number(props.workflowJobId);
    const wfRes = await fetchApi.fetch(`${base}/ansible/aap/workflow-jobs/${wfJobId}`, { headers });
    const nodeRes = await fetchApi.fetch(`${base}/ansible/aap/workflow-jobs/${wfJobId}/workflow_nodes`, { headers });

    if (!wfRes.ok) {
      const t = await wfRes.text();
      throw new Error(t || wfRes.statusText);
    }
    if (!nodeRes.ok) {
      const t = await nodeRes.text();
      throw new Error(t || nodeRes.statusText);
    }

    const wfJson = (await wfRes.json()) as Record<string, unknown>;
    const nodeJson = await nodeRes.json();
    setWorkflowJob(wfJson);

    let wfjtId =
      props.workflowJobTemplateId !== undefined && Number.isFinite(Number(props.workflowJobTemplateId))
        ? Number(props.workflowJobTemplateId) : undefined;

    const sf = wfJson.summary_fields as Record<string, unknown> | undefined;
    const wjt = sf?.workflow_job_template as { id?: unknown } | undefined;
    if (wjt?.id !== undefined) {
      const n = Number(wjt.id);
      if (Number.isFinite(n) && n > 0) wfjtId = wfjtId ?? n;
    }

    const runtimeResults = Array.isArray(nodeJson.results) ? (nodeJson.results as Record<string, unknown>[]) : [];
    setNodes(runtimeResults);

    if (wfjtId !== undefined && wfjtId > 0) {
      const templateRes = await fetchApi.fetch(
        `${base}/ansible/aap/workflow-job-templates/${wfjtId}/workflow_nodes`,
        { headers },
      );
      if (templateRes.ok) {
        const templateJson = await templateRes.json();
        setTemplateNodes(Array.isArray(templateJson.results) ? (templateJson.results as Record<string, unknown>[]) : []);
      } else {
        setTemplateNodes([]);
      }
    } else {
      setTemplateNodes([]);
    }

    setError(null);
  }, [discoveryApi, fetchApi, props.aapToken, props.workflowJobId, props.workflowJobTemplateId, hasLiveWorkflowJob]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        await fetchLiveState();
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fetchLiveState]);

  const wfStatusRaw = String(workflowJob?.status ?? '').trim();
  const wfStatus = wfStatusRaw || (props.initialStatus ? String(props.initialStatus) : '') || (!hasLiveWorkflowJob ? 'pending launch' : 'unknown');
  const terminal = wfStatusRaw !== '' && isTerminalWorkflowStatus(wfStatusRaw);

  useEffect(() => {
    if (!hasLiveWorkflowJob || workflowJob === null || terminal) return undefined;
    const id = window.setInterval(() => {
      void fetchLiveState().catch(e => setError(e instanceof Error ? e.message : String(e)));
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [hasLiveWorkflowJob, workflowJob, terminal, fetchLiveState]);

  const graphNodesForWorkflow = useMemo(() => nodes.length > 0 ? nodes : templateNodes, [nodes, templateNodes]);
  const skeletonTemplateTopology = nodes.length === 0 && templateNodes.length > 0;
  const workflowFlatNodes = useMemo(() => computeWorkflowLayers(graphNodesForWorkflow), [graphNodesForWorkflow]);
  const layers = useMemo(() => groupNodesIntoLayers(workflowFlatNodes), [workflowFlatNodes]);
  const edges = useMemo(() => extractWorkflowEdges(graphNodesForWorkflow), [graphNodesForWorkflow]);
  const runtimeFlatNodesForLogs = useMemo(() => computeWorkflowLayers(nodes), [nodes]);

  const nodesWithJobs = useMemo(
    () => runtimeFlatNodesForLogs.filter(n => {
      const raw = nodes.find(raw_ => Number(raw_.id) === n.id);
      return raw ? !!resolveSpawnedJobId(raw) : false;
    }),
    [runtimeFlatNodesForLogs, nodes],
  );

  useEffect(() => {
    if (nodesWithJobs.length === 0) return undefined;
    let cancelled = false;
    setNodeStdoutsLoading(true);

    const loadAll = async () => {
      const base = await discoveryApi.getBaseUrl('catalog');
      const results: Record<number, string> = {};
      await Promise.all(
        nodesWithJobs.map(async n => {
          const raw = nodes.find(raw_ => Number(raw_.id) === n.id);
          const jid = raw ? resolveSpawnedJobId(raw) : undefined;
          if (!jid) return;
          try {
            const r = await fetchApi.fetch(`${base}/ansible/aap/jobs/${jid}/stdout`, { headers: { 'X-AAP-Bearer-Token': props.aapToken } });
            if (!r.ok) {
              results[n.id] = `[Log unavailable] Could not retrieve output for this node (HTTP ${r.status}). The node itself may have completed normally.`;
            } else {
              results[n.id] = await r.text();
            }
          } catch {
            results[n.id] = '[Log unavailable] Could not connect to Ansible Automation Platform to retrieve output. The node execution status is shown above.';
          }
        }),
      );
      if (!cancelled) {
        setNodeStdouts(results);
        setNodeStdoutsLoading(false);
      }
    };

    void loadAll();
    const anyRunning = nodesWithJobs.some(n => {
      const raw = nodes.find(raw_ => Number(raw_.id) === n.id);
      if (!raw) return false;
      const st = spawnedUnifiedJobStatus(raw);
      return st !== undefined && !isTerminalUnifiedJobStatus(st);
    });
    let pollTimer: number | undefined;
    if (anyRunning) {
      pollTimer = window.setInterval(() => { void loadAll(); }, STDOUT_POLL_WHILE_RUNNING_MS);
    }
    return () => { cancelled = true; if (pollTimer !== undefined) window.clearInterval(pollTimer); };
  }, [nodesWithJobs, nodes, discoveryApi, fetchApi, props.aapToken]);

  useEffect(() => {
    if (!props.onLogsChange) return;
    const logs: AapLogEntry[] = runtimeFlatNodesForLogs.map(n => {
      const raw = nodes.find(r => Number(r.id) === n.id);
      const hasJob = raw ? !!resolveSpawnedJobId(raw) : false;
      return {
        id: n.id,
        label: n.label,
        status: n.statusLabel,
        hasPlaybookOutput: hasJob,
        content: nodeStdouts[n.id] ?? undefined,
        loading: nodeStdoutsLoading && !nodeStdouts[n.id],
      };
    });
    props.onLogsChange(logs);
  }, [runtimeFlatNodesForLogs, nodeStdouts, nodeStdoutsLoading, nodes, props.onLogsChange]); // eslint-disable-line react-hooks/exhaustive-deps

  const statusColor = (s?: string) => {
    if (!s) return isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)';
    const sl = s.toLowerCase();
    if (sl === 'successful') return '#4caf50';
    if (sl === 'failed' || sl === 'error') return '#f44336';
    if (sl === 'running') return '#42a5f5';
    if (sl === 'pending' || sl === 'waiting') return isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)';
    return isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)';
  };

  const wfStatusColor = wfStatus === 'successful' ? '#4caf50' : wfStatus === 'failed' || wfStatus === 'error' ? '#f44336' : wfStatus === 'canceled' ? '#ff9800' : wfStatus === 'running' ? '#42a5f5' : '#ff9800';
  const viewLabels: Record<string, string> = { strip: 'Pipeline', logs: 'Logs', graph: 'Graph' };

  const logEntries: AapLogEntry[] = useMemo(() => {
    if (runtimeFlatNodesForLogs.length > 0) {
      return runtimeFlatNodesForLogs.map(n => {
        const raw = nodes.find(r => Number(r.id) === n.id);
        const hasJob = raw ? !!resolveSpawnedJobId(raw) : false;
        const logContent = nodeStdouts[n.id];
        return {
          id: n.id,
          label: n.label,
          status: n.statusLabel,
          hasPlaybookOutput: hasJob,
          content: logContent?.startsWith('[Log unavailable]') ? logContent.replace('[Log unavailable] ', '') : logContent,
          loading: nodeStdoutsLoading && !nodeStdouts[n.id],
        };
      });
    }
    return workflowFlatNodes.map(n => ({
      id: n.id,
      label: n.label,
      status: n.statusLabel,
      hasPlaybookOutput: false,
      content: undefined,
      loading: false,
    }));
  }, [runtimeFlatNodesForLogs, workflowFlatNodes, nodes, nodeStdouts, nodeStdoutsLoading]);

  return (
    <Box>
      {/* Header: title + tooltip */}
      <Box display="flex" alignItems="center" style={{ gap: 6 }}>
        <Typography variant="h6" color="textPrimary">
          AAP Automation workflow
        </Typography>
        <Tooltip title="This section shows the execution details of the AAP Workflow Job Template, including node status, approval gates, and per-node logs from Ansible Automation Platform.">
          <HelpOutlineIcon style={{ fontSize: 16, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)', cursor: 'help' }} />
        </Tooltip>
      </Box>

      {/* Job ID link + status */}
      <Box display="flex" alignItems="center" style={{ gap: 8, marginBottom: 12, marginTop: 4 }}>
        {hasLiveWorkflowJob && props.openInAapUrl ? (
          <Link
            href={props.openInAapUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="body2"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            Workflow job {props.workflowJobId}
            <OpenInNewIcon style={{ fontSize: 14 }} />
          </Link>
        ) : hasLiveWorkflowJob ? (
          <Typography variant="body2" color="textSecondary">
            Workflow job {props.workflowJobId}
          </Typography>
        ) : (
          <Typography variant="body2" color="textSecondary">
            Workflow job pending
          </Typography>
        )}
        <Typography variant="body2" color="textSecondary">—</Typography>
        <Typography variant="body2" style={{ fontWeight: 500, color: wfStatusColor }}>
          {wfStatus}
        </Typography>
      </Box>

      {props.previewBanner ? (
        <Alert severity="info" style={{ marginBottom: 12 }}>{props.previewBanner}</Alert>
      ) : null}

      {loading ? (
        <Box display="flex" justifyContent="center" padding={2}>
          <CircularProgress size={28} />
        </Box>
      ) : null}

      {error && wfStatus !== 'successful' ? (
        <Alert severity="error" style={{ marginBottom: 12 }}>{error}</Alert>
      ) : null}

      {skeletonTemplateTopology && (
        <Alert severity="info" style={{ marginBottom: 12 }}>
          Showing template topology. Live status appears when the workflow starts.
        </Alert>
      )}

      {logEntries.length === 0 && !loading ? (
        <Typography variant="body2" color="textSecondary">
          Workflow nodes will appear here as the job starts.
        </Typography>
      ) : logEntries.length > 0 ? (
        <>
          {/* View mode selector */}
          <Box display="flex" alignItems="center" justifyContent="flex-end" marginBottom={1}>
            <Box display="flex" style={{ gap: 0, border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.23)'}`, borderRadius: 4, overflow: 'hidden' }}>
              {(['strip', 'logs', 'graph'] as const).map(mode => (
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
                {logEntries.map((log, idx) => (
                  <Box key={log.id} display="flex" alignItems="center">
                    {idx > 0 && (
                      <Box style={{ width: 32, height: 2, background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)', flexShrink: 0 }} />
                    )}
                    <Box
                      display="flex"
                      alignItems="center"
                      style={{
                        gap: 6,
                        padding: '4px 10px',
                        borderRadius: 16,
                        border: `1px solid ${statusColor(log.status)}`,
                        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      <NodeStatusIcon status={log.status} isDark={isDark} />
                      <Typography variant="caption" color="textPrimary" style={{ fontWeight: 500 }}>
                        {log.label}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              {logEntries.map(log => (
                <Box
                  key={log.id}
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
                      borderLeft: `3px solid ${statusColor(log.status)}`,
                    }}
                  >
                    <NodeStatusIcon status={log.status} isDark={isDark} />
                    <Typography variant="subtitle2" color="textPrimary">{log.label}</Typography>
                    <Typography variant="caption" style={{ color: isDark ? '#b0b0b0' : 'rgba(0,0,0,0.5)' }}>{log.status}</Typography>
                    <Box style={{ flex: 1 }} />
                    {log.content ? (
                      <Button
                        size="small"
                        onClick={() => toggleNode(log.id)}
                        style={{ textTransform: 'none', fontSize: 12, padding: '2px 8px', minWidth: 0, color: isDark ? '#90caf9' : undefined }}
                      >
                        {expandedNodes[log.id] ? 'Hide log' : 'View log'}
                      </Button>
                    ) : log.hasPlaybookOutput === false ? (
                      <Typography variant="caption" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', fontStyle: 'italic' }}>
                        No playbook output
                      </Typography>
                    ) : log.loading ? (
                      <CircularProgress size={14} />
                    ) : null}
                  </Box>
                  {expandedNodes[log.id] && log.content && (
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
                      {log.content}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}

          {/* === LOGS VIEW (flat, all logs visible) === */}
          {viewMode === 'logs' && (
            <Box>
              {nodeStdoutsLoading && Object.keys(nodeStdouts).length === 0 ? (
                <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="textSecondary">Loading node logs...</Typography>
                </Box>
              ) : (
                logEntries.map(log => (
                  <Box key={log.id} marginBottom={2}>
                    <Box display="flex" alignItems="center" style={{ gap: 8, marginBottom: 6 }}>
                      <NodeStatusIcon status={log.status} isDark={isDark} />
                      <Typography variant="subtitle2" color="textPrimary">{log.label}</Typography>
                      <Typography variant="caption" style={{ color: isDark ? '#b0b0b0' : 'rgba(0,0,0,0.5)' }}>{log.status}</Typography>
                    </Box>
                    {log.content ? (
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
                        {log.content}
                      </Box>
                    ) : (
                      <Typography variant="body2" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', fontStyle: 'italic', paddingLeft: 26 }}>
                        {log.hasPlaybookOutput === false ? 'No playbook output (approval or inventory update node).' : 'No output available yet.'}
                      </Typography>
                    )}
                  </Box>
                ))
              )}
            </Box>
          )}

          {/* === GRAPH VIEW (React Flow DAG) === */}
          {viewMode === 'graph' && (
            <Box style={{ minHeight: 350 }}>
              {layers.length > 0 ? (
                <WorkflowGraph
                  layeredNodes={layers}
                  edges={edges}
                  selectedNodeId={null}
                  hasRuntime={nodes.length > 0}
                  onNodeClick={() => {}}
                />
              ) : (
                <Typography variant="body2" color="textSecondary">
                  Graph data not available yet.
                </Typography>
              )}
            </Box>
          )}
        </>
      ) : null}
    </Box>
  );
}
