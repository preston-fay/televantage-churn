import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface GroupedBarData {
  group: string; // Model name
  values: {
    metric: string;
    value: number;
  }[];
  highlight?: boolean; // Highlight winner
}

interface GroupedBarChartProps {
  data: GroupedBarData[];
  width?: number;
  height?: number;
  yAxisLabel?: string;
  metrics?: string[]; // Metric names for legend
  colors?: string[]; // Colors for each metric
}

export default function GroupedBarChart({
  data,
  width = 700,
  height = 400,
  yAxisLabel = 'Score',
  metrics = [],
  colors = ['#7823DC', '#9150E1', '#C8A5F0'], // Kearney purple gradient
}: GroupedBarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 100, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Extract metric names
    const metricNames = metrics.length > 0 ? metrics : data[0].values.map(v => v.metric);

    // X0 scale: groups (models)
    const x0Scale = d3
      .scaleBand()
      .domain(data.map(d => d.group))
      .range([0, chartWidth])
      .padding(0.2);

    // X1 scale: metrics within each group
    const x1Scale = d3
      .scaleBand()
      .domain(metricNames)
      .range([0, x0Scale.bandwidth()])
      .padding(0.05);

    // Y scale
    const allValues = data.flatMap(d => d.values.map(v => v.value));
    const maxY = Math.max(...allValues);
    const yScale = d3
      .scaleLinear()
      .domain([0, maxY * 1.1])
      .range([chartHeight, 0]);

    // Color scale
    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(metricNames)
      .range(colors);

    // Draw bars
    const groups = svg
      .selectAll('.group')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'group')
      .attr('transform', d => `translate(${x0Scale(d.group)}, 0)`);

    groups
      .selectAll('rect')
      .data(d => d.values.map(v => ({ ...v, group: d.group, highlight: d.highlight })))
      .enter()
      .append('rect')
      .attr('x', d => x1Scale(d.metric)!)
      .attr('y', d => yScale(d.value))
      .attr('width', x1Scale.bandwidth())
      .attr('height', d => chartHeight - yScale(d.value))
      .attr('fill', d => colorScale(d.metric))
      .attr('opacity', d => (d.highlight ? 1 : 0.7))
      .attr('stroke', d => (d.highlight ? '#FFFFFF' : 'none'))
      .attr('stroke-width', d => (d.highlight ? 2 : 0))
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('opacity', 1);

        const tooltip = d3.select(tooltipRef.current);
        tooltip
          .style('opacity', 1)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`)
          .html(
            `
            <div style="font-weight: 600; margin-bottom: 4px;">${d.group}</div>
            <div>${d.metric}: ${d.value.toFixed(4)}</div>
          `
          );
      })
      .on('mousemove', function (event) {
        const tooltip = d3.select(tooltipRef.current);
        tooltip
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`);
      })
      .on('mouseleave', function (event, d) {
        d3.select(this).attr('opacity', d.highlight ? 1 : 0.7);
        d3.select(tooltipRef.current).style('opacity', 0);
      });

    // X-axis
    svg
      .append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(x0Scale))
      .selectAll('text')
      .attr('fill', '#A5A5A5')
      .attr('font-size', '11px')
      .attr('font-family', 'Inter, sans-serif')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    svg.select('.domain').attr('stroke', '#2A2A2A');
    svg.selectAll('.tick line').attr('stroke', '#2A2A2A');

    // Y-axis
    svg
      .append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .selectAll('text')
      .attr('fill', '#A5A5A5')
      .attr('font-size', '12px')
      .attr('font-family', 'Inter, sans-serif');

    svg.select('.domain').attr('stroke', '#2A2A2A');
    svg.selectAll('.tick line').remove(); // NO gridlines

    // Y-axis label
    if (yAxisLabel) {
      svg
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin.left + 20)
        .attr('x', -chartHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#E5E5E5')
        .attr('font-size', '14px')
        .attr('font-family', 'Inter, sans-serif')
        .text(yAxisLabel);
    }

    // Legend
    const legend = svg
      .append('g')
      .attr('transform', `translate(${chartWidth - 150}, -10)`);

    metricNames.forEach((metric, i) => {
      const legendRow = legend
        .append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendRow
        .append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', colorScale(metric));

      legendRow
        .append('text')
        .attr('x', 20)
        .attr('y', 12)
        .attr('fill', '#E5E5E5')
        .attr('font-size', '12px')
        .attr('font-family', 'Inter, sans-serif')
        .text(metric);
    });
  }, [data, width, height, yAxisLabel, metrics, colors]);

  return (
    <div style={{ position: 'relative' }}>
      <svg ref={svgRef}></svg>
      <div
        ref={tooltipRef}
        style={{
          position: 'fixed',
          opacity: 0,
          pointerEvents: 'none',
          backgroundColor: '#1A1A1A',
          border: '1px solid #2A2A2A',
          borderRadius: '6px',
          padding: '12px',
          fontSize: '14px',
          color: '#E5E5E5',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          zIndex: 1000,
        }}
      ></div>
    </div>
  );
}
