import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { fetchNetworkData } from '../../services/api.js';

export default function NetworkSection() {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const observerRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    const initGraph = async () => {
      const data = await fetchNetworkData();
      if (cancelled) return;

      const width = container.clientWidth || 800;
      const height = container.clientHeight || 500;

      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();
      svg.attr('width', width).attr('height', height);

      const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'network-tooltip')
        .style('position', 'fixed')
        .style('pointer-events', 'none')
        .style('z-index', '1001')
        .style('background', 'var(--color-content)')
        .style('border', '1px solid var(--color-gray)')
        .style('border-radius', '4px')
        .style('padding', '8px 12px')
        .style('font-size', '13px')
        .style('display', 'none');

      const color = d3.scaleOrdinal(d3.schemeCategory10);

      const link = svg
        .append('g')
        .selectAll('line')
        .data(data.links)
        .join('line')
        .attr('stroke', 'var(--color-gray)')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 1.5);

      const node = svg
        .append('g')
        .selectAll('circle')
        .data(data.nodes)
        .join('circle')
        .attr('r', 8)
        .attr('fill', (d) => color(d.group))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .on('mouseover', (event, d) => {
          tooltip.style('display', 'block').text(d.id);
        })
        .on('mousemove', (event) => {
          tooltip
            .style('left', `${event.clientX + 10}px`)
            .style('top', `${event.clientY - 20}px`);
        })
        .on('mouseout', () => {
          tooltip.style('display', 'none');
        })
        .call(
          d3
            .drag()
            .on('start', (event, d) => {
              if (!event.active) simulation.alphaTarget(0.3).restart();
              d.fx = d.x;
              d.fy = d.y;
            })
            .on('drag', (event, d) => {
              d.fx = event.x;
              d.fy = event.y;
            })
            .on('end', (event, d) => {
              if (!event.active) simulation.alphaTarget(0);
              d.fx = null;
              d.fy = null;
            }),
        );

      const label = svg
        .append('g')
        .selectAll('text')
        .data(data.nodes)
        .join('text')
        .text((d) => d.id)
        .attr('font-size', 10)
        .attr('dx', 12)
        .attr('dy', 4)
        .attr('fill', 'var(--color-fg)');

      const simulation = d3
        .forceSimulation(data.nodes)
        .force(
          'link',
          d3.forceLink(data.links).id((d) => d.id).distance(100),
        )
        .force('charge', d3.forceManyBody().strength(-200))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .on('tick', () => {
          link
            .attr('x1', (d) => d.source.x)
            .attr('y1', (d) => d.source.y)
            .attr('x2', (d) => d.target.x)
            .attr('y2', (d) => d.target.y);

          node.attr('cx', (d) => d.x).attr('cy', (d) => d.y);

          label.attr('x', (d) => d.x).attr('y', (d) => d.y);
        });

      if (cancelled) { simulation.stop(); return; }

      simulationRef.current = simulation;
      setLoading(false);

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width: newWidth, height: newHeight } = entry.contentRect;
          svg.attr('width', newWidth).attr('height', newHeight);
          simulation.force('center', d3.forceCenter(newWidth / 2, newHeight / 2));
          simulation.alpha(0.3).restart();
        }
      });

      resizeObserver.observe(container);
      observerRef.current = resizeObserver;
    };

    initGraph();

    return () => {
      cancelled = true;
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      d3.select('body').selectAll('.network-tooltip').remove();
    };
  }, []);

  return (
    <div ref={containerRef} className="h-full min-h-0 w-full">
      {loading && (
        <p className="mb-2 text-sm text-[var(--color-gray)]">Lade Netzwerkdaten...</p>
      )}
      <svg ref={svgRef} className="w-full" style={{ minHeight: '400px' }} />
    </div>
  );
}
