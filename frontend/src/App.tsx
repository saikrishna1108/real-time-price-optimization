import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ProductList } from './components/ProductList';
import { PricingDashboard } from './components/PricingDashboard';
import { PriceHistory } from './components/PriceHistory';
import { Analytics } from './components/Analytics';

// API base URL - use deployed API Gateway URL
const API_BASE_URL = 'https://sio2ou49h8.execute-api.us-east-1.amazonaws.com/prod';

interface Product {
  productId: string;
  name: string;
  price: number;
  inventory: number;
  maxInventory: number;
  category: string;
}

function App() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback to mock data if API fails
      setProducts([
        {
          productId: 'prod-001',
          name: 'Premium Flight Ticket',
          price: 299.99,
          inventory: 45,
          maxInventory: 100,
          category: 'Travel'
        },
        {
          productId: 'prod-002',
          name: 'Hotel Room',
          price: 150.00,
          inventory: 20,
          maxInventory: 50,
          category: 'Accommodation'
        },
        {
          productId: 'prod-003',
          name: 'Car Rental',
          price: 75.50,
          inventory: 30,
          maxInventory: 75,
          category: 'Transportation'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  Real-Time Price Optimization
                </h1>
              </div>
              <nav className="flex space-x-8">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'products'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('products')}
                >
                  Products
                </Link>
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'dashboard'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  Dashboard
                </Link>
                <Link
                  to="/analytics"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'analytics'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('analytics')}
                >
                  Analytics
                </Link>
                <Link
                  to="/history"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === 'history'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('history')}
                >
                  Price History
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<ProductList products={products} />} />
            <Route path="/dashboard" element={<PricingDashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/history" element={<PriceHistory />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 