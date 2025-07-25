"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import type { Order } from '@/lib/supabase';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface RevenueTrendsChartProps {
  orders: Order[];
  days?: number;
}

export default function RevenueTrendsChart({ orders, days = 7 }: RevenueTrendsChartProps) {
  const prepareData = () => {
    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);
    
    const dateRange = eachDayOfInterval({
      start: startOfDay(startDate),
      end: endOfDay(endDate)
    });

    const revenueData = dateRange.map(date => {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= dayStart && orderDate <= dayEnd && order.status === 'completed';
      });
      
      const revenue = dayOrders.reduce((sum, order) => sum + order.total, 0);
      const orderCount = dayOrders.length;
      
      return {
        date: format(date, 'MMM dd'),
        revenue,
        orderCount,
        avgOrderValue: orderCount > 0 ? revenue / orderCount : 0
      };
    });

    return {
      labels: revenueData.map(d => d.date),
      datasets: [
        {
          label: 'Daily Revenue (DH)',
          data: revenueData.map(d => d.revenue),
          borderColor: 'rgb(234, 88, 12)',
          backgroundColor: 'rgba(234, 88, 12, 0.1)',
          tension: 0.4,
          fill: true,
          yAxisID: 'y',
        },
        {
          label: 'Orders Count',
          data: revenueData.map(d => d.orderCount),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: false,
          yAxisID: 'y1',
        },
        {
          label: 'Avg Order Value (DH)',
          data: revenueData.map(d => d.avgOrderValue),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: false,
          yAxisID: 'y',
          borderDash: [5, 5],
        }
      ]
    };
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: `Revenue Trends - Last ${days} Days`,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (context.dataset.label?.includes('DH')) {
                label += new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'MAD',
                  minimumFractionDigits: 0
                }).format(context.parsed.y).replace('MAD', 'DH');
              } else {
                label += context.parsed.y;
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Revenue (DH)'
        },
        ticks: {
          callback: function(value) {
            return value + ' DH';
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Order Count'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const data = prepareData();

  return (
    <div className="h-80 w-full">
      <Line data={data} options={options} />
    </div>
  );
}