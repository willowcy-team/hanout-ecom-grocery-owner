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
import { format, parseISO, getHours } from 'date-fns';
import type { Order } from '@/lib/supabase';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CustomerBehaviorChartProps {
  orders: Order[];
  type?: 'hourly' | 'delivery-method' | 'order-size';
}

export default function CustomerBehaviorChart({ 
  orders, 
  type = 'hourly' 
}: CustomerBehaviorChartProps) {
  const prepareHourlyData = () => {
    const hourlyData = Array(24).fill(0);
    
    orders.forEach(order => {
      const hour = getHours(parseISO(order.created_at));
      hourlyData[hour]++;
    });

    const labels = Array.from({ length: 24 }, (_, i) => {
      const hour = i === 0 ? 12 : i > 12 ? i - 12 : i;
      const ampm = i < 12 ? 'AM' : 'PM';
      return `${hour}${ampm}`;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Orders per Hour',
          data: hourlyData,
          backgroundColor: 'rgba(234, 88, 12, 0.8)',
          borderColor: 'rgba(234, 88, 12, 1)',
          borderWidth: 2,
        }
      ]
    };
  };

  const prepareDeliveryMethodData = () => {
    const deliveryStats = orders.reduce((acc, order) => {
      acc[order.delivery_method] = (acc[order.delivery_method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const labels = Object.keys(deliveryStats).map(method => 
      method === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'
    );

    return {
      labels,
      datasets: [
        {
          label: 'Orders by Method',
          data: Object.values(deliveryStats),
          backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)'],
          borderColor: ['rgba(59, 130, 246, 1)', 'rgba(16, 185, 129, 1)'],
          borderWidth: 2,
        }
      ]
    };
  };

  const prepareOrderSizeData = () => {
    const sizeRanges = [
      { label: '1-2 items', min: 1, max: 2 },
      { label: '3-5 items', min: 3, max: 5 },
      { label: '6-10 items', min: 6, max: 10 },
      { label: '11-20 items', min: 11, max: 20 },
      { label: '20+ items', min: 21, max: Infinity }
    ];

    const sizeData = sizeRanges.map(range => {
      return orders.filter(order => {
        const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
        return itemCount >= range.min && itemCount <= range.max;
      }).length;
    });

    // Calculate average order value for each size range
    const avgValues = sizeRanges.map(range => {
      const rangeOrders = orders.filter(order => {
        const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
        return itemCount >= range.min && itemCount <= range.max && order.status === 'completed';
      });
      
      if (rangeOrders.length === 0) return 0;
      
      const totalValue = rangeOrders.reduce((sum, order) => sum + order.total, 0);
      return Math.round(totalValue / rangeOrders.length);
    });

    return {
      labels: sizeRanges.map(range => range.label),
      datasets: [
        {
          label: 'Number of Orders',
          data: sizeData,
          backgroundColor: 'rgba(234, 88, 12, 0.8)',
          borderColor: 'rgba(234, 88, 12, 1)',
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: 'Avg Order Value (DH)',
          data: avgValues,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          yAxisID: 'y1',
        }
      ]
    };
  };

  const getChartData = () => {
    switch (type) {
      case 'hourly':
        return prepareHourlyData();
      case 'delivery-method':
        return prepareDeliveryMethodData();
      case 'order-size':
        return prepareOrderSizeData();
      default:
        return prepareHourlyData();
    }
  };

  const getChartTitle = () => {
    switch (type) {
      case 'hourly':
        return 'Order Activity by Hour';
      case 'delivery-method':
        return 'Delivery Method Preferences';
      case 'order-size':
        return 'Order Size Distribution';
      default:
        return 'Customer Behavior';
    }
  };

  const getOptions = (): ChartOptions<'bar'> => {
    const baseOptions: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: getChartTitle(),
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
                if (context.dataset.label?.includes('Value')) {
                  label += context.parsed.y + ' DH';
                } else {
                  label += context.parsed.y + (context.parsed.y === 1 ? ' order' : ' orders');
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
            text: type === 'hourly' ? 'Time of Day' : 
                  type === 'delivery-method' ? 'Delivery Method' : 'Order Size'
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Number of Orders'
          }
        }
      }
    };

    // Add second y-axis for order-size chart
    if (type === 'order-size') {
      baseOptions.scales!.y1 = {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Average Value (DH)'
        },
        grid: {
          drawOnChartArea: false,
        },
      };
    }

    return baseOptions;
  };

  const data = getChartData();
  const options = getOptions();

  if (orders.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-lg font-medium">No order data available</div>
          <div className="text-sm">Process some orders to see customer behavior</div>
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