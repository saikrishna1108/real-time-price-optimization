import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

type RecentOptimization = {
  productId: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  confidence: number;
  timestamp: Date;
};

export const PricingDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    averagePriceChange: 0,
    totalRevenue: 0,
    priceOptimizations: 0,
    averageConfidence: 0,
    lastUpdated: new Date()
  });

  const [recentOptimizations, setRecentOptimizations] = useState<RecentOptimization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Mock data for now - would be replaced with actual API calls
      setMetrics({
        totalProducts: 15,
        averagePriceChange: 2.3,
        totalRevenue: 45230.50,
        priceOptimizations: 127,
        averageConfidence: 0.78,
        lastUpdated: new Date()
      });

      setRecentOptimizations([
        {
          productId: 'prod-001',
          productName: 'Premium Flight Ticket',
          oldPrice: 299.99,
          newPrice: 310.00,
          confidence: 0.85,
          timestamp: new Date(Date.now() - 5 * 60 * 1000)
        },
        {
          productId: 'prod-002',
          productName: 'Hotel Room',
          oldPrice: 150.00,
          newPrice: 145.00,
          confidence: 0.72,
          timestamp: new Date(Date.now() - 15 * 60 * 1000)
        }
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return 'text-red-600';
    if (change < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return <ArrowTrendingUpIcon className="h-5 w-5 text-red-500" />;
    if (change < 0) return <ArrowTrendingDownIcon className="h-5 w-5 text-green-500" />;
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Pricing Dashboard</h2>
        <div className="text-sm text-gray-500">
          Last updated: {metrics.lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingBagIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Price Change</p>
              <div className="flex items-center">
                <p className={`text-2xl font-bold ${getPriceChangeColor(metrics.averagePriceChange)}`}>
                  {metrics.averagePriceChange > 0 ? '+' : ''}{metrics.averagePriceChange.toFixed(1)}%
                </p>
                {getPriceChangeIcon(metrics.averagePriceChange)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${metrics.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Optimizations</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.priceOptimizations}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Algorithm Performance */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Algorithm Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">Average Confidence Score</p>
            <div className="flex items-center mt-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${metrics.averageConfidence * 100}%` }}
                ></div>
              </div>
              <span className="ml-3 text-sm font-medium text-gray-900">
                {(metrics.averageConfidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Price Change Distribution</p>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Increases</span>
                <span className="text-red-600 font-medium">45%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Decreases</span>
                <span className="text-green-600 font-medium">35%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>No Change</span>
                <span className="text-gray-600 font-medium">20%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Optimizations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Price Optimizations</h3>
        <div className="space-y-4">
          {recentOptimizations.map((optimization: any, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{optimization.productName}</p>
                <p className="text-sm text-gray-500">{optimization.productId}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Price Change</p>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900">${optimization.oldPrice}</span>
                    <span className="mx-2">→</span>
                    <span className={`font-medium ${getPriceChangeColor(optimization.newPrice - optimization.oldPrice)}`}>
                      ${optimization.newPrice}
                    </span>
                    {getPriceChangeIcon(optimization.newPrice - optimization.oldPrice)}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Confidence</p>
                  <p className="font-medium text-gray-900">{(optimization.confidence * 100).toFixed(0)}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium text-gray-900">
                    {optimization.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 