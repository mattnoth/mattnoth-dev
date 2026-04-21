import * as d3 from 'd3';

// ── Types ─────────────────────────────────────────────────────────────

interface RawNode {
  id: string;
  label: string;
  type: 'person' | 'institution' | 'location' | 'program';
  metadata: {
    affiliations?: string[];
    dates?: Record<string, string>;
    status?: string;
    case_slug?: string;
    description?: string;
  };
}

interface RawEdge {
  source: string;
  target: string;
  edge_type: string;
  layer: 'tight' | 'medium' | 'corkboard';
  confidence: string;
  evidence_pointer: string;
  label: string;
}

interface DiagramData {
  nodes: RawNode[];
  edges: RawEdge[];
  layers: Record<string, { description: string; rendering_notes: string }>;
}

type SimNode = RawNode & d3.SimulationNodeDatum;
interface SimEdge extends d3.SimulationLinkDatum<SimNode> {
  edge_type: string;
  layer: 'tight' | 'medium' | 'corkboard';
  confidence: string;
  evidence_pointer: string;
  label: string;
}

// ── Constants ─────────────────────────────────────────────────────────

const BASE = '/unpublished/missing-scientists';

const NODE_COLORS: Record<string, string> = {
  person:      'var(--color-accent)',
  institution: 'oklch(55% 0.12 145)',
  location:    'oklch(60% 0.1 180)',
  program:     'oklch(55% 0.12 60)',
};

const NODE_RADIUS: Record<string, number> = {
  person: 14,
  institution: 10,
  location: 8,
  program: 8,
};

const CONFIDENCE_WIDTH: Record<string, number> = {
  confirmed:  2.5,
  reported:   2,
  alleged:    1.5,
  speculated: 1,
};

const LAYER_STYLE: Record<string, { dash: string; opacity: number }> = {
  tight:     { dash: '',        opacity: 1 },
  medium:    { dash: '6,4',     opacity: 0.7 },
  corkboard: { dash: '2,4',     opacity: 0.4 },
};

// ── Mount ─────────────────────────────────────────────────────────────

export function mount(el: HTMLElement): void {
  const canvas = el.querySelector<HTMLElement>('.ms-interactive__canvas');
  const tooltip = el.querySelector<HTMLElement>('.ms-tooltip');
  const controls = el.querySelector<HTMLElement>('.ms-controls');
  if (!canvas) return;

  const src = el.dataset['src'];
  if (!src) return;

  fetch(src)
    .then(r => r.json())
    .then((data: DiagramData) => render(canvas, tooltip, controls, data))
    .catch(err => {
      canvas.innerHTML = '<p style="padding:2rem;text-align:center">Failed to load diagram data.</p>';
      console.error('[ms-diagram]', err);
    });
}

// ── Render ────────────────────────────────────────────────────────────

