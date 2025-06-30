import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PriceHistoryData {
  productId: string;
  price: number;
  timestamp: string;
  confidence?: number;
}

export const PriceHistory: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState('prod-001');
  const [priceHistory, setPriceHistory] = useState<PriceHistoryData[]>([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      fetchPriceHistory(selectedProduct);
    }
  }, [selectedProduct]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchPriceHistory = async (productId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/pricing/history/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setPriceHistory(data);
      }
    } catch (error) {
      console.error('Error fetching price history:', error);
      // Mock data for demonstration
      setPriceHistory([
        { productId: 'prod-001', price: 299.99, timestamp: '2024-01-01T10:00:00Z' },
        { productId: 'prod-001', price: 310.00, timestamp: '2024-01-02T10:00:00Z' },
        { productId: 'prod-001', price: 295.00, timestamp: '2024-01-03T10:00:00Z' },
        { productId: 'prod-001', price: 305.00, timestamp: '2024-01-04T10:00:00Z' },
        { productId: 'prod-001', price: 300.00, timestamp: '2024-01-05T10:00:00Z' },
        { productId: 'prod-001', price: 315.00, timestamp: '2024-01-06T10:00:00Z' },
        { productId: 'prod-001', price: 308.00, timestamp: '2024-01-07T10:00:00Z' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = (data: PriceHistoryData[]) => {
    return data.map(item => ({
      ...item,
      date: new Date(item.timestamp).toLocaleDateString(),
      time: new Date(item.timestamp).toLocaleTimeString()
    }));
  };

  const calculatePriceStats = (data: PriceHistoryData[]) => {
    if (data.length === 0) return { min: 0, max: 0, avg: 0, change: 0 };
    
    const prices = data.map(item => item.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const change = ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;
    
    return { min, max, avg, change };
  };

  const stats = calculatePriceStats(priceHistory);
  const chartData = formatChartData(priceHistory);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Price History</h2>
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {products.map((product: any) => (
            <option key={product.productId} value={product.productId}>
              {product.name}
            </option>
          ))}
        </select>
      </div>

      {/* Price Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Lowest Price</p>
          <p className="text-2xl font-bold text-green-600">${stats.min.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Highest Price</p>
          <p className="text-2xl font-bold text-red-600">${stats.max.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Average Price</p>
          <p className="text-2xl font-bold text-blue-600">${stats.avg.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Total Change</p>
          <p className={`text-2xl font-bold ${stats.change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Price Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Trend</h3>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                domain={['dataMin - 10', 'dataMax + 10']}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                formatter={(value: any) => [`$${value}`, 'Price']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Price History Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detailed History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {priceHistory.map((record, index) => {
                const prevPrice = index > 0 ? priceHistory[index - 1].price : record.price;
                const change = ((record.price - prevPrice) / prevPrice) * 100;
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${record.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.confidence ? `${(record.confidence * 100).toFixed(0)}%` : 'N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}; 