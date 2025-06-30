import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type FactorPerformance = { factor: string; impact: number; weight: number };
type RevenueImpact = { day: string; revenue: number; optimizations: number };
type UserSegment = { segment: string; count: number; avgDiscount: number };
type TimeAnalysis = { hour: string; priceChanges: number; avgChange: number };

type AnalyticsData = {
  factorPerformance: FactorPerformance[];
  revenueImpact: RevenueImpact[];
  userSegments: UserSegment[];
  timeAnalysis: TimeAnalysis[];
};

export const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    factorPerformance: [],
    revenueImpact: [],
    userSegments: [],
    timeAnalysis: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      // Mock analytics data
      setAnalyticsData({
        factorPerformance: [
          { factor: 'Demand Elasticity', impact: 25, weight: 0.25 },
          { factor: 'Inventory Level', impact: 20, weight: 0.20 },
          { factor: 'Time Factor', impact: 15, weight: 0.15 },
          { factor: 'Competitor Price', impact: 15, weight: 0.15 },
          { factor: 'User Segment', impact: 10, weight: 0.10 },
          { factor: 'Historical Performance', impact: 10, weight: 0.10 },
          { factor: 'External Factors', impact: 5, weight: 0.05 }
        ],
        revenueImpact: [
          { day: 'Mon', revenue: 8500, optimizations: 12 },
          { day: 'Tue', revenue: 9200, optimizations: 15 },
          { day: 'Wed', revenue: 8800, optimizations: 13 },
          { day: 'Thu', revenue: 9500, optimizations: 18 },
          { day: 'Fri', revenue: 10200, optimizations: 22 },
          { day: 'Sat', revenue: 9800, optimizations: 20 },
          { day: 'Sun', revenue: 8900, optimizations: 16 }
        ],
        userSegments: [
          { segment: 'New Customer', count: 45, avgDiscount: 3.2 },
          { segment: 'Returning Customer', count: 35, avgDiscount: 0 },
          { segment: 'VIP Customer', count: 12, avgDiscount: 5.0 },
          { segment: 'Price Sensitive', count: 8, avgDiscount: 2.0 }
        ],
        timeAnalysis: [
          { hour: '00:00', priceChanges: 5, avgChange: 1.2 },
          { hour: '06:00', priceChanges: 8, avgChange: 1.8 },
          { hour: '12:00', priceChanges: 15, avgChange: 2.5 },
          { hour: '18:00', priceChanges: 12, avgChange: 2.1 },
          { hour: '24:00', priceChanges: 6, avgChange: 1.4 }
        ]
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Analytics & Insights</h2>

      {/* Factor Performance */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Multi-Factor Algorithm Performance</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">Factor Impact Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.factorPerformance}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ factor, impact }) => `${factor}: ${impact}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="impact"
                >
                  {analyticsData.factorPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Impact']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">Factor Weights</h4>
            <div className="space-y-3">
              {analyticsData.factorPerformance.map((factor, index) => (
                <div key={factor.factor} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{factor.factor}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${factor.weight * 100}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {(factor.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Impact */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Impact by Day</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={analyticsData.revenueImpact}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip />
            <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Revenue ($)" />
            <Bar yAxisId="right" dataKey="optimizations" fill="#82ca9d" name="Optimizations" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* User Segment Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Segment Analysis</h3>
          <div className="space-y-4">
            {analyticsData.userSegments.map((segment) => (
              <div key={segment.segment} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{segment.segment}</p>
                  <p className="text-sm text-gray-500">{segment.count} users</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Avg Discount</p>
                  <p className={`font-bold ${segment.avgDiscount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {segment.avgDiscount > 0 ? `-${segment.avgDiscount}%` : '0%'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Time-based Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.timeAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="priceChanges" fill="#3B82F6" name="Price Changes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Peak Performance</h4>
            <p className="text-sm text-blue-700">
              Algorithm performs best during peak hours (12:00-18:00) with 2.1-2.5% average price changes.
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Revenue Optimization</h4>
            <p className="text-sm text-green-700">
              Dynamic pricing has increased average daily revenue by 15% compared to static pricing.
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">User Segmentation</h4>
            <p className="text-sm text-purple-700">
              VIP customers receive 5% average discounts, while new customers get 3.2% to encourage adoption.
            </p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">Inventory Management</h4>
            <p className="text-sm text-yellow-700">
              Low inventory levels trigger 10% price increases, while high inventory leads to 5% decreases.
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <h4 className="font-medium text-red-900 mb-2">Competitive Response</h4>
            <p className="text-sm text-red-700">
              Competitor price changes of ±10% trigger immediate price adjustments to maintain market position.
            </p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg">
            <h4 className="font-medium text-indigo-900 mb-2">Confidence Scoring</h4>
            <p className="text-sm text-indigo-700">
              AI-powered confidence scoring averages 78%, with higher confidence leading to larger price changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 