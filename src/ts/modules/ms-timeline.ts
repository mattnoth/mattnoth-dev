import * as d3 from 'd3';

// ── Types ────────────────────────────────────────────────────────���────

interface TimelineEvent {
  id: string;
  date: string;
  date_precision?: string;
  type: string;
  subject?: string | null;
  description: string;
  source_pointer: string;
  confidence: string;
}

interface TimelineData {
  events: TimelineEvent[];
  context_events: TimelineEvent[];
}

// ── Constants ─────────────────────────────────────────────────────────

const BASE = '/unpublished/missing-scientists';

const EVENT_COLORS: Record<string, string> = {
  disappearance:            'oklch(55% 0.15 30)',
  death:                    'oklch(40% 0.12 0)',
  body_found:               'oklch(45% 0.1 300)',
  suspect_arrested:         'oklch(55% 0.12 145)',
  investigation_milestone:  'oklch(55% 0.1 248)',
  institutional_statement:  'oklch(55% 0.08 200)',
  political_event:          'oklch(55% 0.12 60)',
  media_event:              'oklch(60% 0.08 280)',
  other:                    'oklch(50% 0.04 260)',
};

const MARGIN = { top: 40, right: 30, bottom: 60, left: 30 };
const ROW_HEIGHT = 140;
const EVENT_RADIUS = 7;

// ── Mount ─────────────────────────────────────────────────────────────

export function mount(el: HTMLElement): void {
  const canvas = el.querySelector<HTMLElement>('.ms-interactive__canvas');
  const tooltip = el.querySelector<HTMLElement>('.ms-tooltip');
  if (!canvas) return;

  const src = el.dataset['src'];
  if (!src) return;

  fetch(src)
    .then(r => r.json())
    .then((data: TimelineData) => render(canvas, tooltip, data))
    .catch(err => {
      canvas.innerHTML = '<p style="padding:2rem;text-align:center">Failed to load timeline data.</p>';
      console.error('[ms-timeline]', err);
    });
}

// ── Render ────────────────────────────────────────────────────────────

