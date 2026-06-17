export const fallbackFeedItems = [
  {
    id: 'feed-1',
    title: 'Neue Projekt-Updates',
    description: 'Es gibt neue Informationen zu Projekt A in der Vernetzungswolke.',
    time: 'Vor 5 Minuten',
  },
  {
    id: 'feed-2',
    title: 'Relevante Wiki-Änderungen',
    description: 'Das Wiki wurde von Max aktualisiert.',
    time: 'Vor 12 Minuten',
  },
  {
    id: 'feed-3',
    title: 'Chat-Nachricht für dich',
    description: 'Lisa hat eine Nachricht in dem Team-Chat hinterlassen.',
    time: 'Vor 25 Minuten',
  },
];

export function getMockNetworkData() {
  return {
    nodes: [
      { id: 'Projekt A', group: 1 },
      { id: 'Projekt B', group: 1 },
      { id: 'Max', group: 2 },
      { id: 'Lisa', group: 2 },
      { id: 'Tom', group: 2 },
      { id: 'Anna', group: 2 },
      { id: 'Design', group: 3 },
      { id: 'Frontend', group: 3 },
      { id: 'Backend', group: 3 },
    ],
    links: [
      { source: 'Max', target: 'Projekt A' },
      { source: 'Lisa', target: 'Projekt A' },
      { source: 'Tom', target: 'Projekt B' },
      { source: 'Anna', target: 'Projekt B' },
      { source: 'Max', target: 'Design' },
      { source: 'Lisa', target: 'Frontend' },
      { source: 'Tom', target: 'Backend' },
      { source: 'Projekt A', target: 'Design' },
      { source: 'Projekt A', target: 'Frontend' },
      { source: 'Projekt B', target: 'Backend' },
    ],
  };
}

export const defaultGroups = [
  { id: crypto.randomUUID(), name: 'Hackathon-Projekte', collapsed: false },
  { id: crypto.randomUUID(), name: 'Team-Intern', collapsed: true },
];
