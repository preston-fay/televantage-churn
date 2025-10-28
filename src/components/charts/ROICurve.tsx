import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface ROIPoint {
  budget: number;
  roi: number;
}

interface ROICurveProps {
  data: ROIPoint[];
  optimalBudget: number;
  width?: number;
  height?: number;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export default function ROICurve({
  data,
  optimalBudget,
  width = 600,
  height = 400,
  xAxisLabel = 'Annual Budget',
  yAxisLabel = 'ROI',
}: ROICurveProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 40, bottom: 70, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, d => d.budget)!])
      .range([0, chartWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, d => d.roi)! * 1.1])
      .range([chartHeight, 0]);

    // Line generator
    const line = d3
      .line<ROIPoint>()
      .x(d => xScale(d.budget))
      .y(d => yScale(d.roi))
      .curve(d3.curveCatmullRom.alpha(0.5));

    // Draw area under curve (gradient fill)
    const area = d3
      .area<ROIPoint>()
      .x(d => xScale(d.budget))
      .y0(chartHeight)
      .y1(d => yScale(d.roi))
      .curve(d3.curveCatmullRom.alpha(0.5));

    svg
      .append('path')
      .datum(data)
      .attr('fill', 'url(#roi-gradient)')
      .attr('opacity', 0.2)
      .attr('d', area);

    // Define gradient
    const gradient = svg
      .append('defs')
      .append('linearGradient')
      .attr('id', 'roi-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#C8A5F0')
      .attr('stop-opacity', 0.8);

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#C8A5F0')
      .attr('stop-opacity', 0);

    // Draw line
    svg
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#C8A5F0')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Find optimal point
    const optimalPoint = data.reduce((prev, current) =>
      Math.abs(current.budget - optimalBudget) < Math.abs(prev.budget - optimalBudget)
        ? current
        : prev
    );

    // Draw optimal point marker
    svg
      .append('circle')
      .attr('cx', xScale(optimalPoint.budget))
      .attr('cy', yScale(optimalPoint.roi))
      .attr('r', 8)
      .attr('fill', '#C8A5F0')
      .attr('stroke', '#0A0A0A')
      .attr('stroke-width', 3);

    // Draw vertical line from optimal point to x-axis
    svg
      .append('line')
      .attr('x1', xScale(optimalPoint.budget))
      .attr('x2', xScale(optimalPoint.budget))
      .attr('y1', yScale(optimalPoint.roi))
      .attr('y2', chartHeight)
      .attr('stroke', '#C8A5F0')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.6);

    // Draw optimal label
    svg
      .append('text')
      .attr('x', xScale(optimalPoint.budget))
      .attr('y', yScale(optimalPoint.roi) - 15)
      .attr('text-anchor', 'middle')
      .attr('fill', '#E5E5E5')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('font-family', 'Inter, sans-serif')
      .text('Optimal');

    // Interactive points along the curve
    svg
      .selectAll('.roi-point')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'roi-point')
      .attr('cx', d => xScale(d.budget))
      .attr('cy', d => yScale(d.roi))
      .attr('r', 4)
      .attr('fill', '#C8A5F0')
      .attr('opacity', 0)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('opacity', 1).attr('r', 6);

        const tooltip = d3.select(tooltipRef.current);
        tooltip
          .style('opacity', 1)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`)
          .html(
            `
            <div style="font-weight: 600; margin-bottom: 4px;">Budget: $${(d.budget / 1_000_000).toFixed(0)}M</div>
            <div>ROI: ${(d.roi * 100).toFixed(1)}%</div>
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
        d3.select(this).attr('opacity', 0).attr('r', 4);
        d3.select(tooltipRef.current).style('opacity', 0);
      });

    // X-axis
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(5)
      .tickFormat(d => `$${(d as number) / 1_000_000}M`);

    svg
      .append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#A5A5A5')
      .attr('font-size', '12px')
      .attr('font-family', 'Inter, sans-serif');

    svg.select('.domain').attr('stroke', '#2A2A2A');
    svg.selectAll('.tick line').attr('stroke', '#2A2A2A');

    // X-axis label
    svg
      .append('text')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + margin.bottom - 15)
      .attr('text-anchor', 'middle')
      .attr('fill', '#E5E5E5')
      .attr('font-size', '14px')
      .attr('font-family', 'Inter, sans-serif')
      .text(xAxisLabel);

    // Y-axis
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => `${((d as number) * 100).toFixed(0)}%`);

    svg
      .append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#A5A5A5')
      .attr('font-size', '12px')
      .attr('font-family', 'Inter, sans-serif');

    svg.select('.domain').attr('stroke', '#2A2A2A');
    svg.selectAll('.tick line').remove(); // NO gridlines

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
      .text(yAxisLabel);
  }, [data, optimalBudget, width, height, xAxisLabel, yAxisLabel]);

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
