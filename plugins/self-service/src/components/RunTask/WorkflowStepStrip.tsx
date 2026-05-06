/*
 * Copyright 2026 The Ansible plugin Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 */

import { Box, Tooltip, Typography, useTheme } from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import HourglassEmptyIcon from '@material-ui/icons/HourglassEmpty';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import BlockIcon from '@material-ui/icons/Block';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import type { WorkflowNodeViewModel } from './buildWorkflowLayers';

function statusColor(status?: string): string {
  if (!status) return '#9e9e9e';
  const s = status.toLowerCase();
  if (s === 'successful') return '#4caf50';
  if (s === 'failed' || s === 'error') return '#f44336';
  if (s === 'running') return '#42a5f5';
  if (s === 'pending' || s === 'waiting') return '#ff9800';
  if (s === 'canceled' || s === 'cancelled') return '#9e9e9e';
  return '#9e9e9e';
}

function StepIcon({ status }: { status?: string }) {
  const color = statusColor(status);
  const size = 20;
  if (!status)
    return <FiberManualRecordIcon style={{ fontSize: size, color }} />;
  const s = status.toLowerCase();
  if (s === 'successful')
    return <CheckCircleIcon style={{ fontSize: size, color }} />;
  if (s === 'failed' || s === 'error')
    return <ErrorIcon style={{ fontSize: size, color }} />;
  if (s === 'running')
    return <PlayArrowIcon style={{ fontSize: size, color }} />;
  if (s === 'pending' || s === 'waiting')
    return <HourglassEmptyIcon style={{ fontSize: size, color }} />;
  if (s === 'canceled' || s === 'cancelled')
    return <BlockIcon style={{ fontSize: size, color }} />;
  return <FiberManualRecordIcon style={{ fontSize: size, color }} />;
}

interface WorkflowStepStripProps {
  nodes: WorkflowNodeViewModel[];
  selectedNodeId: number | null;
  onNodeClick: (nodeId: number) => void;
}

export function WorkflowStepStrip({
  nodes,
  selectedNodeId,
  onNodeClick,
}: WorkflowStepStripProps) {
  const theme = useTheme();
  const isDark = theme.palette.type === 'dark';

  if (nodes.length === 0) return null;

  return (
    <Box
      display="flex"
      alignItems="center"
      flexWrap="wrap"
      style={{ gap: 4 }}
    >
      <FiberManualRecordIcon
        style={{
          fontSize: 10,
          color: isDark ? '#666' : '#bdbdbd',
        }}
      />

      {nodes.map(node => {
        const isSelected = selectedNodeId === node.id;
        const tooltipText = `${node.label}${node.statusLabel ? ` — ${node.statusLabel}` : ''}`;

        return (
          <Box
            key={node.id}
            display="flex"
            alignItems="center"
            style={{ gap: 4 }}
          >
            <ArrowForwardIcon
              style={{
                fontSize: 12,
                color: isDark ? '#555' : '#ccc',
              }}
            />

            <Tooltip title={tooltipText} arrow placement="top">
              <Box
                onClick={() => onNodeClick(node.id)}
                display="flex"
                alignItems="center"
                style={{
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  border: `1px solid ${isSelected ? '#1976d2' : isDark ? '#444' : '#e0e0e0'}`,
                  backgroundColor: isSelected
                    ? 'rgba(25, 118, 210, 0.08)'
                    : 'transparent',
                  borderLeftWidth: 3,
                  borderLeftColor: statusColor(node.statusLabel),
                  transition: 'background-color 0.15s',
                }}
                role="button"
                tabIndex={0}
              >
                <StepIcon status={node.statusLabel} />
                <Typography
                  variant="body2"
                  style={{
                    fontSize: 13,
                    lineHeight: 1.3,
                    color: theme.palette.text.primary,
                    whiteSpace: 'nowrap',
                    maxWidth: 180,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {node.label}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
        );
      })}
    </Box>
  );
}
