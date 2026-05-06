/*
 * Copyright 2026 The Ansible plugin Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 */

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '@backstage/core-plugin-api';
import { rhAapAuthApiRef } from '../../apis';
import {
  Box,
  CircularProgress,
  Link,
  Paper,
  Typography,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { useTaskEventStream } from '@backstage/plugin-scaffolder-react';
import { JobTaskPanel } from './JobTaskPanel';
import type { AapLogEntry } from './buildWorkflowLayers';
import { pickAapTokenFromParameters } from './runTaskParameters';

interface JobLaunchOutput {
  id: number;
  url?: string;
  status?: string;
}

function extractJobLaunchFromSteps(
  allSteps: Record<string, unknown>[],
  stepsMap: Record<string, unknown> | undefined,
): JobLaunchOutput | null {
  for (const step of allSteps) {
    if (step.action !== 'rhaap:launch-job-template') continue;

    const output = step.output as Record<string, unknown> | undefined;
    if (!output?.data) continue;

    const data = output.data as Record<string, unknown>;
    const id = Number(data.id);
    if (!Number.isFinite(id) || id <= 0) continue;

    const url =
      typeof data.url === 'string' && data.url.includes('/execution/')
        ? data.url
        : undefined;
    const status = typeof data.status === 'string' ? data.status : undefined;
    return { id, url, status };
  }

  if (stepsMap) {
    for (const stepVal of Object.values(stepsMap)) {
      const s = stepVal as Record<string, unknown> | undefined;
      if (!s) continue;
      const output = s.output as Record<string, unknown> | undefined;
      if (!output?.data) continue;
      const data = output.data as Record<string, unknown>;
      const id = Number(data.id);
      if (!Number.isFinite(id) || id <= 0) continue;
      const url =
        typeof data.url === 'string' && data.url.includes('/execution/')
          ? data.url
          : undefined;
      const status = typeof data.status === 'string' ? data.status : undefined;
      return { id, url, status };
    }
  }

  return null;
}

function extractJobIdFromOutputText(
  outputText: Array<{ content?: string; title?: string }> | undefined,
): JobLaunchOutput | null {
  if (!outputText) return null;
  for (const t of outputText) {
    const content = t.content ?? '';
    const patterns = [
      /\*\*Job ID:\*\*\s*(\d+)/i,
      /Job ID[:\s*]+(\d+)/i,
      /Job\s*#?\s*(\d+)/i,
    ];
    for (const re of patterns) {
      const m = content.match(re);
      if (m) {
        const id = Number(m[1]);
        if (Number.isFinite(id) && id > 0) {
          const statusMatch = content.match(
            /\*\*(?:Job\s+)?STATUS:\*\*\s*(\w+)/i,
          );
          return {
            id,
            status: statusMatch ? statusMatch[1] : undefined,
          };
        }
      }
    }
  }
  return null;
}

function taskSpecHasJobLaunchStep(
  task: { spec?: unknown } | undefined,
): boolean {
  const steps = (task?.spec as { steps?: unknown[] } | undefined)?.steps;
  if (!Array.isArray(steps)) return false;
  const hasWorkflow = steps.some(
    s =>
      s &&
      typeof s === 'object' &&
      (s as { action?: string }).action ===
        'rhaap:launch-workflow-job-template',
  );
  if (hasWorkflow) return false;
  return steps.some(
    s =>
      s &&
      typeof s === 'object' &&
      (s as { action?: string }).action === 'rhaap:launch-job-template',
  );
}

/**
 * Single-job visualization for catalog job templates (non-workflow).
 * Returns null for non-job-template tasks and workflow templates.
 */
export function JobTaskSection({ onLogsChange }: { onLogsChange?: (logs: AapLogEntry[]) => void } = {}) {
  const { taskId } = useParams<{ taskId: string }>();
  const aapAuth = useApi(rhAapAuthApiRef);

  const {
    task,
    loading,
    output,
    steps: stepsMap,
  } = useTaskEventStream(taskId ?? '');

  const allSteps = useMemo(
    () =>
      task?.spec.steps.map(step => ({
        ...step,
        ...stepsMap?.[step.id],
      })) ?? [],
    [task, stepsMap],
  );

  const isJobTemplate = taskSpecHasJobLaunchStep(task);

  const jobLaunchOutput = useMemo(() => {
    const fromSteps = extractJobLaunchFromSteps(
      allSteps as Record<string, unknown>[],
      stepsMap as Record<string, unknown> | undefined,
    );
    if (fromSteps) return fromSteps;

    return extractJobIdFromOutputText(
      (output as { text?: Array<{ content?: string; title?: string }> })?.text,
    );
  }, [allSteps, stepsMap, output]);

  const paramToken = pickAapTokenFromParameters(
    task?.spec?.parameters as Record<string, unknown> | undefined,
  );

  const [oauthToken, setOauthToken] = useState<string | undefined>(undefined);
  const [oauthResolved, setOauthResolved] = useState(false);

  useEffect(() => {
    if (paramToken) {
      setOauthResolved(true);
      return undefined;
    }
    let cancelled = false;
    setOauthResolved(false);
    setOauthToken(undefined);
    aapAuth
      .getAccessToken()
      .then(token => {
        if (!cancelled) {
          setOauthToken(
            typeof token === 'string' && token.trim()
              ? token.trim()
              : undefined,
          );
        }
      })
      .catch(() => {
        if (!cancelled) setOauthToken(undefined);
      })
      .finally(() => {
        if (!cancelled) setOauthResolved(true);
      });
    return () => {
      cancelled = true;
    };
  }, [paramToken, aapAuth, taskId]);

  const aapToken = paramToken ?? oauthToken;
  const showSection = isJobTemplate || jobLaunchOutput !== null;

  if (!taskId || !task || loading) return null;
  if (!showSection) return null;

  return (
    <Box data-testid="ansible-job-section" marginBottom={2}>
      {!oauthResolved && !paramToken ? (
        <Paper style={{ padding: 16 }}>
          <Box display="flex" alignItems="center" style={{ gap: 12 }}>
            <CircularProgress size={22} />
            <Typography variant="body2" color="textSecondary">
              Connecting to Ansible Automation Platform for live job data…
            </Typography>
          </Box>
        </Paper>
      ) : aapToken && jobLaunchOutput ? (
        <JobTaskPanel
          key={`job-${jobLaunchOutput.id}`}
          jobId={jobLaunchOutput.id}
          aapToken={aapToken}
          openInAapUrl={jobLaunchOutput.url}
          initialStatus={jobLaunchOutput.status}
          onLogsChange={onLogsChange}
          outputText={(output as { text?: Array<{ content?: string; title?: string }> })?.text}
        />
      ) : jobLaunchOutput ? (
        <Alert severity="info">
          <Typography variant="body2">
            Job <strong>{jobLaunchOutput.id}</strong> was started.
            {jobLaunchOutput.url && (
              <>
                {' '}
                <Link
                  href={jobLaunchOutput.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in AAP
                </Link>
              </>
            )}
          </Typography>
        </Alert>
      ) : (
        <Alert severity="info">
          <Typography variant="body2">
            Waiting for the job launch step to return a job ID…
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
