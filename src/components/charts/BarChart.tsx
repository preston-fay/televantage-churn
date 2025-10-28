import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface BarData {
  category: string;
  value: number;
  label?: string;
}

interface BarChartProps {
  data: BarData[];
  width?: number;
  height?: number;
  yAxisLabel?: string;
  valueFormatter?: (value: number) => string;
  highlightColor?: string;
}

export default function BarChart({
  data,
  width = 500,
  height = 350,
  yAxisLabel = '',
  valueFormatter = (v) => v.toFixed(1) + '%',
  highlightColor = '#7823DC',
}: BarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 70, left: 70 };
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
      .scaleBand()
      .domain(data.map((d) => d.category))
      .range([0, chartWidth])
      .padding(0.3);

    const maxValue = Math.max(...data.map((d) => d.value));
    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue * 1.1])
      .range([chartHeight, 0]);

    // Bars
    svg
      .selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => xScale(d.category)!)
      .attr('y', (d) => yScale(d.value))
      .attr('width', xScale.bandwidth())
      .attr('height', (d) => chartHeight - yScale(d.value))
      .attr('fill', (d, i) => {
        // Use gray for first bar, purple for second (insight color)
        return i === 0 ? '#A5A5A5' : highlightColor;
      })
      .attr('stroke', '#0A0A0A')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('opacity', 0.8);

        const tooltip = d3.select(tooltipRef.current);
        tooltip
          .style('opacity', 1)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`)
          .html(
            `
            <div style="font-weight: 600; margin-bottom: 4px;">${d.category}</div>
            <div>${yAxisLabel}: ${valueFormatter(d.value)}</div>
            ${d.label ? `<div style="font-size: 12px; color: #A5A5A5; margin-top: 4px;">${d.label}</div>` : ''}
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
        d3.select(this).attr('opacity', 1);
        d3.select(tooltipRef.current).style('opacity', 0);
      });

    // Value labels on top of bars
    svg
      .selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', (d) => xScale(d.category)! + xScale.bandwidth() / 2)
      .attr('y', (d) => yScale(d.value) - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', '#E5E5E5')
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .attr('font-family', 'Inter, sans-serif')
      .text((d) => valueFormatter(d.value));

    // X-axis
    svg
      .append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('fill', '#A5A5A5')
      .attr('font-size', '13px')
      .attr('font-family', 'Inter, sans-serif')
      .style('text-anchor', 'middle');

    svg.select('.domain').attr('stroke', '#2A2A2A');
    svg.selectAll('.tick line').attr('stroke', '#2A2A2A');

    // Y-axis
    svg
      .append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickFormat((d) => valueFormatter(d as number)))
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
  }, [data, width, height, yAxisLabel, valueFormatter, highlightColor]);

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
