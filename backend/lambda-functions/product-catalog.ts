import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

// Mock product catalog for demonstration
const mockProductCatalog = [
  {
    productId: 'prod-001',
    name: 'Premium Flight Ticket - NYC to LAX',
    description: 'Non-stop premium flight from New York City to Los Angeles',
    category: 'travel',
    subcategory: 'flights',
    basePrice: 299.99,
    currentPrice: 299.99,
    currency: 'USD',
    availability: {
      inventory: 50,
      maxInventory: 100,
      status: 'available'
    },
    pricing: {
      floor: 199.99,
      ceiling: 499.99,
      demandLevel: 'medium'
    },
    metadata: {
      duration: '6h 30m',
      airline: 'Premium Airways',
      aircraft: 'Boeing 737',
      departure: '08:00',
      arrival: '11:30'
    },
    tags: ['premium', 'non-stop', 'business-friendly'],
    lastUpdated: new Date().toISOString()
  },
  {
    productId: 'prod-002',
    name: 'Luxury Hotel Room - Manhattan',
    description: '5-star hotel room in the heart of Manhattan with city view',
    category: 'accommodation',
    subcategory: 'hotels',
    basePrice: 250.00,
    currentPrice: 250.00,
    currency: 'USD',
    availability: {
      inventory: 25,
      maxInventory: 50,
      status: 'limited'
    },
    pricing: {
      floor: 150.00,
      ceiling: 400.00,
      demandLevel: 'high'
    },
    metadata: {
      rating: 5,
      amenities: ['WiFi', 'Room Service', 'Gym', 'Pool', 'Spa'],
      roomType: 'Deluxe King',
      view: 'City View',
      size: '450 sq ft'
    },
    tags: ['luxury', 'city-view', 'business-center'],
    lastUpdated: new Date().toISOString()
  },
  {
    productId: 'prod-003',
    name: 'Premium Car Rental - Tesla Model S',
    description: 'Electric luxury sedan rental for premium transportation',
    category: 'transportation',
    subcategory: 'car-rental',
    basePrice: 120.00,
    currentPrice: 120.00,
    currency: 'USD',
    availability: {
      inventory: 15,
      maxInventory: 30,
      status: 'available'
    },
    pricing: {
      floor: 80.00,
      ceiling: 200.00,
      demandLevel: 'low'
    },
    metadata: {
      make: 'Tesla',
      model: 'Model S',
      year: 2023,
      transmission: 'Automatic',
      fuelType: 'Electric',
      seats: 5,
      features: ['Autopilot', 'Premium Audio', 'Navigation', 'Supercharging']
    },
    tags: ['electric', 'luxury', 'eco-friendly', 'premium'],
    lastUpdated: new Date().toISOString()
  },
  {
    productId: 'prod-004',
    name: 'Concert Tickets - Madison Square Garden',
    description: 'Premium seats for upcoming concert at Madison Square Garden',
    category: 'entertainment',
    subcategory: 'concerts',
    basePrice: 150.00,
    currentPrice: 150.00,
    currency: 'USD',
    availability: {
      inventory: 100,
      maxInventory: 200,
      status: 'available'
    },
    pricing: {
      floor: 75.00,
      ceiling: 300.00,
      demandLevel: 'high'
    },
    metadata: {
      venue: 'Madison Square Garden',
      artist: 'Popular Artist',
      date: '2024-03-15',
      time: '20:00',
      section: 'Floor',
      row: 'A-J'
    },
    tags: ['premium-seats', 'popular-artist', 'limited-time'],
    lastUpdated: new Date().toISOString()
  }
];

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Product Catalog Event:', JSON.stringify(event, null, 2));
  
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: ''
      };
    }

    const queryParams = event.queryStringParameters || {};
    const pathParams = event.pathParameters || {};
    
    // Handle different endpoints
    if (pathParams.productId) {
      // Get specific product
      return await getProduct(pathParams.productId, corsHeaders, context);
    } else {
      // Get product catalog with optional filters
      return await getProductCatalog(queryParams, corsHeaders, context);
    }

  } catch (error) {
    console.error('Error in product catalog:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        requestId: context.awsRequestId
      })
    };
  }
};

