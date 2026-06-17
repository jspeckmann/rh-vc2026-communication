// ===== Network Graph Visualization =====
function initNetworkGraph() {
  const container = document.getElementById('network-container');
  if (!container) return;

  container.innerHTML = '';

  // Beispiel-Daten (später durch Backend ersetzen)
  const nodes = [
    { id: 1, name: 'Stephanie', type: 'person', skills: ['Projektmanagement', 'Kommunikation'] },
    { id: 2, name: 'Max', type: 'person', skills: ['JavaScript', 'Frontend'] },
    { id: 3, name: 'Lisa', type: 'person', skills: ['KI', 'Python'] },
    { id: 4, name: 'Tom', type: 'person', skills: ['Backend', 'Node.js'] },
    { id: 5, name: 'Projekt A', type: 'project' },
    { id: 6, name: 'Projekt B', type: 'project' },
    { id: 7, name: 'Projektmanagement', type: 'skill' },
    { id: 8, name: 'JavaScript', type: 'skill' },
    { id: 9, name: 'KI', type: 'skill' },
    { id: 10, name: 'Backend', type: 'skill' }
  ];

  const links = [
    { source: 1, target: 5, type: 'works_on' },
    { source: 1, target: 7, type: 'has_skill' },
    { source: 1, target: 8, type: 'has_skill' },
    { source: 2, target: 5, type: 'works_on' },
    { source: 2, target: 8, type: 'has_skill' },
    { source: 3, target: 5, type: 'works_on' },
    { source: 3, target: 9, type: 'has_skill' },
    { source: 4, target: 6, type: 'works_on' },
    { source: 4, target: 10, type: 'has_skill' },
    { source: 5, target: 6, type: 'related' }
  ];

  // Farbzuordnung für Knotentypen
  const colorMap = {
    person: 'var(--accent)',
    project: 'var(--success)',
    skill: 'var(--in-progress)'
  };

  // SVG erstellen
  const svg = d3.select(container).append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${container.clientWidth} ${container.clientHeight}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const tooltip = d3.select('#tooltip');

  // Gruppe für den Graphen
  const g = svg.append('g');

  // Force-Simulation
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(150))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(container.clientWidth / 2, container.clientHeight / 2));

  // Links zeichnen
  const link = g.append('g')
    .selectAll('line')
    .data(links)
    .enter().append('line')
    .attr('class', 'link')
    .attr('stroke-width', 1.5);

  // Knoten zeichnen
  const node = g.append('g')
    .selectAll('g')
    .data(nodes)
    .enter().append('g')
    .attr('class', 'node')
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended));

  // Kreise für Knoten
  node.append('circle')
    .attr('r', 12)
    .attr('fill', d => colorMap[d.type] || '#66606D');

  // Text-Labels für Knoten
  node.append('text')
    .attr('class', 'text')
    .text(d => d.name)
    .attr('dy', 25);

  // Tooltip für Knoten
  node.on('mouseover', function(event, d) {
    let content = `<strong>${d.name}</strong><br>`;
    if (d.type === 'person') {
      content += `Typ: Person<br>`;
      if (d.skills) {
        content += `Skills: ${d.skills.join(', ')}`;
      }
    } else if (d.type === 'project') {
      content += `Typ: Projekt`;
    } else if (d.type === 'skill') {
      content += `Typ: Skill`;
    }
    tooltip.html(content)
      .style('visibility', 'visible');
  })
  .on('mousemove', function(event) {
    tooltip
      .style('top', (event.pageY - 10) + 'px')
      .style('left', (event.pageX + 10) + 'px');
  })
  .on('mouseout', function() {
    tooltip.style('visibility', 'hidden');
  });

  // Positionen aktualisieren
  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    node
      .attr('transform', d => `translate(${d.x},${d.y})`);
  });

  // Drag-Funktionen
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  // Fenstergröße anpassen
  window.addEventListener('resize', () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    svg.attr('viewBox', `0 0 ${width} ${height}`);
    simulation.force('center', d3.forceCenter(width / 2, height / 2));
  });
}