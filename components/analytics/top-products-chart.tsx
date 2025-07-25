"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { Order } from '@/lib/supabase';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TopProductsChartProps {
  orders: Order[];
  limit?: number;
}

export default function TopProductsChart({ orders, limit = 10 }: TopProductsChartProps) {
  const prepareData = () => {
    // Calculate product sales data
    const productStats = orders
      .filter(order => order.status === 'completed')
      .reduce((acc, order) => {
        order.items.forEach(item => {
          if (!acc[item.name]) {
            acc[item.name] = {
              quantity: 0,
              revenue: 0,
              orders: 0
            };
          }
          acc[item.name].quantity += item.quantity;
          acc[item.name].revenue += item.price * item.quantity;
          acc[item.name].orders += 1;
        });
        return acc;
      }, {} as Record<string, { quantity: number; revenue: number; orders: number }>);

    // Sort by quantity sold and take top products
    const topProducts = Object.entries(productStats)
      .sort(([, a], [, b]) => b.quantity - a.quantity)
      .slice(0, limit);

    const labels = topProducts.map(([name]) => {
      // Truncate long product names
      return name.length > 20 ? name.substring(0, 20) + '...' : name;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Quantity Sold',
          data: topProducts.map(([, stats]) => stats.quantity),
          backgroundColor: 'rgba(234, 88, 12, 0.8)',
          borderColor: 'rgba(234, 88, 12, 1)',
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: 'Revenue (DH)',
          data: topProducts.map(([, stats]) => stats.revenue),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          yAxisID: 'y1',
        }
      ]
    };
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: `Top ${limit} Products by Sales`,
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
              if (context.dataset.label?.includes('Revenue')) {
                label += new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'MAD',
                  minimumFractionDigits: 0
                }).format(context.parsed.y).replace('MAD', 'DH');
              } else {
                label += context.parsed.y + ' units';
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
          text: 'Products'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Quantity Sold'
        },
        ticks: {
          callback: function(value) {
            return value + ' units';
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Revenue (DH)'
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value) {
            return value + ' DH';
          }
        }
      },
    },
  };

  const data = prepareData();

  if (data.labels.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-lg font-medium">No sales data available</div>
          <div className="text-sm">Complete some orders to see top products</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <Bar data={data} options={options} />
    </div>
  );
}