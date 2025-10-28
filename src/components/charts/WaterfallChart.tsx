import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface WaterfallBarData {
  label: string;
  value: number;
  type: 'loss' | 'gain' | 'total';
}

interface WaterfallChartProps {
  data: WaterfallBarData[];
  width?: number;
  height?: number;
}

export default function WaterfallChart({
  data,
  width = 600,
  height = 400,
}: WaterfallChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 100, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Calculate cumulative values for positioning
    let cumulative = 0;
    const processedData = data.map((d) => {
      let start, end;

      if (d.type === 'total') {
        // Total bars go from 0 to their absolute value
        start = 0;
        end = d.value;
      } else {
        // Incremental bars (loss/gain) stack on cumulative
        start = cumulative;
        end = cumulative + d.value;
        cumulative = end;
      }

      return {
        ...d,
        start,
        end,
        displayValue: Math.abs(d.value),
      };
    });

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(processedData.map((d) => d.label))
      .range([0, chartWidth])
      .padding(0.3);

    const maxValue = Math.max(...processedData.map((d) => Math.max(d.start, d.end)));
    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue * 1.1])
      .range([chartHeight, 0]);

    // Color mapping
    const colorMap = {
      loss: '#7823DC', // Kearney purple (insight color)
      gain: '#9150E1', // Bright purple
      total: '#7823DC', // Medium lavender
    };

    // Draw bars
    svg
      .selectAll('.bar')
      .data(processedData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => xScale(d.label)!)
      .attr('y', (d) => yScale(Math.max(d.start, d.end)))
      .attr('width', xScale.bandwidth())
      .attr('height', (d) => Math.abs(yScale(d.start) - yScale(d.end)))
      .attr('fill', (d) => colorMap[d.type])
      .attr('stroke', '#0A0A0A')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('opacity', 0.8);

        const tooltip = d3.select(tooltipRef.current);
        const sign = d.type === 'gain' ? '-' : d.type === 'total' ? '' : '+';
        tooltip
          .style('opacity', 1)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`)
          .html(
            `
            <div style="font-weight: 600; margin-bottom: 4px;">${d.label}</div>
            <div>Value: ${sign}$${(d.displayValue / 1_000_000_000).toFixed(2)}B</div>
            <div style="font-size: 12px; color: #A5A5A5; margin-top: 4px;">${
              d.type === 'loss' ? 'Baseline Cost' : d.type === 'gain' ? 'AI Savings' : 'Net Risk'
            }</div>
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

    // Add connecting lines (optional, for waterfall effect)
    processedData.forEach((d, i) => {
      if (i < processedData.length - 1 && d.type !== 'total') {
        const nextBar = processedData[i + 1];
        if (nextBar.type !== 'total') {
          svg
            .append('line')
            .attr('x1', xScale(d.label)! + xScale.bandwidth())
            .attr('y1', yScale(d.end))
            .attr('x2', xScale(nextBar.label)!)
            .attr('y2', yScale(nextBar.start))
            .attr('stroke', '#3A3A3A')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '4,4');
        }
      }
    });

    // Add value labels on bars
    svg
      .selectAll('.label')
      .data(processedData)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', (d) => xScale(d.label)! + xScale.bandwidth() / 2)
      .attr('y', (d) => yScale(Math.max(d.start, d.end)) - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', '#E5E5E5')
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .attr('font-family', 'Inter, sans-serif')
      .text((d) => `$${(d.displayValue / 1_000_000_000).toFixed(2)}B`);

    // X-axis
    svg
      .append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('fill', '#A5A5A5')
      .attr('font-size', '12px')
      .attr('font-family', 'Inter, sans-serif')
      .style('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .call(function(selection) {
        selection.each(function() {
          const text = d3.select(this);
          const words = text.text().split(/\s+/);
          text.text('');

          words.forEach((word, i) => {
            text.append('tspan')
              .attr('x', 0)
              .attr('dy', i === 0 ? '0' : '1.1em')
              .text(word);
          });
        });
      });

    svg.select('.domain').attr('stroke', '#2A2A2A');
    svg.selectAll('.tick line').attr('stroke', '#2A2A2A');

    // Y-axis (optional, can be removed for cleaner look)
    svg
      .append('g')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickFormat((d) => `$${(d as number / 1_000_000_000).toFixed(1)}B`)
      )
      .selectAll('text')
      .attr('fill', '#A5A5A5')
      .attr('font-size', '12px')
      .attr('font-family', 'Inter, sans-serif');

    svg.select('.domain').attr('stroke', '#2A2A2A');
    svg.selectAll('.tick line').remove(); // NO gridlines
  }, [data, width, height]);

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
