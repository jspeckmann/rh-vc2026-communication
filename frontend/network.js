let currentSimulation = null;
let currentResizeHandler = null;

function getMockNetworkData() {
  return {
    nodes: [
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
    ],
    links: [
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
    ]
  };
}

function clearContainer(container) {
  container.innerHTML = '';
}

function stopCurrentGraph(container) {
  if (currentSimulation) {
    currentSimulation.stop();
    currentSimulation = null;
  }

  if (currentResizeHandler) {
    window.removeEventListener('resize', currentResizeHandler);
    currentResizeHandler = null;
  }

  clearContainer(container);
}

function showNetworkMessage(container, message) {
  const wrapper = document.createElement('div');
  wrapper.className = 'p-4 text-main';
  wrapper.textContent = message;
  container.appendChild(wrapper);
}

async function loadNetworkData() {
  try {
    const response = await fetch(`${BASE_URL}/network`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    return contentType.includes('application/json') ? await response.json() : null;
  } catch (error) {
    console.error('Netzwerkdaten konnten nicht geladen werden:', error);
    return null;
  }
}

function getNodeLabel(d) {
  if (d.type === 'person') {
    return `Typ: Person${d.skills ? `\nSkills: ${d.skills.join(', ')}` : ''}`;
  }

  if (d.type === 'project') {
    return 'Typ: Projekt';
  }

  if (d.type === 'skill') {
    return 'Typ: Skill';
  }

  return `Typ: ${d.type}`;
}

async function initNetworkGraph() {
  const container = document.getElementById('network-container');
  if (!container) return;

  stopCurrentGraph(container);

  if (!window.d3) {
    showNetworkMessage(container, 'D3.js konnte nicht geladen werden.');
    return;
  }

  const data = await loadNetworkData();
  const networkData = data && Array.isArray(data.nodes) && Array.isArray(data.links)
    ? data
    : getMockNetworkData();

  if (!networkData.nodes.length) {
    showNetworkMessage(container, 'Keine Netzwerkdaten verfügbar.');
    return;
  }

  const width = container.clientWidth || 800;
  const height = container.clientHeight || 500;
  const colorMap = {
    person: 'var(--accent)',
    project: 'var(--success)',
    skill: 'var(--in-progress-color)'
  };

  const svg = d3.select(container).append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const tooltip = d3.select('#tooltip');
  const graph = svg.append('g');

  const link = graph.append('g')
    .selectAll('line')
    .data(networkData.links)
    .enter()
    .append('line')
    .attr('class', 'link')
    .attr('stroke-width', 1.5);

  const node = graph.append('g')
    .selectAll('g')
    .data(networkData.nodes)
    .enter()
    .append('g')
    .attr('class', 'node')
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended));

  node.append('circle')
    .attr('r', 12)
    .style('fill', d => colorMap[d.type] || '#66606D');

  node.append('text')
    .attr('class', 'text')
    .text(d => d.name)
    .attr('dy', 25);

  node.on('mouseover', function(event, d) {
    tooltip
      .text(`${d.name}\n${getNodeLabel(d)}`)
      .style('visibility', 'visible');
  })
  .on('mousemove', function(event) {
    tooltip
      .style('top', `${event.pageY - 10}px`)
      .style('left', `${event.pageX + 10}px`);
  })
  .on('mouseout', function() {
    tooltip.style('visibility', 'hidden');
  });

  const simulation = d3.forceSimulation(networkData.nodes)
    .force('link', d3.forceLink(networkData.links).id(d => d.id).distance(150))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .alpha(1)
    .restart();

  currentSimulation = simulation;

  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    node
      .attr('transform', d => `translate(${d.x},${d.y})`);
  });

  function dragstarted(event, d) {
    if (!event.active) {
      simulation.alphaTarget(0.3).restart();
    }
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) {
      simulation.alphaTarget(0);
    }
    d.fx = null;
    d.fy = null;
  }

  currentResizeHandler = () => {
    const nextWidth = container.clientWidth || width;
    const nextHeight = container.clientHeight || height;

    svg.attr('viewBox', `0 0 ${nextWidth} ${nextHeight}`);
    simulation.force('center', d3.forceCenter(nextWidth / 2, nextHeight / 2));
    simulation.alpha(0.3).restart();
  };

  window.addEventListener('resize', currentResizeHandler);
}
