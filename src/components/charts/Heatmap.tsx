import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface HeatmapCell {
  x: string; // tenure_band
  y: string; // contract_group
  value: number; // churn_probability
  size: number; // customers (for bubble size)
  data: any; // Full segment data for tooltip/modal
}

interface HeatmapProps {
  data: HeatmapCell[];
  width?: number;
  height?: number;
  onCellClick?: (cell: HeatmapCell) => void;
}

export default function Heatmap({
  data,
  width = 800,
  height = 400,
  onCellClick,
}: HeatmapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 40, right: 150, bottom: 80, left: 100 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Extract unique X and Y values
    const xValues = Array.from(new Set(data.map(d => d.x))).sort((a, b) => {
      // Custom sort for tenure bands
      const order = ['0-3m', '4-12m', '13-24m', '25-48m', '49-72m'];
      return order.indexOf(a) - order.indexOf(b);
    });

    const yValues = Array.from(new Set(data.map(d => d.y))).sort((a, b) => {
      // Custom sort for contract groups
      const order = ['M2M', '1yr', '2yr'];
      return order.indexOf(a) - order.indexOf(b);
    });

    // X scale: tenure bands
    const xScale = d3
      .scaleBand()
      .domain(xValues)
      .range([0, chartWidth])
      .padding(0.1);

    // Y scale: contract groups
    const yScale = d3
      .scaleBand()
      .domain(yValues)
      .range([0, chartHeight])
      .padding(0.1);

    // Color scale: churn probability (purple gradient)
    const colorScale = d3
      .scaleSequential()
      .domain([0, d3.max(data, d => d.value)!])
      .interpolator(d3.interpolateRgbBasis(['#E6D2FA', '#7823DC', '#9150E1', '#7823DC']));

    // Draw cells (rectangles for standard heatmap)
    svg
      .selectAll('.heatmap-cell')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'heatmap-cell')
      .attr('x', d => xScale(d.x)!)
      .attr('y', d => yScale(d.y)!)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.value))
      .attr('opacity', 0.85)
      .attr('rx', 4)
      .attr('ry', 4)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .attr('opacity', 1)
          .attr('stroke', '#FFFFFF')
          .attr('stroke-width', 2);

        const tooltip = d3.select(tooltipRef.current);
        tooltip
          .style('opacity', 1)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`)
          .html(
            `
            <div style="font-weight: 600; margin-bottom: 4px;">${d.x} • ${d.y}</div>
            <div>Churn Risk: ${(d.value * 100).toFixed(1)}%</div>
            <div>Customers: ${d.size.toLocaleString()}</div>
            <div style="margin-top: 4px; font-size: 12px; color: #A5A5A5;">Click for details</div>
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
        d3.select(this)
          .attr('opacity', 0.85)
          .attr('stroke', 'none');
        d3.select(tooltipRef.current).style('opacity', 0);
      })
      .on('click', function (event, d) {
        if (onCellClick) {
          onCellClick(d);
        }
      });

    // X-axis
    svg
      .append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('fill', '#E5E5E5')
      .attr('font-size', '12px')
      .attr('font-family', 'Inter, sans-serif')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    svg.select('.domain').attr('stroke', '#2A2A2A');
    svg.selectAll('.tick line').attr('stroke', '#2A2A2A');

    // X-axis label
    svg
      .append('text')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + 65)
      .attr('text-anchor', 'middle')
      .attr('fill', '#E5E5E5')
      .attr('font-size', '14px')
      .attr('font-family', 'Inter, sans-serif')
      .text('Customer Tenure');

    // Y-axis
    svg
      .append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .attr('fill', '#E5E5E5')
      .attr('font-size', '12px')
      .attr('font-family', 'Inter, sans-serif');

    svg.select('.domain').attr('stroke', '#2A2A2A');
    svg.selectAll('.tick line').remove();

    // Y-axis label
    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 20)
      .attr('x', -chartHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#E5E5E5')
      .attr('font-size', '14px')
      .attr('font-family', 'Inter, sans-serif')
      .text('Contract Type');

    // Legend: Color gradient
    const legendWidth = 20;
    const legendHeight = 150;

    const legendScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, d => d.value)!])
      .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale).ticks(5).tickFormat(d => `${((d as number) * 100).toFixed(0)}%`);

    const legend = svg
      .append('g')
      .attr('transform', `translate(${chartWidth + 30}, ${chartHeight / 2 - legendHeight / 2})`);

    // Gradient definition
    const defs = svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'churn-gradient')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%');

    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#E6D2FA');
    gradient.append('stop').attr('offset', '33%').attr('stop-color', '#7823DC');
    gradient.append('stop').attr('offset', '67%').attr('stop-color', '#9150E1');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#7823DC');

    legend
      .append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#churn-gradient)');

    legend
      .append('g')
      .attr('transform', `translate(${legendWidth}, 0)`)
      .call(legendAxis)
      .selectAll('text')
      .attr('fill', '#A5A5A5')
      .attr('font-size', '11px')
      .attr('font-family', 'Inter, sans-serif');

    legend.selectAll('.domain, .tick line').remove();

    // Legend label
    legend
      .append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#E5E5E5')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('font-family', 'Inter, sans-serif')
      .text('Churn Risk');
  }, [data, width, height, onCellClick]);

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