function render(
  canvas: HTMLElement,
  tooltip: HTMLElement | null,
  controls: HTMLElement | null,
  data: DiagramData,
): void {
  const width = canvas.clientWidth || 900;
  const height = Math.max(550, Math.min(window.innerHeight - 200, 750));

  // Active layers
  const activeLayers = new Set<string>(['tight']);

  // Create SVG
  const svg = d3.select(canvas)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g');

  // Zoom
  const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.3, 4])
    .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      g.attr('transform', event.transform.toString());
    });

  svg.call(zoomBehavior);

  // Prepare data
  const nodes: SimNode[] = data.nodes.map(n => ({ ...n }));
  const edges: SimEdge[] = data.edges.map(e => ({
    source: e.source,
    target: e.target,
    edge_type: e.edge_type,
    layer: e.layer,
    confidence: e.confidence,
    evidence_pointer: e.evidence_pointer,
    label: e.label,
  }));

  // Force simulation
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink<SimNode, SimEdge>(edges)
      .id(d => d.id)
      .distance(100))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collide', d3.forceCollide<SimNode>().radius(d => (NODE_RADIUS[d.type] ?? 10) + 8));

  // Draw edges
  const edgeGroup = g.append('g').attr('class', 'edges');
  const edgeElements = edgeGroup.selectAll('line')
    .data(edges)
    .join('line')
    .attr('stroke', 'var(--color-text-muted)')
    .attr('stroke-width', d => CONFIDENCE_WIDTH[d.confidence] ?? 1.5)
    .attr('stroke-dasharray', d => LAYER_STYLE[d.layer]?.dash ?? '')
    .attr('stroke-opacity', d => LAYER_STYLE[d.layer]?.opacity ?? 1)
    .style('display', d => activeLayers.has(d.layer) ? null : 'none')
    .style('cursor', 'help')
    .on('mouseenter', (event: MouseEvent, d: SimEdge) => showTooltip(tooltip, event, edgeTooltipHtml(d)))
    .on('mouseleave', () => hideTooltip(tooltip));

  // Draw nodes
  const nodeGroup = g.append('g').attr('class', 'nodes');
  const nodeElements = nodeGroup.selectAll('g')
    .data(nodes)
    .join('g')
    .style('cursor', d => d.metadata.case_slug ? 'pointer' : 'default')
    .on('click', (_event: MouseEvent, d: SimNode) => {
      if (d.metadata.case_slug) {
        window.location.href = `${BASE}/cases/${d.metadata.case_slug}/`;
      }
    })
    .on('mouseenter', (event: MouseEvent, d: SimNode) => showTooltip(tooltip, event, nodeTooltipHtml(d)))
    .on('mouseleave', () => hideTooltip(tooltip))
    .each(function() {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const el = this as SVGGElement;
      d3.select<SVGGElement, SimNode>(el).call(
        d3.drag<SVGGElement, SimNode>()
          .on('start', (event) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
          })
          .on('drag', (event) => {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
          })
          .on('end', (event) => {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
          }),
      );
    });

  // Node circles
  nodeElements.append('circle')
    .attr('r', d => NODE_RADIUS[d.type] ?? 10)
    .attr('fill', d => NODE_COLORS[d.type] ?? 'var(--color-text-muted)')
    .attr('stroke', 'var(--color-bg)')
    .attr('stroke-width', 2);

  // Node labels
  nodeElements.append('text')
    .text(d => d.label.length > 18 ? d.label.slice(0, 16) + '...' : d.label)
    .attr('dy', d => (NODE_RADIUS[d.type] ?? 10) + 14)
    .attr('text-anchor', 'middle')
    .attr('font-size', '11px')
    .attr('font-family', 'var(--font-body)')
    .attr('fill', 'var(--color-text)')
    .attr('pointer-events', 'none');

  // Tick update
  simulation.on('tick', () => {
    edgeElements
      .attr('x1', d => { const s = d.source as SimNode; return s.x ?? 0; })
      .attr('y1', d => { const s = d.source as SimNode; return s.y ?? 0; })
      .attr('x2', d => { const t = d.target as SimNode; return t.x ?? 0; })
      .attr('y2', d => { const t = d.target as SimNode; return t.y ?? 0; });

    nodeElements.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
  });

  // Layer toggle controls
  if (controls) {
    controls.addEventListener('change', (e: Event) => {
      const input = e.target as HTMLInputElement;
      if (input.type !== 'checkbox') return;
      const layer = input.value;
      if (input.checked) {
        activeLayers.add(layer);
      } else {
        activeLayers.delete(layer);
      }
      edgeElements.style('display', d => activeLayers.has(d.layer) ? null : 'none');
      simulation.alpha(0.3).restart();
    });
  }

  // Keyboard: Tab navigates nodes, Enter activates links
  canvas.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') hideTooltip(tooltip);
  });
}

// ── Tooltip helpers ───────────────────────────────────────────────────

function showTooltip(tooltip: HTMLElement | null, event: MouseEvent, html: string): void {
  if (!tooltip) return;
  tooltip.innerHTML = html;
  tooltip.hidden = false;
  const rect = tooltip.parentElement!.getBoundingClientRect();
  const x = event.clientX - rect.left + 12;
  const y = event.clientY - rect.top + 12;
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

function hideTooltip(tooltip: HTMLElement | null): void {
  if (!tooltip) return;
  tooltip.hidden = true;
}

function nodeTooltipHtml(d: SimNode): string {
  const meta = d.metadata;
  let html = `<strong>${d.label}</strong>`;
  html += `<span style="font-size:0.8em;opacity:0.7">${d.type}</span><br>`;
  if (meta.description) html += `<p style="margin:0.25rem 0">${meta.description}</p>`;
  if (meta.status) html += `<p style="margin:0.25rem 0"><em>Status: ${meta.status}</em></p>`;
  if (meta.case_slug) html += `<p style="margin:0.25rem 0;color:var(--color-accent)">Click to view case file</p>`;
  return html;
}

function edgeTooltipHtml(d: SimEdge): string {
  let html = `<strong>${d.label || 'Connection'}</strong>`;
  html += `<p style="margin:0.25rem 0">Type: ${d.edge_type} &middot; Layer: ${d.layer} &middot; Confidence: ${d.confidence}</p>`;
  if (d.evidence_pointer) html += `<p style="margin:0.25rem 0;font-size:0.85em;opacity:0.8">Source: ${d.evidence_pointer}</p>`;
  return html;
}
