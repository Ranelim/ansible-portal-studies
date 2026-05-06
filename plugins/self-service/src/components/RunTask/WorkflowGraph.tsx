/*
 * Copyright 2026 The Ansible plugin Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 */

import { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  type Node,
  type Edge,
  type NodeTypes,
  type NodeProps,
  Position,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, Paper, Typography, useTheme } from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import HourglassEmptyIcon from '@material-ui/icons/HourglassEmpty';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import BlockIcon from '@material-ui/icons/Block';
import RemoveIcon from '@material-ui/icons/Remove';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import type {
  WorkflowNodeViewModel,
  WorkflowEdge,
} from './buildWorkflowLayers';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 60;
const H_SPACING = 80;
const V_SPACING = 24;

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

function StatusIcon({ status }: { status?: string }) {
  const color = statusColor(status);
  const size = 16;
  if (!status) return <RemoveIcon style={{ fontSize: size, color }} />;
  const s = status.toLowerCase();
  if (s === 'successful') return <CheckCircleIcon style={{ fontSize: size, color }} />;
  if (s === 'failed' || s === 'error') return <ErrorIcon style={{ fontSize: size, color }} />;
  if (s === 'running') return <PlayArrowIcon style={{ fontSize: size, color }} />;
  if (s === 'pending' || s === 'waiting') return <HourglassEmptyIcon style={{ fontSize: size, color }} />;
  if (s === 'canceled' || s === 'cancelled') return <BlockIcon style={{ fontSize: size, color }} />;
  return <RemoveIcon style={{ fontSize: size, color }} />;
}

type WorkflowNodeData = {
  label: string;
  statusLabel?: string;
  isSelected: boolean;
  hasRuntime: boolean;
};

