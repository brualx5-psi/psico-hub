import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { useGraphHistory } from '../hooks/useGraphHistory';
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
  NodeProps,
  Handle,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import {
  BrainCircuit,
  Heart,
  Activity,
  User,
  MapPin,
  Zap,
  Users,
  Eye,
  Dna,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Save,
  Trash2,
  Edit3,
  LayoutGrid,
  EyeOff,
  Map
} from 'lucide-react';
import { Connection, addEdge, useReactFlow } from 'reactflow';

interface PBTGraphProps {
  nodes: { id: string; label: string; type: string; change: string; category?: string; isTarget?: boolean }[];
  edges: { source: string; target: string; relation: string; weight: string }[];
  onGraphUpdate?: (nodes: any[], edges: any[]) => void;
}

// --- CONFIGURAÇÃO VISUAL ---

const CATEGORY_STYLES: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  'Cognitiva': { color: '#3b82f6', icon: BrainCircuit, label: 'Cognitivo' }, // Blue
  'Afetiva': { color: '#ef4444', icon: Heart, label: 'Afetivo' }, // Red
  'Comportamento': { color: '#22c55e', icon: Activity, label: 'Comportamento' }, // Green
  'Self': { color: '#a855f7', icon: User, label: 'Self' }, // Purple
  'Contexto': { color: '#eab308', icon: MapPin, label: 'Contexto' }, // Yellow
  'Motivacional': { color: '#f97316', icon: Zap, label: 'Motivacional' }, // Orange
  'Sociocultural': { color: '#ec4899', icon: Users, label: 'Sociocultural' }, // Pink
  'Atencional': { color: '#06b6d4', icon: Eye, label: 'Atencional' }, // Cyan
  'Biofisiológica': { color: '#14b8a6', icon: Dna, label: 'Biofisiológico' }, // Teal
  'Intervenção': { color: '#f8fafc', icon: Zap, label: 'INTERVENÇÃO' }, // White/Slate
};

const DEFAULT_STYLE = { color: '#64748b', icon: BrainCircuit, label: 'Processo' };

// Categories that defaults to Moderators (Rounded)
const DEFAULT_MODERATOR_CATEGORIES = ['Contexto', 'Sociocultural', 'Biofisiológica'];
const isModeratorCategory = (cat?: string) => DEFAULT_MODERATOR_CATEGORIES.includes(cat || '');

const CHANGE_ICONS = {
  'aumentou': <ArrowUpRight className="w-3 h-3 text-red-400" />,
  'diminuiu': <ArrowDownRight className="w-3 h-3 text-emerald-400" />,
  'estavel': <Minus className="w-3 h-3 text-slate-400" />,
  'novo': <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
};

// --- CUSTOM NODE ---