async function getProduct(productId: string, corsHeaders: any, context: Context): Promise<APIGatewayProxyResult> {
  const product = mockProductCatalog.find(p => p.productId === productId);
  
  if (!product) {
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Product not found',
        productId,
        availableProducts: mockProductCatalog.map(p => ({ id: p.productId, name: p.name }))
      })
    };
  }

  // Simulate some dynamic pricing updates
  const updatedProduct = {
    ...product,
    currentPrice: product.basePrice * (0.9 + Math.random() * 0.3), // ±20% variation
    availability: {
      ...product.availability,
      inventory: Math.max(0, product.availability.inventory - Math.floor(Math.random() * 5))
    },
    lastUpdated: new Date().toISOString()
  };

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      requestId: context.awsRequestId,
      data: updatedProduct
    })
  };
}

async function getProductCatalog(queryParams: any, corsHeaders: any, context: Context): Promise<APIGatewayProxyResult> {
  let filteredProducts = [...mockProductCatalog];

  // Apply filters
  if (queryParams.category) {
    filteredProducts = filteredProducts.filter(p => 
      p.category.toLowerCase() === queryParams.category.toLowerCase()
    );
  }

  if (queryParams.subcategory) {
    filteredProducts = filteredProducts.filter(p => 
      p.subcategory.toLowerCase() === queryParams.subcategory.toLowerCase()
    );
  }

  if (queryParams.minPrice) {
    const minPrice = parseFloat(queryParams.minPrice);
    filteredProducts = filteredProducts.filter(p => p.currentPrice >= minPrice);
  }

  if (queryParams.maxPrice) {
    const maxPrice = parseFloat(queryParams.maxPrice);
    filteredProducts = filteredProducts.filter(p => p.currentPrice <= maxPrice);
  }

  if (queryParams.availability) {
    filteredProducts = filteredProducts.filter(p => 
      p.availability.status === queryParams.availability
    );
  }

  // Apply sorting
  if (queryParams.sortBy) {
    const sortField = queryParams.sortBy;
    const sortOrder = queryParams.sortOrder === 'desc' ? -1 : 1;
    
    filteredProducts.sort((a: any, b: any) => {
      let aVal = a[sortField] || a.currentPrice;
      let bVal = b[sortField] || b.currentPrice;
      
      if (typeof aVal === 'string') {
        return aVal.localeCompare(bVal) * sortOrder;
      }
      return (aVal - bVal) * sortOrder;
    });
  }

  // Apply pagination
  const page = parseInt(queryParams.page || '1');
  const limit = parseInt(queryParams.limit || '10');
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Simulate dynamic pricing for all products
  const updatedProducts = paginatedProducts.map(product => ({
    ...product,
    currentPrice: Math.round((product.basePrice * (0.9 + Math.random() * 0.3)) * 100) / 100,
    availability: {
      ...product.availability,
      inventory: Math.max(0, product.availability.inventory - Math.floor(Math.random() * 3))
    },
    lastUpdated: new Date().toISOString()
  }));

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      requestId: context.awsRequestId,
      data: {
        products: updatedProducts,
        pagination: {
          page,
          limit,
          total: filteredProducts.length,
          totalPages: Math.ceil(filteredProducts.length / limit),
          hasNext: endIndex < filteredProducts.length,
          hasPrev: page > 1
        },
        filters: {
          applied: Object.keys(queryParams).filter(key => 
            ['category', 'subcategory', 'minPrice', 'maxPrice', 'availability'].includes(key)
          ),
          available: {
            categories: [...new Set(mockProductCatalog.map(p => p.category))],
            subcategories: [...new Set(mockProductCatalog.map(p => p.subcategory))],
            priceRange: {
              min: Math.min(...mockProductCatalog.map(p => p.basePrice)),
              max: Math.max(...mockProductCatalog.map(p => p.basePrice))
            }
          }
        }
      }
    })
  };
} 