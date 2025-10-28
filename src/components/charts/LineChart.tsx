import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface LineDataPoint {
  x: string;
  y: number;
}

interface LineSeries {
  name: string;
  data: LineDataPoint[];
  color: string;
}

interface LineChartProps {
  series: LineSeries[];
  width?: number;
  height?: number;
  yAxisLabel?: string;
  valueFormatter?: (value: number) => string;
}

export default function LineChart({
  series,
  width = 600,
  height = 400,
  yAxisLabel = '',
  valueFormatter = (v) => v.toFixed(1) + '%',
}: LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !series.length) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 120, bottom: 60, left: 70 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Get all unique x values
    const xValues = Array.from(new Set(series.flatMap(s => s.data.map(d => d.x))));

    // Scales
    const xScale = d3
      .scalePoint()
      .domain(xValues)
      .range([0, chartWidth])
      .padding(0.5);

    const allYValues = series.flatMap(s => s.data.map(d => d.y));
    const maxY = Math.max(...allYValues);
    const yScale = d3
      .scaleLinear()
      .domain([0, maxY * 1.1])
      .range([chartHeight, 0]);

    // Line generator
    const line = d3
      .line<LineDataPoint>()
      .x(d => xScale(d.x)!)
      .y(d => yScale(d.y))
      .curve(d3.curveMonotoneX);

    // Draw lines
    series.forEach((s) => {
      svg
        .append('path')
        .datum(s.data)
        .attr('fill', 'none')
        .attr('stroke', s.color)
        .attr('stroke-width', 3)
        .attr('d', line);

      // Draw points
      svg
        .selectAll(`.point-${s.name.replace(/\s/g, '-')}`)
        .data(s.data)
        .enter()
        .append('circle')
        .attr('class', `point-${s.name.replace(/\s/g, '-')}`)
        .attr('cx', d => xScale(d.x)!)
        .attr('cy', d => yScale(d.y))
        .attr('r', 5)
        .attr('fill', s.color)
        .attr('stroke', '#0A0A0A')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseenter', function (event, d) {
          d3.select(this).attr('r', 7);

          const tooltip = d3.select(tooltipRef.current);
          tooltip
            .style('opacity', 1)
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 10}px`)
            .html(
              `
              <div style="font-weight: 600; margin-bottom: 4px;">${s.name}</div>
              <div>Tenure: ${d.x}</div>
              <div>${yAxisLabel}: ${valueFormatter(d.y)}</div>
            `
            );
        })
        .on('mousemove', function (event) {
          const tooltip = d3.select(tooltipRef.current);
          tooltip
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 10}px`);
        })
        .on('mouseleave', function () {
          d3.select(this).attr('r', 5);
          d3.select(tooltipRef.current).style('opacity', 0);
        });
    });

    // X-axis
    svg
      .append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('fill', '#A5A5A5')
      .attr('font-size', '12px')
      .attr('font-family', 'Inter, sans-serif');

    svg.select('.domain').attr('stroke', '#2A2A2A');
    svg.selectAll('.tick line').attr('stroke', '#2A2A2A');

    // Y-axis
    svg
      .append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => valueFormatter(d as number)))
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
      .attr('transform', `translate(${chartWidth + 20}, 0)`);

    series.forEach((s, i) => {
      const legendRow = legend
        .append('g')
        .attr('transform', `translate(0, ${i * 25})`);

      legendRow
        .append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('y1', 10)
        .attr('y2', 10)
        .attr('stroke', s.color)
        .attr('stroke-width', 3);

      legendRow
        .append('text')
        .attr('x', 25)
        .attr('y', 10)
        .attr('dy', '0.35em')
        .attr('fill', '#E5E5E5')
        .attr('font-size', '13px')
        .attr('font-family', 'Inter, sans-serif')
        .text(s.name);
    });
  }, [series, width, height, yAxisLabel, valueFormatter]);

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