function render(
  canvas: HTMLElement,
  tooltip: HTMLElement | null,
  data: TimelineData,
): void {
  const allEvents = [
    ...data.events.map(e => ({ ...e, row: 'case' as const })),
    ...data.context_events.map(e => ({ ...e, row: 'context' as const })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const width = canvas.clientWidth || 900;
  const height = MARGIN.top + ROW_HEIGHT * 2 + MARGIN.bottom;

  // Time extent
  const dates = allEvents.map(e => new Date(e.date));
  const minDate = d3.min(dates) ?? new Date('2022-01-01');
  const maxDate = d3.max(dates) ?? new Date('2026-12-31');

  // Pad time range by 2 months each side
  const padded = [
    new Date(minDate.getTime() - 60 * 86400000),
    new Date(maxDate.getTime() + 60 * 86400000),
  ] as [Date, Date];

  // Scales
  const xScale = d3.scaleTime()
    .domain(padded)
    .range([MARGIN.left, width - MARGIN.right]);

  const yCase = MARGIN.top + ROW_HEIGHT * 0.5;
  const yContext = MARGIN.top + ROW_HEIGHT * 1.5;

  // SVG
  const svg = d3.select(canvas)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  // Clip path for zoom
  svg.append('defs')
    .append('clipPath')
    .attr('id', 'timeline-clip')
    .append('rect')
    .attr('x', MARGIN.left)
    .attr('y', 0)
    .attr('width', width - MARGIN.left - MARGIN.right)
    .attr('height', height);

  const g = svg.append('g').attr('clip-path', 'url(#timeline-clip)');

  // Row labels
  svg.append('text')
    .attr('x', MARGIN.left + 4)
    .attr('y', MARGIN.top + 8)
    .attr('font-size', '11px')
    .attr('font-weight', '600')
    .attr('fill', 'var(--color-text-muted)')
    .text('Case Events');

  svg.append('text')
    .attr('x', MARGIN.left + 4)
    .attr('y', MARGIN.top + ROW_HEIGHT + 8)
    .attr('font-size', '11px')
    .attr('font-weight', '600')
    .attr('fill', 'var(--color-text-muted)')
    .text('Context Events');

  // Horizontal divider
  g.append('line')
    .attr('x1', MARGIN.left)
    .attr('x2', width - MARGIN.right)
    .attr('y1', MARGIN.top + ROW_HEIGHT)
    .attr('y2', MARGIN.top + ROW_HEIGHT)
    .attr('stroke', 'var(--color-border)')
    .attr('stroke-width', 0.5);

  // X axis
  const xAxis = d3.axisBottom(xScale)
    .ticks(d3.timeMonth.every(3))
    .tickFormat(d3.timeFormat('%b %Y') as (d: Date | d3.NumberValue) => string);

  const axisGroup = svg.append('g')
    .attr('transform', `translate(0,${height - MARGIN.bottom})`)
    .call(xAxis);

  axisGroup.selectAll('text')
    .attr('font-size', '10px')
    .attr('fill', 'var(--color-text-muted)');

  axisGroup.selectAll('line, path')
    .attr('stroke', 'var(--color-border)');

  // Jitter to prevent overlap within same date
  const datePositions = new Map<string, number>();

  function getJitteredY(event: typeof allEvents[0]): number {
    const baseY = event.row === 'case' ? yCase : yContext;
    const dateKey = `${event.row}-${event.date}`;
    const count = datePositions.get(dateKey) ?? 0;
    datePositions.set(dateKey, count + 1);
    return baseY + (count * 18) - 9;
  }

  // Event markers
  const eventGroups = g.selectAll('.event')
    .data(allEvents)
    .join('g')
    .attr('transform', d => `translate(${xScale(new Date(d.date))},${getJitteredY(d)})`)
    .style('cursor', d => d.subject ? 'pointer' : 'default')
    .on('click', (_event: MouseEvent, d: typeof allEvents[0]) => {
      if (d.subject) {
        window.location.href = `${BASE}/cases/${d.subject}/`;
      }
    })
    .on('mouseenter', (event: MouseEvent, d: typeof allEvents[0]) => showTooltip(tooltip, event, tooltipHtml(d)))
    .on('mouseleave', () => hideTooltip(tooltip));

  // Circles
  eventGroups.append('circle')
    .attr('r', EVENT_RADIUS)
    .attr('fill', d => EVENT_COLORS[d.type] ?? EVENT_COLORS['other']!)
    .attr('stroke', 'var(--color-bg)')
    .attr('stroke-width', 1.5)
    .attr('opacity', d => d.confidence === 'speculated' ? 0.6 : 1);

  // Event labels for case events (person name)
  eventGroups.filter(d => d.row === 'case' && !!d.subject)
    .append('text')
    .text(d => d.subject ?? '')
    .attr('dy', -EVENT_RADIUS - 6)
    .attr('text-anchor', 'middle')
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-body)')
    .attr('fill', 'var(--color-text-muted)')
    .attr('pointer-events', 'none');

  // Zoom on x-axis
  const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.5, 8])
    .translateExtent([[0, 0], [width, height]])
    .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      const newX = event.transform.rescaleX(xScale);

      // Update axis
      axisGroup.call(
        d3.axisBottom(newX)
          .ticks(d3.timeMonth.every(3))
          .tickFormat(d3.timeFormat('%b %Y') as (d: Date | d3.NumberValue) => string),
      );
      axisGroup.selectAll('text')
        .attr('font-size', '10px')
        .attr('fill', 'var(--color-text-muted)');
      axisGroup.selectAll('line, path')
        .attr('stroke', 'var(--color-border)');

      // Reset jitter positions
      datePositions.clear();

      // Update event positions
      eventGroups.attr('transform', d =>
        `translate(${newX(new Date(d.date))},${getJitteredY(d)})`,
      );
    });

  svg.call(zoomBehavior);

  // Keyboard navigation
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
  const y = event.clientY - rect.top - 12;
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

function hideTooltip(tooltip: HTMLElement | null): void {
  if (!tooltip) return;
  tooltip.hidden = true;
}

function tooltipHtml(d: { date: string; type: string; description: string; confidence: string; source_pointer: string; subject?: string | null }): string {
  const dateStr = new Date(d.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  let html = `<strong>${dateStr}</strong>`;
  html += `<p style="margin:0.25rem 0">${d.description}</p>`;
  html += `<p style="margin:0.25rem 0;font-size:0.85em;opacity:0.7">${d.type.replace(/_/g, ' ')} &middot; ${d.confidence}</p>`;
  if (d.subject) html += `<p style="margin:0.25rem 0;color:var(--color-accent)">Click to view case</p>`;
  return html;
}