const CustomPBTNode = ({ data }: NodeProps) => {
  const categoryStyle = CATEGORY_STYLES[data.category] || DEFAULT_STYLE;
  const StartIcon = categoryStyle.icon;
  const isTarget = data.isTarget;
  // Rule: explicitly flagged OR belongs to moderator category
  const isRounded = data.isModerator || isModeratorCategory(data.category);
  const roundedClass = isRounded ? 'rounded-2xl' : 'rounded-none';

  return (
    <div
      className="relative group min-w-[140px] max-w-[180px]"
      style={{
        filter: isTarget ? `drop-shadow(0 0 15px #facc15)` : `drop-shadow(0 0 10px ${categoryStyle.color}20)`
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-500 !w-2 !h-2" />

      {/* Target Badge */}
      {isTarget && (
        <div className="absolute -top-3 -right-3 z-10 bg-yellow-500 text-slate-900 rounded-full p-1 shadow-lg shadow-yellow-500/20 border border-yellow-300 animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
          </svg>
        </div>
      )}



      {/* Corpo do Nó */}
      <div
        className={`backdrop-blur-md border border-white/10 ${roundedClass} p-3 transition-colors`}
        style={{ backgroundColor: `${categoryStyle.color}10`, borderColor: `${categoryStyle.color}40` }}
      >
        <div className="text-xs font-semibold text-white leading-tight mb-2 shadow-black drop-shadow-md">
          {data.label}
        </div>

        {/* Footer com Status de Mudança */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <span className="text-[9px] text-slate-400 font-mono">STATUS</span>
          <div className="flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
            {CHANGE_ICONS[data.change as keyof typeof CHANGE_ICONS]}
            <span className="text-[9px] text-slate-300 uppercase tracking-wide">
              {data.change}
            </span>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-500 !w-2 !h-2" />
    </div>
  );
};

// Region Node Component moved up to fix hoisting
const RegionNode = ({ data }: NodeProps) => {
  return (
    <div className={`w-full h-full border-2 border-dashed ${data.isAlternate ? 'border-slate-600 bg-slate-800/30' : 'border-slate-700/50 bg-slate-900/20'} rounded-xl flex items-end justify-center pb-4 transition-colors`}>
      <div className="text-xl font-bold uppercase tracking-[0.2em] text-slate-600 select-none pointer-events-none">
        {data.label}
      </div>
    </div>
  );
};

const nodeTypes = {
  pbtNode: CustomPBTNode,
  regionNode: RegionNode,
};

// --- LAYOUT ENGINE (GRID SYSTEM) ---

const GRID_COLS = 3;
const GRID_ROWS = 3;
const CELL_WIDTH = 320; // Increased slightly for breathing room
const CELL_HEIGHT = 240;
const PADDING = 20;

const REGIONS: Record<string, { row: number; col: number; label: string }> = {
  // Row 1
  'Atencional': { row: 0, col: 0, label: 'Atenção' },
  'Cognitiva': { row: 0, col: 1, label: 'Cognição' },
  'Self': { row: 0, col: 2, label: 'Self' },
  // Row 2
  'Afetiva': { row: 1, col: 0, label: 'Afeto' },
  'Comportamento': { row: 1, col: 1, label: 'Comportamento' },
  'Motivacional': { row: 1, col: 2, label: 'Motivação' },
  // Row 3
  'Biofisiológica': { row: 2, col: 0, label: 'Biofisiológico' },
  'Contexto': { row: 2, col: 1, label: 'Contexto' },
  'Sociocultural': { row: 2, col: 2, label: 'Sociocultural' },
  // Defaults
  'Intervenção': { row: 1, col: 1, label: 'Comportamento' }
};



const getGridLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const layoutedNodes: Node[] = [];

  // 0. First, count nodes per category to determine region sizes
  const nodeCountByCategory: Record<string, number> = {};
  nodes.forEach(node => {
    let category = node.data.category || 'Contexto';
    if (category === 'Intervenção') category = 'Comportamento';
    if (!REGIONS[category]) category = 'Contexto';
    nodeCountByCategory[category] = (nodeCountByCategory[category] || 0) + 1;
  });

  // Calculate dynamic cell sizes based on node count
  const getExpandedSize = (count: number): { width: number; height: number } => {
    const nodeWidth = 160;
    const nodeHeight = 90;
    const padding = 30;

    if (count <= 1) return { width: CELL_WIDTH, height: CELL_HEIGHT };
    if (count <= 2) return { width: CELL_WIDTH, height: CELL_HEIGHT };
    if (count <= 4) return { width: CELL_WIDTH + 80, height: CELL_HEIGHT + 60 };
    if (count <= 6) return { width: CELL_WIDTH + 150, height: CELL_HEIGHT + 100 };
    // Many nodes: expand more
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    return {
      width: Math.max(CELL_WIDTH, cols * nodeWidth + padding * 2),
      height: Math.max(CELL_HEIGHT, rows * nodeHeight + padding * 2)
    };
  };

  // Store calculated sizes for later
  const regionSizes: Record<string, { width: number; height: number }> = {};
  Object.keys(REGIONS).forEach(key => {
    if (key === 'Intervenção') return;
    regionSizes[key] = getExpandedSize(nodeCountByCategory[key] || 0);
  });

  // Calculate cumulative offsets for each row/column (for non-uniform grid)
  const rowHeights: Record<number, number> = { 0: 0, 1: 0, 2: 0 };
  const colWidths: Record<number, number> = { 0: 0, 1: 0, 2: 0 };

  Object.entries(REGIONS).forEach(([key, config]) => {
    if (key === 'Intervenção') return;
    const size = regionSizes[key];
    rowHeights[config.row] = Math.max(rowHeights[config.row], size.height);
    colWidths[config.col] = Math.max(colWidths[config.col], size.width);
  });

  // Calculate cumulative positions
  const rowY: Record<number, number> = { 0: 0, 1: rowHeights[0] + PADDING, 2: rowHeights[0] + rowHeights[1] + PADDING * 2 };
  const colX: Record<number, number> = { 0: 0, 1: colWidths[0] + PADDING, 2: colWidths[0] + colWidths[1] + PADDING * 2 };

  // 1. Create Region Nodes (The "Squares") with dynamic sizes
  Object.entries(REGIONS).forEach(([key, config]) => {
    if (key === 'Intervenção') return;

    const size = regionSizes[key];
    layoutedNodes.push({
      id: `region-${key}`,
      type: 'regionNode',
      position: {
        x: colX[config.col],
        y: rowY[config.row]
      },
      data: {
        label: config.label,
        isAlternate: key === 'Comportamento'
      },
      style: { width: size.width, height: size.height, zIndex: -10 },
      selectable: false,
      draggable: false,
    });
  });

  // 2. Process Logic Nodes
  nodes.forEach(node => {
    let category = node.data.category || 'Contexto';
    let parentKey = category;

    if (!REGIONS[category]) {
      if (category === 'Intervenção') {
        parentKey = 'Comportamento';
      } else {
        parentKey = 'Contexto';
      }
    } else if (category === 'Intervenção') {
      parentKey = 'Comportamento';
    }

    const regionId = `region-${parentKey}`;
  });

  // Re-loop to distribute nodes by category
  const nodesByCategory: Record<string, Node[]> = {};
  nodes.forEach(node => {
    let category = node.data.category || 'Contexto';
    if (category === 'Intervenção') category = 'Comportamento';
    if (!REGIONS[category]) category = 'Contexto';

    if (!nodesByCategory[category]) nodesByCategory[category] = [];
    nodesByCategory[category].push(node);
  });

  Object.entries(nodesByCategory).forEach(([category, categoryNodes]) => {
    const regionSize = regionSizes[category] || { width: CELL_WIDTH, height: CELL_HEIGHT };
    const nodeWidth = 140;
    const nodeHeight = 80;
    const padding = 20;

    // Grid-based distribution for many nodes
    const count = categoryNodes.length;
    const cols = Math.ceil(Math.sqrt(count));
    const availableWidth = regionSize.width - padding * 2 - nodeWidth;
    const availableHeight = regionSize.height - padding * 2 - nodeHeight;

    categoryNodes.forEach((node, index) => {
      let x, y;

      if (count === 1) {
        // Single node: center
        x = (regionSize.width - nodeWidth) / 2;
        y = (regionSize.height - nodeHeight) / 2;
      } else if (count <= 4) {
        // Circle distribution for small counts
        const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
        const radius = Math.min(availableWidth, availableHeight) / 3;
        x = (regionSize.width / 2) - (nodeWidth / 2) + Math.cos(angle) * radius;
        y = (regionSize.height / 2) - (nodeHeight / 2) + Math.sin(angle) * radius;
      } else {
        // Grid distribution for many nodes
        const col = index % cols;
        const row = Math.floor(index / cols);
        const cellWidth = availableWidth / cols;
        const cellHeight = availableHeight / Math.ceil(count / cols);
        x = padding + col * cellWidth + (cellWidth - nodeWidth) / 2;
        y = padding + row * cellHeight + (cellHeight - nodeHeight) / 2;
      }

      node.parentId = `region-${category}`;
      node.extent = 'parent';
      node.position = { x, y };
      layoutedNodes.push(node);
    });
  });

  return { nodes: layoutedNodes, edges };
};

// Helper to calculate node position when changing category
const getRelativePosition = (category: string) => {
  // Center by default
  const nodeWidth = 140;
  const nodeHeight = 80;
  const centerX = (CELL_WIDTH / 2) - (nodeWidth / 2);
  const centerY = (CELL_HEIGHT / 2) - (nodeHeight / 2);

  // Add slight random offset to prevent exact stacking
  const jitter = () => (Math.random() - 0.5) * 40;

  return { x: centerX + jitter(), y: centerY + jitter() };
};

export function PBTGraph({ nodes: initialDataNodes, edges: initialDataEdges, onGraphUpdate }: PBTGraphProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<{ type: 'node' | 'edge', data: any } | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  // Separate state for edit form to decouple from live graph until save
  const [editForm, setEditForm] = React.useState<any>(null);
  // Toggle region labels visibility
  const [showRegionLabels, setShowRegionLabels] = React.useState(true);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    // ... existing memo logic ...
    if (!initialDataNodes?.length) return { nodes: [], edges: [] };

    const flowNodes: Node[] = initialDataNodes.map((n) => ({
      id: n.id,
      data: {
        label: n.label,
        category: n.category,
        change: n.change,
        isTarget: (n as any).isTarget,
        isModerator: (n as any).isModerator // Load saved property
      },
      position: { x: 0, y: 0 },
      type: 'pbtNode',
    }));

    const flowEdges: Edge[] = initialDataEdges.map((e, i) => {
      const isBidirectional = (e as any).bidirectional;
      const weight = (e.weight || 'moderado').toLowerCase();
      // Default to 'positive' if not specified
      const polarity = (e as any).polarity || 'positive';

      let arrowSize = 20;
      let strokeWidth = 1.5;

      if (weight === 'fraco') {
        arrowSize = 10;
        strokeWidth = 1;
      } else if (weight === 'forte') {
        arrowSize = 45;
        strokeWidth = 3.5;
      }

      // Marker Config based on Polarity
      const markerType = polarity === 'negative' ? 'arrow-closed-hollow' : MarkerType.ArrowClosed;

      // For standard MarkerType, we pass config object. For custom ID 'arrow-closed-hollow', we just pass the ID string if using 'type' or use 'markerEndId'?
      // ReactFlow 'markerEnd' can be string (ID) or object.
      // If we want a custom marker we defined in definitions, we use the ID string.
      // However, 'MarkerType.ArrowClosed' is an enum.

      const markerConfig = polarity === 'negative'
        ? 'arrow-closed-hollow' // Refers to the definition we will add
        : {
          type: MarkerType.ArrowClosed,
          color: '#475569',
          width: arrowSize,
          height: arrowSize,
        };

      return {
        id: `e${i}`,
        source: e.source,
        target: e.target,
        label: e.relation,
        animated: true,
        style: { stroke: '#475569', strokeWidth: strokeWidth },
        labelStyle: { fill: '#94a3b8', fontSize: 9, fontWeight: 500 },
        markerEnd: markerConfig,
        markerStart: isBidirectional ? markerConfig : undefined,
        data: { weight: weight, relation: e.relation, bidirectional: isBidirectional, polarity: polarity }
      };
    });

    return getGridLayoutedElements(flowNodes, flowEdges);
  }, [initialDataNodes, initialDataEdges]);

  // HISTORY
  const { state, undo, redo, takeSnapshot, canUndo, canRedo, setInitialState } = useGraphHistory({
    nodes: layoutedNodes,
    edges: layoutedEdges
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(state.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(state.edges);

  // Sync internal state with History state (Time Travel)
  useEffect(() => {
    setNodes(state.nodes);
    setEdges(state.edges);
  }, [state, setNodes, setEdges]);

  // Initial Load ONLY
  React.useEffect(() => {
    if (layoutedNodes.length > 0 && nodes.length === 0) {
      setInitialState({ nodes: layoutedNodes, edges: layoutedEdges });
    }
  }, [layoutedNodes, layoutedEdges, setInitialState]);

  // Keyboard Shortcuts (Ctrl+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
        // Notify parent of undo
        // We need to wait for state update to emit, but we can emit current state after undo in next render?
        // Actually, emitUpdate is called on changes. If we undo, state changes, we might need to emit.
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Helper to emit updates
  const emitUpdate = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    if (!onGraphUpdate) return;

    const logicNodes = newNodes.filter(n => n.type === 'pbtNode').map(n => ({
      id: n.id,
      label: n.data.label,
      category: n.data.category,
      change: n.data.change,
      isTarget: n.data.isTarget,
      isModerator: n.data.isModerator
    }));

    const logicEdges = newEdges.map(e => ({
      source: e.source,
      target: e.target,
      relation: e.data?.relation || e.label || 'Influência',
      weight: e.data?.weight || 'moderado',
      bidirectional: e.data?.bidirectional || false,
      polarity: e.data?.polarity || 'positive',
      reversePolarity: e.data?.reversePolarity || 'positive'
    }));

    onGraphUpdate(logicNodes, logicEdges);
  }, [onGraphUpdate]);

  // Wrap onNodesChange to detect drags and resolve collisions
  const onNodesChangeWrapper = useCallback((changes: any) => {
    onNodesChange(changes);

    // Detect end of drag
    const dragEndChange = changes.find((c: any) => c.type === 'position' && c.dragging === false);

    if (dragEndChange && dragEndChange.id) {
      const NODE_WIDTH = 140;
      const NODE_HEIGHT = 80;
      const BUFFER = 10;

      // Apply collision detection after a short delay to let state update
      setTimeout(() => {
        setNodes(currentNodes => {
          const draggedNode = currentNodes.find(n => n.id === dragEndChange.id);
          if (!draggedNode || draggedNode.type !== 'pbtNode') return currentNodes;

          // Find sibling nodes in same region
          const siblings = currentNodes.filter(n =>
            n.id !== dragEndChange.id &&
            n.type === 'pbtNode' &&
            n.parentId === draggedNode.parentId
          );

          let needsUpdate = false;
          let updatedNodes = [...currentNodes];

          for (const sibling of siblings) {
            const xOverlap = Math.abs(draggedNode.position.x - sibling.position.x) < NODE_WIDTH + BUFFER;
            const yOverlap = Math.abs(draggedNode.position.y - sibling.position.y) < NODE_HEIGHT + BUFFER;

            if (xOverlap && yOverlap) {
              needsUpdate = true;
              // Push overlapping sibling away
              const pushX = draggedNode.position.x < sibling.position.x ? 30 : -30;
              const pushY = draggedNode.position.y < sibling.position.y ? 30 : -30;

              updatedNodes = updatedNodes.map(n => {
                if (n.id === sibling.id) {
                  return {
                    ...n,
                    position: {
                      x: Math.max(10, n.position.x + pushX),
                      y: Math.max(10, n.position.y + pushY)
                    }
                  };
                }
                return n;
              });
            }
          }

          if (needsUpdate) {
            emitUpdate(updatedNodes, edges);
            return updatedNodes;
          }
          return currentNodes;
        });
      }, 50);
    }
  }, [onNodesChange, setNodes, emitUpdate, edges]);

  // --- HANDLERS ---





  // WRAP onConnect properly
  const handleConnectWrapper = useCallback((params: Connection) => {
    takeSnapshot({ nodes, edges }); // SNAPSHOT BEFORE CHANGE

    const newEdgeData = {
      ...params,
      type: 'default',
      animated: true,
      label: 'Influencia',
      style: { stroke: '#475569', strokeWidth: 1.5 },
      data: { weight: 'moderado', relation: 'Influencia', bidirectional: false, polarity: 'positive' },
      markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#475569' }
    };

    setEdges((eds) => {
      const newEdges = addEdge(newEdgeData, eds);
      emitUpdate(nodes, newEdges);
      return newEdges;
    });
  }, [setEdges, nodes, emitUpdate, takeSnapshot, edges]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === 'regionNode') return; // Don't edit regions
    setSelectedItem({ type: 'node', data: node });
    setEditForm({
      id: node.id,
      label: node.data.label,
      category: node.data.category || 'Contexto',
      change: node.data.change || 'estavel',
      isTarget: node.data.isTarget || false
    });
    setIsModalOpen(true);
  }, []);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedItem({ type: 'edge', data: edge });
    const edgeData = edge.data || {};
    setEditForm({
      id: edge.id,
      relation: edge.label || edgeData.relation || 'Influencia',
      weight: edgeData.weight || 'moderado',
      reverseWeight: edgeData.reverseWeight || edgeData.weight || 'moderado',
      bidirectional: edgeData.bidirectional || false,
      polarity: edgeData.polarity || 'positive',
      reversePolarity: edgeData.reversePolarity || edgeData.polarity || 'positive'
    });
    setIsModalOpen(true);
  }, []);

  const handleAddNewNode = () => {
    const newId = `manual-${Date.now()}`;
    const defaultCategory = 'Cognitiva';
    setSelectedItem({ type: 'node', data: { id: newId } }); // Pseudo node
    setEditForm({
      id: newId,
      label: 'Novo Processo',
      category: defaultCategory,
      change: 'novo',
      isTarget: false,
      isNew: true
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!selectedItem || !editForm) return;

    takeSnapshot({ nodes, edges }); // SNAPSHOT BEFORE SAVE

    if (selectedItem.type === 'node') {
      setNodes((nds) => {
        // If new node
        if ((editForm as any).isNew) {
          const parentKey = editForm.category === 'Intervenção' ? 'Comportamento' : (REGIONS[editForm.category] ? editForm.category : 'Contexto');
          const newNode: Node = {
            id: editForm.id,
            type: 'pbtNode',
            position: getRelativePosition(parentKey),
            data: {
              label: editForm.label,
              category: editForm.category,
              change: editForm.change,
              isTarget: editForm.isTarget,
              isModerator: editForm.isModerator
            },
            parentId: `region-${parentKey}`,
            extent: 'parent'
          };
          const newNodes = [...nds, newNode];
          emitUpdate(newNodes, edges);
          return newNodes;
        }

        const newNodes = nds.map(node => {
          if (node.id === selectedItem.data.id) {
            // Check if category changed to update parent
            const oldCategory = node.data.category;
            const newCategory = editForm.category;

            let updatedNode = {
              ...node,
              data: {
                ...node.data,
                label: editForm.label,
                category: newCategory,
                change: editForm.change,
                isTarget: editForm.isTarget,
                isModerator: editForm.isModerator
              }
            };

            if (oldCategory !== newCategory) {
              const parentKey = newCategory === 'Intervenção' ? 'Comportamento' : (REGIONS[newCategory] ? newCategory : 'Contexto');
              updatedNode.parentId = `region-${parentKey}`;
              updatedNode.position = getRelativePosition(parentKey);
            }
            return updatedNode;
          }
          return node;
        });
        emitUpdate(newNodes, edges);
        return newNodes;
      });
    } else if (selectedItem.type === 'edge') {
      setEdges((eds) => {
        const newEdges = eds.map(edge => {
          if (edge.id === selectedItem.data.id) {
            const weight = editForm.weight;
            const reverseWeight = editForm.reverseWeight || weight;
            const isBidirectional = editForm.bidirectional;
            const forwardPolarity = editForm.polarity;
            const reversePolarity = editForm.reversePolarity || forwardPolarity;

            let arrowSize = 20;
            let strokeWidth = 1.5;
            if (weight === 'fraco') { arrowSize = 10; strokeWidth = 1; }
            if (weight === 'forte') { arrowSize = 45; strokeWidth = 3.5; }

            // Helper to get marker config based on polarity AND weight
            const getMarkerConfig = (polarity: string, edgeWeight: string) => {
              let arrowSize = 20;
              if (edgeWeight === 'fraco') { arrowSize = 10; }
              if (edgeWeight === 'forte') { arrowSize = 45; }

              if (polarity === 'negative') {
                const sizeMap: Record<string, string> = {
                  'fraco': 'arrow-hollow-fraco',
                  'moderado': 'arrow-hollow-moderado',
                  'forte': 'arrow-hollow-forte'
                };
                return sizeMap[edgeWeight] || 'arrow-hollow-moderado';
              }
              return {
                type: MarkerType.ArrowClosed,
                width: arrowSize,
                height: arrowSize,
                color: '#475569'
              };
            };

            const markerEnd = getMarkerConfig(forwardPolarity, weight);
            const markerStart = isBidirectional ? getMarkerConfig(reversePolarity, reverseWeight) : undefined;

            return {
              ...edge,
              label: editForm.relation,
              style: { ...edge.style, strokeWidth },
              markerEnd,
              markerStart,
              data: {
                ...edge.data,
                weight,
                reverseWeight,
                bidirectional: isBidirectional,
                relation: editForm.relation,
                polarity: forwardPolarity,
                reversePolarity: reversePolarity
              }
            };
          }
          return edge;
        });
        emitUpdate(nodes, newEdges);
        return newEdges;
      });
    }
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleDelete = () => {
    if (!selectedItem) return;
    takeSnapshot({ nodes, edges }); // SNAPSHOT BEFORE DELETE

    if (selectedItem.type === 'node') {
      const newNodes = nodes.filter(n => n.id !== selectedItem.data.id);
      const newEdges = edges.filter(e => e.source !== selectedItem.data.id && e.target !== selectedItem.data.id); // Cleanup edges
      setNodes(newNodes);
      setEdges(newEdges);
      emitUpdate(newNodes, newEdges);
    } else {
      const newEdges = edges.filter(e => e.id !== selectedItem.data.id);
      setEdges(newEdges);
      emitUpdate(nodes, newEdges);
    }
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  // Auto-Organize: Redistributes nodes using Dagre layout
  const handleAutoOrganize = useCallback(() => {
    takeSnapshot({ nodes, edges }); // SNAPSHOT BEFORE REORGANIZE

    const { nodes: reorganizedNodes, edges: reorganizedEdges } = getGridLayoutedElements(
      nodes.filter(n => n.type === 'pbtNode').map(n => ({
        id: n.id,
        type: 'pbtNode',
        data: n.data,
        position: n.position
      })),
      edges
    );

    setNodes(reorganizedNodes);
    setEdges(reorganizedEdges);
    emitUpdate(reorganizedNodes, reorganizedEdges);
  }, [nodes, edges, setNodes, setEdges, emitUpdate, takeSnapshot]);


  if (!nodes.length) {
    return (
      <div className="h-[750px] w-full flex items-center justify-center border border-white/10 rounded-xl bg-black/50 text-slate-500 font-mono text-sm">
        <p>&gt; AGUARDANDO DADOS DA REDE...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '750px' }} className="border border-white/10 rounded-xl overflow-hidden bg-black relative group shadow-inner">
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="relative w-full h-full max-w-[1200px] max-h-[800px]">
          {/* BackgroundMatrix removed - using Region Nodes now */}
          <div className="absolute inset-0 z-10">
            <ReactFlow
              nodes={showRegionLabels ? nodes : nodes.filter(n => !n.id.startsWith('region-'))}
              edges={edges}
              nodeTypes={nodeTypes}

              onNodesChange={onNodesChangeWrapper}
              onEdgesChange={onEdgesChange}

              onConnect={handleConnectWrapper}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              fitView
              attributionPosition="bottom-right"
              minZoom={0.5}
              maxZoom={1.5}
              proOptions={{ hideAttribution: true }}
            >
              <Controls className="bg-slate-800 border b-slate-700 fill-slate-300" showInteractive={true} />
              <svg>
                <defs>
                  {/* Weak Hollow Arrow (Size 10) */}
                  <marker id="arrow-hollow-fraco" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="10" markerHeight="10" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="white" stroke="#475569" strokeWidth="1" />
                  </marker>
                  {/* Moderate Hollow Arrow (Size 20) */}
                  <marker id="arrow-hollow-moderado" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="20" markerHeight="20" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="white" stroke="#475569" strokeWidth="1" />
                  </marker>
                  {/* Strong Hollow Arrow (Size 45) */}
                  <marker id="arrow-hollow-forte" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="45" markerHeight="45" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="white" stroke="#475569" strokeWidth="1" />
                  </marker>
                </defs>
              </svg>

              {/* Controls Overlay */}
              <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
                <button
                  onClick={handleAddNewNode}
                  className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full shadow-lg border border-blue-400 transition-transform active:scale-95"
                  title="Adicionar Processo"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button
                  onClick={handleAutoOrganize}
                  className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-full shadow-lg border border-slate-600 transition-transform active:scale-95"
                  title="Auto-Organizar (Redistribuir nós)"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowRegionLabels(!showRegionLabels)}
                  className={`${showRegionLabels ? 'bg-emerald-700 hover:bg-emerald-600 border-emerald-600' : 'bg-slate-700 hover:bg-slate-600 border-slate-600'} text-white p-2 rounded-full shadow-lg border transition-transform active:scale-95`}
                  title={showRegionLabels ? "Esconder Mapa de Regiões" : "Mostrar Mapa de Regiões"}
                >
                  {showRegionLabels ? <Map className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>

              {/* Editing Modal */}
              {isModalOpen && editForm && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-[320px] overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
                      <span className="font-bold text-slate-200 text-sm flex items-center gap-2">
                        {selectedItem?.type === 'node' ? <Edit3 className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                        {selectedItem?.type === 'node' ? 'Editar Processo' : 'Editar Conexão'}
                      </span>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
                    </div>

                    <div className="p-4 space-y-4">
                      {selectedItem?.type === 'node' ? (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase text-slate-500 font-bold">Nome do Processo</label>
                            <input
                              value={editForm.label}
                              onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-blue-500 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase text-slate-500 font-bold">Categoria (Move o card)</label>
                            <select
                              value={editForm.category}
                              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white outline-none"
                            >
                              {Object.keys(REGIONS).filter(k => k !== 'Intervenção').map(cat => (
                                <option key={cat} value={cat}>{REGIONS[cat].label}</option>
                              ))}
                              <option value="Intervenção">Intervenção</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <div className="space-y-1 flex-1">
                              <label className="text-[10px] uppercase text-slate-500 font-bold">Mudança</label>
                              <select
                                value={editForm.change}
                                onChange={(e) => setEditForm({ ...editForm, change: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white outline-none"
                              >
                                <option value="estavel">Estável</option>
                                <option value="aumentou">Aumentou</option>
                                <option value="diminuiu">Diminuiu</option>
                                <option value="novo">Novo</option>
                              </select>
                            </div>
                            <div className="space-y-1 flex flex-col justify-center gap-2 pb-2 pl-2">
                              <label className="flex items-center gap-2 cursor-pointer pt-4">
                                <input
                                  type="checkbox"
                                  checked={editForm.isTarget}
                                  onChange={(e) => setEditForm({ ...editForm, isTarget: e.target.checked })}
                                  className="w-4 h-4 rounded border-slate-600 bg-slate-900"
                                />
                                <span className="text-xs text-slate-300">Alvo Terapêutico</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editForm.isModerator}
                                  onChange={(e) => setEditForm({ ...editForm, isModerator: e.target.checked })}
                                  className="w-4 h-4 rounded border-slate-600 bg-slate-900"
                                />
                                <span className="text-xs text-slate-300">Moderador (Fixo)</span>
                              </label>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Visual indicator of edge direction */}
                          {selectedItem?.data && (
                            <div className="mb-3 p-2 bg-slate-950 border border-slate-700 rounded">
                              <div className="flex items-center justify-center gap-2 text-xs">
                                <span className="font-bold text-blue-400">
                                  {nodes.find(n => n.id === selectedItem.data.source)?.data?.label || 'Origem'}
                                </span>
                                <ArrowRight className="w-3 h-3 text-slate-500" />
                                <span className="font-bold text-green-400">
                                  {nodes.find(n => n.id === selectedItem.data.target)?.data?.label || 'Destino'}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="space-y-1">
                            <label className="text-[10px] uppercase text-slate-500 font-bold">Nome da Relação</label>
                            <input
                              value={editForm.relation}
                              onChange={(e) => setEditForm({ ...editForm, relation: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase text-slate-500 font-bold">
                              Força/Influência {editForm.bidirectional ? '(IDA →)' : ''}
                            </label>
                            <select
                              value={editForm.weight}
                              onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white outline-none"
                            >
                              <option value="fraco">Fraca (Incerta)</option>
                              <option value="moderado">Moderada (Relevante)</option>
                              <option value="forte">Forte (Dominante)</option>
                            </select>
                          </div>
                          {/* Bidirectional Toggle removed here, moving to own row */}

                          {/* Polarity Select */}
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase text-slate-500 font-bold">Tipo de Relação (Polaridade)</label>
                            <select
                              value={editForm.polarity || 'positive'}
                              onChange={(e) => setEditForm({ ...editForm, polarity: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white outline-none"
                            >
                              <option value="positive">Positiva / Excitatória (Seta Cheia)</option>
                              <option value="negative">Negativa / Inibitória (Seta Vazia)</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                            <input
                              type="checkbox"
                              id="bidirectional"
                              checked={editForm.bidirectional}
                              onChange={(e) => setEditForm({ ...editForm, bidirectional: e.target.checked })}
                              className="w-4 h-4 bg-slate-950 border-slate-700 rounded"
                            />
                            <label htmlFor="bidirectional" className="text-xs text-slate-300 select-none cursor-pointer">Bidirecional</label>
                          </div>

                          {/* Reverse Weight (only for bidirectional) */}
                          {editForm.bidirectional && (
                            <div className="space-y-1 mt-2 border-t border-slate-700 pt-3">
                              <label className="text-[10px] uppercase text-slate-500 font-bold">Força Reversa (← VOLTA)</label>
                              <select
                                value={editForm.reverseWeight || editForm.weight || 'moderado'}
                                onChange={(e) => setEditForm({ ...editForm, reverseWeight: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white outline-none"
                              >
                                <option value="fraco">Fraca (Incerta)</option>
                                <option value="moderado">Moderada (Relevante)</option>
                                <option value="forte">Forte (Dominante)</option>
                              </select>
                            </div>
                          )}

                          {/* Reverse Polarity (only for bidirectional) */}
                          {editForm.bidirectional && (
                            <div className="space-y-1 mt-2 border-t border-slate-700 pt-3">
                              <label className="text-[10px] uppercase text-slate-500 font-bold">Polaridade Reversa (Seta de Volta)</label>
                              <select
                                value={editForm.reversePolarity || editForm.polarity || 'positive'}
                                onChange={(e) => setEditForm({ ...editForm, reversePolarity: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white outline-none"
                              >
                                <option value="positive">Positiva (Cheia)</option>
                                <option value="negative">Negativa (Vazia)</option>
                              </select>
                              <p className="text-[9px] text-slate-500 italic mt-1">
                                💡 Use polaridades diferentes para "Empurra-Puxa" (ex: Ida=Positiva, Volta=Negativa)
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      <div className="flex gap-2 pt-2 border-t border-slate-700 mt-2">
                        <button onClick={handleDelete} className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-200 py-2 rounded text-xs font-bold border border-red-800 transition-colors flex items-center justify-center gap-1">
                          <Trash2 className="w-3 h-3" /> Excluir
                        </button>
                        <button onClick={handleSave} className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-lg shadow-blue-900/20">
                          <Save className="w-3 h-3" /> Salvar Alterações
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 right-14 bg-slate-900/90 backdrop-blur border border-slate-700/50 p-3 rounded-lg shadow-xl z-50 flex gap-6">

                {/* Tipos de Conexão */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 border-b border-white/5 pb-1">Tipos</h4>
                  <div className="flex items-center gap-3 opacity-80">
                    <div className="flex items-center w-8 justify-center">
                      <div className="w-6 h-0.5 bg-slate-400"></div>
                      <ArrowRight className="w-3 h-3 text-slate-400 -ml-1" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-300">Influência</span>
                      <span className="block text-[9px] text-slate-500">Unidirecional</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 opacity-80">
                    <div className="flex items-center w-8 justify-center">
                      <ArrowLeft className="w-3 h-3 text-slate-400 -mr-1" />
                      <div className="w-6 h-0.5 bg-slate-400"></div>
                      <ArrowRight className="w-3 h-3 text-slate-400 -ml-1" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-300">Feedback</span>
                      <span className="block text-[9px] text-slate-500">Bidirecional</span>
                    </div>
                  </div>
                </div>

                {/* Separator */}
                <div className="w-px bg-white/10"></div>

                {/* Intensidade */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 border-b border-white/5 pb-1">Intensidade</h4>

                  {/* Fraca */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center w-8 justify-center">
                      <div className="w-6 bg-slate-400" style={{ height: '1px' }}></div>
                      <ArrowRight className="text-slate-400 -ml-1" style={{ width: '10px', height: '10px' }} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Fraca</span>
                  </div>

                  {/* Moderada */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center w-8 justify-center">
                      <div className="w-6 bg-slate-300" style={{ height: '2px' }}></div>
                      <ArrowRight className="text-slate-300 -ml-1" style={{ width: '16px', height: '16px' }} />
                    </div>
                    <span className="text-[10px] text-slate-300 font-medium">Moderada</span>
                  </div>

                  {/* Forte */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center w-8 justify-center">
                      <div className="w-6 bg-white" style={{ height: '4px' }}></div>
                      <ArrowRight className="text-white -ml-1" style={{ width: '30px', height: '30px' }} />
                    </div>
                    <span className="text-[10px] text-white font-bold">Forte (Dominante)</span>
                  </div>
                </div>

              </div>
            </ReactFlow>
          </div>
        </div>
      </div>
    </div>
  );
}