function WorkflowNodeComponent({ data }: NodeProps<Node<WorkflowNodeData>>) {
  const theme = useTheme();
  const borderColor = statusColor(data.statusLabel);
  const isDark = theme.palette.type === 'dark';

  return (
    <Paper
      variant="outlined"
      style={{
        padding: '8px 12px',
        width: NODE_WIDTH,
        cursor: data.hasRuntime ? 'pointer' : 'default',
        borderColor: data.isSelected ? '#1976d2' : isDark ? '#555' : undefined,
        borderWidth: data.isSelected ? 2 : 1,
        borderLeftColor: borderColor,
        borderLeftWidth: 3,
        backgroundColor: data.isSelected
          ? 'rgba(25, 118, 210, 0.08)'
          : theme.palette.background.paper,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ visibility: 'hidden' }} />
      <Box style={{ paddingTop: 2, flexShrink: 0 }}>
        <StatusIcon status={data.statusLabel} />
      </Box>
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="subtitle2"
          style={{
            lineHeight: 1.3,
            color: theme.palette.text.primary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {data.label}
        </Typography>
        <Typography variant="caption" style={{ color: theme.palette.text.secondary }}>
          {data.statusLabel || '—'}
        </Typography>
      </Box>
      <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />
    </Paper>
  );
}

function StartNodeComponent() {
  const theme = useTheme();
  return (
    <Box
      style={{
        width: 16,
        height: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <FiberManualRecordIcon
        style={{
          fontSize: 16,
          color: theme.palette.type === 'dark' ? '#666' : '#9e9e9e',
        }}
      />
      <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />
    </Box>
  );
}

const nodeTypes: NodeTypes = {
  workflowNode: WorkflowNodeComponent,
  startNode: StartNodeComponent,
};

function edgeColor(type: WorkflowEdge['type'], isDark: boolean): string {
  if (type === 'failure') return '#f44336';
  if (type === 'always') return isDark ? '#888' : '#9e9e9e';
  return isDark ? '#666' : '#bdbdbd';
}

interface WorkflowGraphProps {
  layeredNodes: WorkflowNodeViewModel[][];
  edges: WorkflowEdge[];
  selectedNodeId: number | null;
  hasRuntime: boolean;
  onNodeClick: (nodeId: number) => void;
}

export function WorkflowGraph({
  layeredNodes,
  edges,
  selectedNodeId,
  hasRuntime,
  onNodeClick,
}: WorkflowGraphProps) {
  const theme = useTheme();
  const isDark = theme.palette.type === 'dark';

  const { flowNodes, flowEdges } = useMemo(() => {
    const fNodes: Node[] = [];
    const fEdges: Edge[] = [];

    // Start node
    fNodes.push({
      id: 'start',
      type: 'startNode',
      position: { x: 0, y: 0 },
      data: {},
      selectable: false,
      draggable: false,
    });

    let xOffset = H_SPACING + 16;

    layeredNodes.forEach((layer) => {
      if (layer.length === 0) return;

      const totalLayerHeight =
        layer.length * NODE_HEIGHT + (layer.length - 1) * V_SPACING;
      const yStart = -totalLayerHeight / 2;

      layer.forEach((node, nodeIdx) => {
        const y = yStart + nodeIdx * (NODE_HEIGHT + V_SPACING);
        fNodes.push({
          id: String(node.id),
          type: 'workflowNode',
          position: { x: xOffset, y },
          data: {
            label: node.label,
            statusLabel: node.statusLabel,
            isSelected: selectedNodeId === node.id,
            hasRuntime,
          } satisfies WorkflowNodeData,
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          draggable: false,
        });
      });

      xOffset += NODE_WIDTH + H_SPACING;
    });

    // Center start node vertically
    if (fNodes.length > 1) {
      const firstLayerNodes = fNodes.filter(
        n => n.type === 'workflowNode' && layeredNodes[0]?.some(ln => String(ln.id) === n.id),
      );
      if (firstLayerNodes.length > 0) {
        const minY = Math.min(...firstLayerNodes.map(n => n.position.y));
        const maxY = Math.max(...firstLayerNodes.map(n => n.position.y + NODE_HEIGHT));
        fNodes[0].position = { x: 0, y: (minY + maxY) / 2 - 8 };
      }
    }

    // Edges from start node to first layer
    if (layeredNodes[0]) {
      layeredNodes[0].forEach(node => {
        fEdges.push({
          id: `start-${node.id}`,
          source: 'start',
          target: String(node.id),
          type: 'default',
          animated: false,
          style: { stroke: isDark ? '#666' : '#bdbdbd', strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: isDark ? '#666' : '#bdbdbd' },
        });
      });
    }

    // Workflow edges
    edges.forEach(e => {
      const color = edgeColor(e.type, isDark);
      fEdges.push({
        id: `${e.from}-${e.to}-${e.type}`,
        source: String(e.from),
        target: String(e.to),
        type: 'default',
        animated: e.type === 'always',
        style: { stroke: color, strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color },
        label: e.type === 'failure' ? 'on fail' : e.type === 'always' ? 'always' : undefined,
        labelStyle: { fontSize: 10, fill: color },
      });
    });

    return { flowNodes: fNodes, flowEdges: fEdges };
  }, [layeredNodes, edges, selectedNodeId, hasRuntime, isDark]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'startNode') return;
      const nodeId = Number(node.id);
      if (Number.isFinite(nodeId) && hasRuntime) {
        onNodeClick(nodeId);
      }
    },
    [hasRuntime, onNodeClick],
  );

  const graphHeight = Math.max(
    200,
    Math.max(...layeredNodes.map(l => l.length)) * (NODE_HEIGHT + V_SPACING) + 60,
  );

  return (
    <Box style={{ width: '100%', height: graphHeight, border: `1px solid ${theme.palette.divider}`, borderRadius: 4 }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick
        preventScrolling={false}
        minZoom={0.3}
        maxZoom={2}
      >
        <Background color={isDark ? '#333' : '#f0f0f0'} gap={16} />
        <Controls
          showInteractive={false}
          style={{
            bottom: 8,
            right: 8,
            left: 'auto',
            display: 'flex',
            flexDirection: 'row',
            gap: 2,
          }}
        />
      </ReactFlow>
    </Box>
  );
}
