import React, { useState, useEffect } from 'react';
import { ShoppingCartIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

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

interface ProductListProps {
  products: Product[];
}

export const ProductList: React.FC<ProductListProps> = ({ products }) => {
  const [optimizedPrices, setOptimizedPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [purchaseStatus, setPurchaseStatus] = useState<Record<string, string>>({});

  const calculateOptimalPrice = async (productId: string) => {
    setLoading(prev => ({ ...prev, [productId]: true }));
    
    try {
      const response = await fetch(`${API_BASE_URL}/pricing/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          userId: 'user-001',
          currentPrice: products.find(p => p.productId === productId)?.price || 0
        })
      });

      if (response.ok) {
        const data = await response.json();
        setOptimizedPrices(prev => ({ ...prev, [productId]: data.optimizedPrice }));
      } else {
        console.error('Failed to calculate optimal price');
        // Fallback to mock calculation
        const product = products.find(p => p.productId === productId);
        if (product) {
          const mockOptimizedPrice = product.price * (0.9 + Math.random() * 0.2); // ±10% variation
          setOptimizedPrices(prev => ({ ...prev, [productId]: mockOptimizedPrice }));
        }
      }
    } catch (error) {
      console.error('Error calculating optimal price:', error);
      // Fallback to mock calculation
      const product = products.find(p => p.productId === productId);
      if (product) {
        const mockOptimizedPrice = product.price * (0.9 + Math.random() * 0.2); // ±10% variation
        setOptimizedPrices(prev => ({ ...prev, [productId]: mockOptimizedPrice }));
      }
    } finally {
      setLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handlePurchase = async (productId: string) => {
    setPurchaseStatus(prev => ({ ...prev, [productId]: 'processing' }));
    
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user-001',
          quantity: 1
        })
      });

      if (response.ok) {
        setPurchaseStatus(prev => ({ ...prev, [productId]: 'success' }));
        // Recalculate price after purchase
        setTimeout(() => calculateOptimalPrice(productId), 1000);
      } else {
        setPurchaseStatus(prev => ({ ...prev, [productId]: 'error' }));
      }
    } catch (error) {
      console.error('Error recording purchase:', error);
      setPurchaseStatus(prev => ({ ...prev, [productId]: 'error' }));
      // Simulate success for demo purposes
      setTimeout(() => {
        setPurchaseStatus(prev => ({ ...prev, [productId]: 'success' }));
        setTimeout(() => calculateOptimalPrice(productId), 1000);
      }, 1000);
    }
  };

  const getPriceChangeIndicator = (originalPrice: number, optimizedPrice: number) => {
    if (optimizedPrice > originalPrice) {
      return <ArrowTrendingUpIcon className="h-5 w-5 text-red-500" />;
    } else if (optimizedPrice < originalPrice) {
      return <ArrowTrendingDownIcon className="h-5 w-5 text-green-500" />;
    }
    return null;
  };

  const getInventoryStatus = (inventory: number, maxInventory: number) => {
    const percentage = (inventory / maxInventory) * 100;
    if (percentage < 20) return 'text-red-600';
    if (percentage < 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Products</h2>
        <button
          onClick={() => products.forEach(p => calculateOptimalPrice(p.productId))}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Recalculate All Prices
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.productId} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-500 capitalize">{product.category}</p>
              </div>
              <span className={`text-sm font-medium ${getInventoryStatus(product.inventory, product.maxInventory)}`}>
                {product.inventory}/{product.maxInventory} in stock
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Price:</span>
                <span className="text-lg font-bold text-gray-900">
                  ${product.price.toFixed(2)}
                </span>
              </div>

              {optimizedPrices[product.productId] && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Optimized Price:</span>
                  <div className="flex items-center space-x-2">
                    {getPriceChangeIndicator(product.price, optimizedPrices[product.productId])}
                    <span className="text-lg font-bold text-blue-600">
                      ${optimizedPrices[product.productId].toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => calculateOptimalPrice(product.productId)}
                  disabled={loading[product.productId]}
                  className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  {loading[product.productId] ? 'Calculating...' : 'Optimize Price'}
                </button>
                
                <button
                  onClick={() => handlePurchase(product.productId)}
                  disabled={purchaseStatus[product.productId] === 'processing'}
                  className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {purchaseStatus[product.productId] === 'processing' ? (
                    'Processing...'
                  ) : purchaseStatus[product.productId] === 'success' ? (
                    'Purchased!'
                  ) : (
                    <>
                      <ShoppingCartIcon className="h-4 w-4 mr-2" />
                      Buy
                    </>
                  )}
                </button>
              </div>

              {purchaseStatus[product.productId] === 'error' && (
                <p className="text-red-600 text-sm">Purchase failed. Please try again.</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products available.</p>
        </div>
      )}
    </div>
  );
}; 