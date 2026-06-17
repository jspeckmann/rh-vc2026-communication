import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  createKnowledgeEdge,
  createKnowledgeNode,
  fetchNetworkData,
} from '../../services/api.js';

const EMPTY_NODE_FORM = {
  type: 'topic',
  title: '',
  summary: '',
  sourceType: 'group',
  sourceId: '',
};

const EMPTY_EDGE_FORM = {
  fromNodeId: '',
  toNodeId: '',
  relation: 'related_to',
  confidence: '0.8',
  sourceType: 'manual',
  sourceId: '',
};

export default function NetworkSection({ selectedGroupId, selectedGroupKnown }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const observerRef = useRef(null);
  const zoomRef = useRef(null);
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [filter, setFilter] = useState('all');
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeForm, setNodeForm] = useState(EMPTY_NODE_FORM);
  const [edgeForm, setEdgeForm] = useState(EMPTY_EDGE_FORM);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [savingNode, setSavingNode] = useState(false);
  const [savingEdge, setSavingEdge] = useState(false);
  const [formError, setFormError] = useState('');

  const loadGraph = useCallback((preferredNodeId = '') => {
    setLoading(true);
    return fetchNetworkData()
      .then((data) => {
        setGraph(data);
        if (preferredNodeId) {
          setSelectedNode(data.nodes.find((node) => node.id === preferredNodeId) ?? null);
        }
        setLoadError(false);
      })
      .catch(() => {
        setLoadError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) loadGraph();
    });
    return () => {
      cancelled = true;
    };
  }, [loadGraph]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setNodeForm((current) => ({
        ...current,
        sourceId: current.sourceId || (selectedGroupKnown ? selectedGroupId : ''),
      }));
    });
    return () => {
      cancelled = true;
    };
  }, [selectedGroupId, selectedGroupKnown]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setEdgeForm((current) => {
        const nodeIds = new Set(graph.nodes.map((node) => node.id));
        const fromNodeId = nodeIds.has(current.fromNodeId)
          ? current.fromNodeId
          : graph.nodes[0]?.id ?? '';
        const fallbackTarget = graph.nodes.find((node) => node.id !== fromNodeId)?.id ?? '';
        const toNodeId = nodeIds.has(current.toNodeId) && current.toNodeId !== fromNodeId
          ? current.toNodeId
          : fallbackTarget;
        return {
          ...current,
          fromNodeId,
          toNodeId,
          sourceId: current.sourceId || (selectedGroupKnown ? selectedGroupId : ''),
        };
      });
    });
    return () => {
      cancelled = true;
    };
  }, [graph.nodes, selectedGroupId, selectedGroupKnown]);

  const nodeTypes = useMemo(
    () => [...new Set(graph.nodes.map((node) => node.group).filter(Boolean))].sort(),
    [graph.nodes],
  );

  const visibleGraph = useMemo(() => {
    const nodes = filter === 'all'
      ? graph.nodes
      : graph.nodes.filter((node) => node.group === filter);
    const nodeIds = new Set(nodes.map((node) => node.id));
    const links = graph.links.filter((link) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });
    return { nodes, links };
  }, [filter, graph]);

  const visibleSelectedNode = selectedNode && visibleGraph.nodes.some((node) => node.id === selectedNode.id)
    ? selectedNode
    : null;

  useEffect(() => {
    const container = containerRef.current;
    const svgElement = svgRef.current;
    if (!container || !svgElement || loading || loadError) return;

    const width = container.clientWidth || 800;
    const height = Math.max(container.clientHeight || 460, 420);
    const nodes = visibleGraph.nodes.map((node) => ({ ...node }));
    const links = visibleGraph.links.map((link) => ({ ...link }));

    const svg = d3.select(svgElement);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    if (simulationRef.current) {
      simulationRef.current.stop();
      simulationRef.current = null;
    }
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    const root = svg.append('g');
    const color = d3.scaleOrdinal(d3.schemeTableau10).domain(nodeTypes);
    const zoom = d3
      .zoom()
      .scaleExtent([0.45, 3])
      .on('zoom', (event) => {
        root.attr('transform', event.transform);
      });
    svg.call(zoom);
    zoomRef.current = { svg, zoom };

    const link = root
      .append('g')
      .attr('stroke', 'var(--color-gray)')
      .attr('stroke-opacity', 0.45)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', (edge) => Math.max(1, (edge.confidence ?? 0.6) * 2.4));

    const node = root
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .on('click', (event, datum) => {
        event.stopPropagation();
        setSelectedNode(visibleGraph.nodes.find((item) => item.id === datum.id) ?? datum);
      })
      .call(
        d3
          .drag()
          .on('start', (event, datum) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            datum.fx = datum.x;
            datum.fy = datum.y;
          })
          .on('drag', (event, datum) => {
            datum.fx = event.x;
            datum.fy = event.y;
          })
          .on('end', (event, datum) => {
            if (!event.active) simulation.alphaTarget(0);
            datum.fx = null;
            datum.fy = null;
          }),
      );

    node
      .append('circle')
      .attr('r', 10)
      .attr('fill', (datum) => color(datum.group))
      .attr('stroke', 'var(--color-content)')
      .attr('stroke-width', 2);

    node
      .append('text')
      .text((datum) => datum.title || datum.id)
      .attr('x', 14)
      .attr('y', 4)
      .attr('font-size', 11)
      .attr('fill', 'var(--color-fg)');

    const simulation = d3
      .forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((datum) => datum.id).distance(110))
      .force('charge', d3.forceManyBody().strength(-280))
      .force('collide', d3.forceCollide().radius(48))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .on('tick', () => {
        link
          .attr('x1', (datum) => datum.source.x)
          .attr('y1', (datum) => datum.source.y)
          .attr('x2', (datum) => datum.target.x)
          .attr('y2', (datum) => datum.target.y);

        node.attr('transform', (datum) => `translate(${datum.x},${datum.y})`);
      });

    simulationRef.current = simulation;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const nextWidth = entry.contentRect.width;
        const nextHeight = Math.max(entry.contentRect.height, 420);
        svg.attr('width', nextWidth).attr('height', nextHeight);
        simulation.force('center', d3.forceCenter(nextWidth / 2, nextHeight / 2));
        simulation.alpha(0.25).restart();
      }
    });

    resizeObserver.observe(container);
    observerRef.current = resizeObserver;

    return () => {
      simulation.stop();
      svg.on('.zoom', null);
      resizeObserver.disconnect();
    };
  }, [loading, loadError, nodeTypes, visibleGraph]);

  const resetZoom = () => {
    if (!zoomRef.current) return;
    zoomRef.current.svg
      .transition()
      .duration(180)
      .call(zoomRef.current.zoom.transform, d3.zoomIdentity);
  };

  const handleNodeFormChange = (field, value) => {
    setNodeForm((current) => ({ ...current, [field]: value }));
  };

  const handleEdgeFormChange = (field, value) => {
    setEdgeForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateNode = async (event) => {
    event.preventDefault();
    const title = nodeForm.title.trim();
    if (!title) return;
    setSavingNode(true);
    setFormError('');
    try {
      const node = await createKnowledgeNode({
        type: nodeForm.type.trim() || 'topic',
        title,
        summary: nodeForm.summary.trim(),
        sourceType: nodeForm.sourceType.trim() || 'manual',
        sourceId: nodeForm.sourceId.trim() || (selectedGroupKnown ? selectedGroupId : 'manual'),
      });
      setNodeForm((current) => ({ ...EMPTY_NODE_FORM, sourceId: current.sourceId }));
      setFilter('all');
      await loadGraph(node.id);
    } catch {
      setFormError('Knoten konnte nicht erstellt werden.');
    } finally {
      setSavingNode(false);
    }
  };

  const handleCreateEdge = async (event) => {
    event.preventDefault();
    const confidence = Number.parseFloat(edgeForm.confidence);
    if (!edgeForm.fromNodeId || !edgeForm.toNodeId || edgeForm.fromNodeId === edgeForm.toNodeId) return;
    setSavingEdge(true);
    setFormError('');
    try {
      await createKnowledgeEdge({
        fromNodeId: edgeForm.fromNodeId,
        toNodeId: edgeForm.toNodeId,
        relation: edgeForm.relation.trim() || 'related_to',
        confidence: Number.isFinite(confidence) ? confidence : 0.8,
        sourceType: edgeForm.sourceType.trim() || 'manual',
        sourceId: edgeForm.sourceId.trim() || (selectedGroupKnown ? selectedGroupId : 'manual'),
      });
      await loadGraph(selectedNode?.id ?? edgeForm.fromNodeId);
    } catch {
      setFormError('Kante konnte nicht erstellt werden.');
    } finally {
      setSavingEdge(false);
    }
  };

  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[1fr_320px]">
      <section className="ui-panel flex min-h-0 flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-gray)]/15 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Vernetzungswolke</h2>
            <p className="text-xs text-[var(--color-gray)]">
              {visibleGraph.nodes.length} Knoten / {visibleGraph.links.length} Kanten
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Knowledge-Graph-Typ filtern"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="ui-input px-2 py-1.5 text-sm"
            >
              <option value="all">Alle Typen</option>
              {nodeTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={resetZoom}
              className="ui-button px-3 py-1.5 text-sm hover:border-[var(--color-accent)]"
            >
              Reset
            </button>
          </div>
        </div>

        <div ref={containerRef} className="relative min-h-[420px] flex-1">
          {loading ? (
            <p className="p-4 text-sm text-[var(--color-gray)]">Lade Netzwerkdaten...</p>
          ) : loadError ? (
            <p className="p-4 text-sm text-[var(--color-error)]">Knowledge Graph konnte nicht geladen werden.</p>
          ) : visibleGraph.nodes.length === 0 ? (
            <p className="p-4 text-sm text-[var(--color-gray)]">Keine Knoten.</p>
          ) : null}
          <svg ref={svgRef} className="h-full min-h-[420px] w-full" />
        </div>
      </section>

      <aside className="ui-panel min-h-0 overflow-y-auto p-4">
        <h2 className="mb-3 text-sm font-semibold">Graph bearbeiten</h2>
        {formError ? <p className="mb-3 text-xs text-[var(--color-error)]">{formError}</p> : null}

        <form className="space-y-2 border-b border-[var(--color-gray)]/15 pb-4" onSubmit={handleCreateNode}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-gray)]">Knoten</h3>
          <div className="grid grid-cols-[110px_1fr] gap-2">
            <input
              aria-label="Knoten-Typ"
              value={nodeForm.type}
              onChange={(event) => handleNodeFormChange('type', event.target.value)}
              placeholder="Typ"
              className="ui-input px-2 py-1.5 text-xs"
            />
            <input
              aria-label="Knoten-Titel"
              value={nodeForm.title}
              onChange={(event) => handleNodeFormChange('title', event.target.value)}
              placeholder="Titel"
              className="ui-input px-2 py-1.5 text-xs"
            />
          </div>
          <textarea
            aria-label="Knoten-Zusammenfassung"
            value={nodeForm.summary}
            onChange={(event) => handleNodeFormChange('summary', event.target.value)}
            placeholder="Zusammenfassung"
            rows={3}
            className="ui-input w-full px-2 py-1.5 text-xs"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              aria-label="Knoten-Quelle"
              value={nodeForm.sourceType}
              onChange={(event) => handleNodeFormChange('sourceType', event.target.value)}
              placeholder="sourceType"
              className="ui-input px-2 py-1.5 text-xs"
            />
            <input
              aria-label="Knoten-Quell-ID"
              value={nodeForm.sourceId}
              onChange={(event) => handleNodeFormChange('sourceId', event.target.value)}
              placeholder="sourceId"
              className="ui-input px-2 py-1.5 text-xs"
            />
          </div>
          <button
            type="submit"
            disabled={!nodeForm.title.trim() || savingNode}
            className="ui-button ui-button-primary px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            Knoten anlegen
          </button>
        </form>

        <form className="mt-4 space-y-2 border-b border-[var(--color-gray)]/15 pb-4" onSubmit={handleCreateEdge}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-gray)]">Kante</h3>
          <select
            aria-label="Startknoten"
            value={edgeForm.fromNodeId}
            onChange={(event) => handleEdgeFormChange('fromNodeId', event.target.value)}
            className="ui-input w-full px-2 py-1.5 text-xs"
          >
            {graph.nodes.map((node) => (
              <option key={node.id} value={node.id}>{node.title}</option>
            ))}
          </select>
          <select
            aria-label="Zielknoten"
            value={edgeForm.toNodeId}
            onChange={(event) => handleEdgeFormChange('toNodeId', event.target.value)}
            className="ui-input w-full px-2 py-1.5 text-xs"
          >
            {graph.nodes.map((node) => (
              <option key={node.id} value={node.id}>{node.title}</option>
            ))}
          </select>
          <div className="grid grid-cols-[1fr_82px] gap-2">
            <input
              aria-label="Kantenrelation"
              value={edgeForm.relation}
              onChange={(event) => handleEdgeFormChange('relation', event.target.value)}
              placeholder="relation"
              className="ui-input px-2 py-1.5 text-xs"
            />
            <input
              aria-label="Konfidenz"
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={edgeForm.confidence}
              onChange={(event) => handleEdgeFormChange('confidence', event.target.value)}
              className="ui-input px-2 py-1.5 text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              aria-label="Kanten-Quelle"
              value={edgeForm.sourceType}
              onChange={(event) => handleEdgeFormChange('sourceType', event.target.value)}
              placeholder="sourceType"
              className="ui-input px-2 py-1.5 text-xs"
            />
            <input
              aria-label="Kanten-Quell-ID"
              value={edgeForm.sourceId}
              onChange={(event) => handleEdgeFormChange('sourceId', event.target.value)}
              placeholder="sourceId"
              className="ui-input px-2 py-1.5 text-xs"
            />
          </div>
          <button
            type="submit"
            disabled={!edgeForm.fromNodeId || !edgeForm.toNodeId || edgeForm.fromNodeId === edgeForm.toNodeId || savingEdge}
            className="ui-button ui-button-primary px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            Kante anlegen
          </button>
        </form>

        <h2 className="mb-3 mt-4 text-sm font-semibold">Details</h2>
        {visibleSelectedNode ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold">{visibleSelectedNode.title ?? visibleSelectedNode.id}</h3>
              <span className="mt-1 inline-block rounded border border-[var(--color-gray)]/20 px-2 py-1 text-xs text-[var(--color-gray)]">
                {visibleSelectedNode.group}
              </span>
            </div>
            <p className="text-sm leading-6">{visibleSelectedNode.summary}</p>
            <dl className="grid grid-cols-[90px_1fr] gap-2 text-xs">
              <dt className="text-[var(--color-gray)]">Quelle</dt>
              <dd>{visibleSelectedNode.sourceType}</dd>
              <dt className="text-[var(--color-gray)]">ID</dt>
              <dd className="break-all">{visibleSelectedNode.sourceId}</dd>
            </dl>
            <RelationList node={visibleSelectedNode} links={graph.links} nodes={graph.nodes} />
          </div>
        ) : (
          <p className="text-sm text-[var(--color-gray)]">Kein Knoten gewählt.</p>
        )}
      </aside>
    </div>
  );
}

function RelationList({ node, links, nodes }) {
  const nodesById = useMemo(() => new Map(nodes.map((item) => [item.id, item])), [nodes]);
  const relations = links.filter((link) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    return sourceId === node.id || targetId === node.id;
  });

  if (!relations.length) return null;

  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-gray)]">
        Beziehungen
      </h4>
      <div className="space-y-2">
        {relations.map((link) => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          const otherId = sourceId === node.id ? targetId : sourceId;
          return (
            <article key={link.id ?? `${sourceId}-${targetId}`} className="ui-card-row px-3 py-2 text-xs">
              <strong className="block">{nodesById.get(otherId)?.title ?? otherId}</strong>
              <span className="text-[var(--color-gray)]">{link.relation}</span>
            </article>
          );
        })}
      </div>
    </div>
  );
}
