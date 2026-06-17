import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { fetchNetworkData } from '../../services/api.js';

export default function NetworkSection() {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const observerRef = useRef(null);
  const zoomRef = useRef(null);
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [filter, setFilter] = useState('all');
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchNetworkData()
      .then((data) => {
        if (!cancelled) {
          setGraph(data);
          setLoadError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[1fr_320px]">
      <section className="flex min-h-0 flex-col rounded border border-[var(--color-gray)]/20 bg-[var(--color-content)]">
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
              className="rounded border border-[var(--color-gray)]/25 bg-[var(--color-content)] px-2 py-1.5 text-sm"
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
              className="rounded border border-[var(--color-gray)]/25 px-3 py-1.5 text-sm hover:border-[var(--color-accent)]"
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

      <aside className="min-h-0 overflow-y-auto rounded border border-[var(--color-gray)]/20 bg-[var(--color-content)] p-4">
        <h2 className="mb-3 text-sm font-semibold">Details</h2>
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
          <p className="text-sm text-[var(--color-gray)]">Kein Knoten gewaehlt.</p>
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
            <article key={link.id ?? `${sourceId}-${targetId}`} className="rounded border border-[var(--color-gray)]/15 px-3 py-2 text-xs">
              <strong className="block">{nodesById.get(otherId)?.title ?? otherId}</strong>
              <span className="text-[var(--color-gray)]">{link.relation}</span>
            </article>
          );
        })}
      </div>
    </div>
  );
}
