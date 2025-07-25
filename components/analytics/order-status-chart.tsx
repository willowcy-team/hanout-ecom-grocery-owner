"use client";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import type { Order } from '@/lib/supabase';

ChartJS.register(ArcElement, Tooltip, Legend);

interface OrderStatusChartProps {
  orders: Order[];
}

export default function OrderStatusChart({ orders }: OrderStatusChartProps) {
  const prepareData = () => {
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusLabels = {
      pending: 'Pending',
      'in-progress': 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };

    const statusColors = {
      pending: '#fbbf24',      // yellow-400
      'in-progress': '#3b82f6', // blue-500
      completed: '#10b981',     // emerald-500
      cancelled: '#ef4444'      // red-500
    };

    const labels = Object.keys(statusCounts).map(status => statusLabels[status as keyof typeof statusLabels] || status);
    const data = Object.values(statusCounts);
    const backgroundColor = Object.keys(statusCounts).map(status => statusColors[status as keyof typeof statusColors]);

    return {
      labels,
      datasets: [
        {
          label: 'Orders',
          data,
          backgroundColor,
          borderColor: backgroundColor.map(color => color + '20'),
          borderWidth: 2,
          hoverBackgroundColor: backgroundColor.map(color => color + 'CC'),
          hoverBorderWidth: 3
        }
      ]
    };
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Order Status Distribution',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((sum, val) => sum + (val as number), 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} orders (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%',
    elements: {
      arc: {
        borderWidth: 2
      }
    }
  };

  const data = prepareData();
  const total = orders.length;

  return (
    <div className="relative h-80 w-full">
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{total}</div>
          <div className="text-sm text-gray-500">Total Orders</div>
        </div>
      </div>
    </div>
  );
}