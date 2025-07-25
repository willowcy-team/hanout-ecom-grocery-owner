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
  products: Product[];
}

interface Product {
  id: string;
  name: string;
  category_id: string;
  subcategory_id: string;
  price: number;
}

export default function CategoryPerformanceChart({ 
  orders, 
  categories, 
  subcategories,
  products 
}: CategoryPerformanceChartProps) {
  // Calculate the data outside so it's available for tooltips
  const calculateCategoryData = () => {
    // Create a map of product ID to category for quick lookups
    const productToCategoryMap = new Map<string, string>();
    products.forEach(product => {
      productToCategoryMap.set(product.id, product.category_id);
    });

    // Calculate category performance metrics
    const categoryStats = categories.map(category => {
      // Get products in this category
      const categoryProducts = products.filter(product => product.category_id === category.id);
      const categoryProductIds = new Set(categoryProducts.map(p => p.id));
      
      // Calculate metrics for this category
      let totalOrders = 0;
      let totalRevenue = 0;
      let totalItems = 0;
      let totalQuantity = 0;

      // Process completed orders
      const completedOrders = orders.filter(order => order.status === 'completed');
      
      completedOrders.forEach(order => {
        let hasProductFromCategory = false;
        let orderCategoryRevenue = 0;
        let orderCategoryItems = 0;
        let orderCategoryQuantity = 0;

        order.items.forEach(item => {
          // Check if this item belongs to the current category
          if (categoryProductIds.has(item.id)) {
            hasProductFromCategory = true;
            orderCategoryRevenue += item.price * item.quantity;
            orderCategoryItems += 1;
            orderCategoryQuantity += item.quantity;
          }
        });

        if (hasProductFromCategory) {
          totalOrders += 1;
          totalRevenue += orderCategoryRevenue;
          totalItems += orderCategoryItems;
          totalQuantity += orderCategoryQuantity;
        }
      });
      
      return {
        name: category.name,
        emoji: category.emoji,
        orders: totalOrders,
        revenue: totalRevenue,
        items: totalItems,
        quantity: totalQuantity,
        subcategoryCount: subcategories.filter(sub => sub.category_id === category.id).length,
        productCount: categoryProducts.length
      };
    });

    // Filter out categories with no sales and get top performing ones
    const activeCategoryStats = categoryStats.filter(stat => stat.revenue > 0);
    
    if (activeCategoryStats.length === 0) {
      return {
        labels: ['No Sales Data'],
        datasets: []
      };
    }

    // Calculate max values for normalization
    const maxOrders = Math.max(...activeCategoryStats.map(cat => cat.orders));
    const maxRevenue = Math.max(...activeCategoryStats.map(cat => cat.revenue));
    const maxQuantity = Math.max(...activeCategoryStats.map(cat => cat.quantity));

    // Normalize to 0-100 scale and sort by revenue
    const normalizedStats = activeCategoryStats.map(cat => ({
      ...cat,
      normalizedOrders: maxOrders > 0 ? (cat.orders / maxOrders) * 100 : 0,
      normalizedRevenue: maxRevenue > 0 ? (cat.revenue / maxRevenue) * 100 : 0,
      normalizedQuantity: maxQuantity > 0 ? (cat.quantity / maxQuantity) * 100 : 0,
    })).sort((a, b) => b.revenue - a.revenue);

    // Get top 6 categories for better visualization
    const topCategories = normalizedStats.slice(0, 6);

    const labels = topCategories.map(cat => `${cat.emoji} ${cat.name}`);

    return {
      topCategories,
      chartData: {
        labels,
        datasets: [
          {
            label: 'Order Volume',
            data: topCategories.map(cat => cat.normalizedOrders),
            borderColor: 'rgba(234, 88, 12, 0.8)',
            backgroundColor: 'rgba(234, 88, 12, 0.2)',
            pointBackgroundColor: 'rgba(234, 88, 12, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(234, 88, 12, 1)',
          },
          {
            label: 'Revenue Performance',
            data: topCategories.map(cat => cat.normalizedRevenue),
            borderColor: 'rgba(59, 130, 246, 0.8)',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
          },
          {
            label: 'Quantity Sold',
            data: topCategories.map(cat => cat.normalizedQuantity),
            borderColor: 'rgba(16, 185, 129, 0.8)',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            pointBackgroundColor: 'rgba(16, 185, 129, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(16, 185, 129, 1)',
          }
        ]
      }
    };
  };

  const { topCategories, chartData } = calculateCategoryData();

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
            const categoryIndex = context.dataIndex;
            const categoryData = topCategories[categoryIndex];
            
            if (!categoryData) return `${label}: ${value}%`;
            
            let actualValue = '';
            if (label === 'Order Volume') {
              actualValue = `${categoryData.orders} orders`;
            } else if (label === 'Revenue Performance') {
              actualValue = `${categoryData.revenue.toFixed(2)} DH`;
            } else if (label === 'Quantity Sold') {
              actualValue = `${categoryData.quantity} items`;
            }
            
            return `${label}: ${value}% (${actualValue})`;
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

  if (categories.length === 0 || products.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-lg font-medium">No category data available</div>
          <div className="text-sm">Create categories and products to see performance analysis</div>
        </div>
      </div>
    );
  }

  if (chartData.datasets.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-lg font-medium">No sales data available</div>
          <div className="text-sm">Complete some orders to see category performance</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <Radar data={chartData} options={options} />
    </div>
  );
}