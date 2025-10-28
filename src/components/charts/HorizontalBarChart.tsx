import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface HorizontalBarData {
  label: string;
  value: number;
  subtitle?: string;
}

interface HorizontalBarChartProps {
  data: HorizontalBarData[];
  width?: number;
  height?: number;
  xAxisLabel?: string;
  valueFormatter?: (value: number) => string;
  color?: string;
}

export default function HorizontalBarChart({
  data,
  width = 600,
  height = 400,
  xAxisLabel = '',
  valueFormatter = (v) => v.toFixed(2),
  color = '#7823DC', // Kearney purple
}: HorizontalBarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 80, bottom: 60, left: 280 }; // Increased for long labels
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Y scale: categories (feature names)
    const yScale = d3
      .scaleBand()
      .domain(data.map(d => d.label))
      .range([0, chartHeight])
      .padding(0.2);

    // X scale: values (importance scores)
    const maxX = Math.max(...data.map(d => d.value));
    const xScale = d3
      .scaleLinear()
      .domain([0, maxX * 1.1])
      .range([0, chartWidth]);

    // Draw bars
    svg
      .selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', d => yScale(d.label)!)
      .attr('width', d => xScale(d.value))
      .attr('height', yScale.bandwidth())
      .attr('fill', color)
      .attr('opacity', 0.8)
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
            <div style="font-weight: 600; margin-bottom: 4px;">${d.label}</div>
            <div>Importance: ${valueFormatter(d.value)}</div>
            ${d.subtitle ? `<div style="margin-top: 4px; font-size: 12px; color: #A5A5A5;">${d.subtitle}</div>` : ''}
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
        d3.select(this).attr('opacity', 0.8);
        d3.select(tooltipRef.current).style('opacity', 0);
      });

    // Value labels on bars
    svg
      .selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', d => xScale(d.value) + 5)
      .attr('y', d => yScale(d.label)! + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', '#E5E5E5')
      .attr('font-size', '12px')
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-weight', '600')
      .text(d => valueFormatter(d.value));

    // Y-axis (feature names)
    svg
      .append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .attr('fill', '#E5E5E5')
      .attr('font-size', '12px')
      .attr('font-family', 'Inter, sans-serif')
      .style('text-anchor', 'end');

    svg.select('.domain').attr('stroke', '#2A2A2A');
    svg.selectAll('.tick line').remove();

    // X-axis
    svg
      .append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => valueFormatter(d as number)))
      .selectAll('text')
      .attr('fill', '#A5A5A5')
      .attr('font-size', '12px')
      .attr('font-family', 'Inter, sans-serif');

    svg.select('.domain').attr('stroke', '#2A2A2A');
    svg.selectAll('.tick line').attr('stroke', '#2A2A2A');

    // X-axis label
    if (xAxisLabel) {
      svg
        .append('text')
        .attr('x', chartWidth / 2)
        .attr('y', chartHeight + margin.bottom - 15)
        .attr('text-anchor', 'middle')
        .attr('fill', '#E5E5E5')
        .attr('font-size', '14px')
        .attr('font-family', 'Inter, sans-serif')
        .text(xAxisLabel);
    }
  }, [data, width, height, xAxisLabel, valueFormatter, color]);

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
