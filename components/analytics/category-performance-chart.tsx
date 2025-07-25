"use client";

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import type { Order, Category, SubCategory } from '@/lib/supabase';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface CategoryPerformanceChartProps {
  orders: Order[];
  categories: Category[];
  subcategories: SubCategory[];
}

export default function CategoryPerformanceChart({ 
  orders, 
  categories, 
  subcategories 
}: CategoryPerformanceChartProps) {
  const prepareData = () => {
    // Calculate category performance metrics
    const categoryStats = categories.map(category => {
      const categorySubcategories = subcategories.filter(sub => sub.category_id === category.id);
      
      // Get all orders containing products from this category
      const categoryOrders = orders.filter(order => 
        order.status === 'completed' && 
        order.items.some(item => {
          // We'll need to match items by checking if any subcategory matches
          // For now, we'll use a simplified approach
          return true; // This would need product data to properly filter
        })
      );

      // Calculate metrics
      const totalOrders = categoryOrders.length;
      const totalRevenue = categoryOrders.reduce((sum, order) => sum + order.total, 0);
      const totalItems = categoryOrders.reduce((sum, order) => 
        sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      );
      
      // Normalize metrics (0-100 scale)
      const maxOrders = Math.max(...categories.map(c => categoryOrders.length), 1);
      const maxRevenue = Math.max(...categories.map(c => totalRevenue), 1);
      const maxItems = Math.max(...categories.map(c => totalItems), 1);
      
      return {
        name: category.name,
        emoji: category.emoji,
        orders: (totalOrders / maxOrders) * 100,
        revenue: (totalRevenue / maxRevenue) * 100,
        items: (totalItems / maxItems) * 100,
        subcategoryCount: categorySubcategories.length,
        popularity: Math.min((totalOrders / Math.max(orders.length, 1)) * 500, 100) // Popularity score
      };
    });

    // Get top 6 categories for better visualization
    const topCategories = categoryStats
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    const labels = topCategories.map(cat => `${cat.emoji} ${cat.name}`);

    return {
      labels,
      datasets: [
        {
          label: 'Order Volume',
          data: topCategories.map(cat => cat.orders),
          borderColor: 'rgba(234, 88, 12, 0.8)',
          backgroundColor: 'rgba(234, 88, 12, 0.2)',
          pointBackgroundColor: 'rgba(234, 88, 12, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(234, 88, 12, 1)',
        },
        {
          label: 'Revenue Performance',
          data: topCategories.map(cat => cat.revenue),
          borderColor: 'rgba(59, 130, 246, 0.8)',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          pointBackgroundColor: 'rgba(59, 130, 246, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
        },
        {
          label: 'Item Sales',
          data: topCategories.map(cat => cat.items),
          borderColor: 'rgba(16, 185, 129, 0.8)',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          pointBackgroundColor: 'rgba(16, 185, 129, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(16, 185, 129, 1)',
        }
      ]
    };
  };

  const options: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Category Performance Analysis',
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
            const label = context.dataset.label || '';
            const value = Math.round(context.parsed.r);
            return `${label}: ${value}%`;
          }
        }
      }
    },
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          },
          stepSize: 20
        },
        pointLabels: {
          font: {
            size: 11
          }
        }
      }
    },
    elements: {
      line: {
        borderWidth: 2
      },
      point: {
        radius: 4,
        hoverRadius: 6
      }
    }
  };

  const data = prepareData();

  if (categories.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-lg font-medium">No category data available</div>
          <div className="text-sm">Create categories to see performance analysis</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <Radar data={data} options={options} />
    </div>
  );
}