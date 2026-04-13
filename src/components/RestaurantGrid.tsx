import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import RestaurantCard from "./RestaurantCard";
interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine_type: string;
  delivery_fee_cents: number;
  min_delivery_time: number;
  max_delivery_time: number;
  is_promoted: boolean;
  rating: number;
  image_url: string;
  delivery_radius_miles?: number;
  latitude?: number;
  longitude?: number;
}
interface RestaurantGridProps {
  searchQuery?: string;
  deliveryAddress?: string;
  cuisineFilter?: string;
  sortBy?: string;
  minRating?: number;
  maxDeliveryTime?: number;
  dealsOnly?: boolean;
}
const RestaurantGrid = ({
  searchQuery,
  deliveryAddress,
  cuisineFilter,
  sortBy = 'rating',
  minRating,
  maxDeliveryTime,
  dealsOnly
}: RestaurantGridProps = {}) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Get user's current location for delivery radius filtering
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied or unavailable:', error);
        }
      );
    }
  }, []);
  // Helper function to calculate distance between two points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  useEffect(() => {
    fetchRestaurants();
  }, [searchQuery, deliveryAddress, cuisineFilter, sortBy, minRating, maxDeliveryTime, dealsOnly, userLocation]);
  const fetchRestaurants = async () => {
    try {
      let query = (supabase as any)
        .from("restaurants")
        .select(`
          *,
          delivery_radius_miles,
          latitude,
          longitude
        `)
        .eq("is_active", true);

      // Filter by cuisine if provided and not 'all'
      if (cuisineFilter && cuisineFilter !== 'all') {
        query = query.eq('cuisine_type', cuisineFilter);
      }

      // Filter deals-only
      if (dealsOnly) {
        query = query.eq('is_promoted', true);
      }

      // Apply sort order
      if (sortBy === 'rating') {
        query = query.order("is_promoted", { ascending: false }).order("rating", { ascending: false });
      } else if (sortBy === 'delivery_time') {
        query = query.order("min_delivery_time", { ascending: true });
      } else if (sortBy === 'delivery_fee') {
        query = query.order("delivery_fee_cents", { ascending: true });
      } else {
        query = query.order("is_promoted", { ascending: false }).order("rating", { ascending: false });
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      let filteredData = (data || []).map((restaurant: any) => ({
        ...restaurant,
        min_delivery_time: restaurant.min_delivery_time || 20,
        max_delivery_time: restaurant.max_delivery_time || 30,
        is_promoted: restaurant.is_promoted || false
      }));

      // Filter by search query if provided
      if (searchQuery) {
        filteredData = filteredData.filter((restaurant: Restaurant) =>
          restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (restaurant.cuisine_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (restaurant.description || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Filter by minimum rating
      if (minRating) {
        filteredData = filteredData.filter((restaurant: Restaurant) =>
          (restaurant.rating || 0) >= minRating
        );
      }

      // Filter by max delivery time
      if (maxDeliveryTime) {
        filteredData = filteredData.filter((restaurant: Restaurant) =>
          (restaurant.min_delivery_time || 999) <= maxDeliveryTime
        );
      }

      // Filter by delivery radius if user location is available
      if (userLocation && filteredData.length > 0) {
        filteredData = filteredData.filter((restaurant: Restaurant) => {
          if (!restaurant.latitude || !restaurant.longitude || !restaurant.delivery_radius_miles) {
            return true; // Include restaurants without location data
          }

          // Calculate distance using Haversine formula
          const distance = calculateDistance(
            userLocation.lat, 
            userLocation.lng, 
            restaurant.latitude, 
            restaurant.longitude
          );
          
          return distance <= restaurant.delivery_radius_miles;
        });
      }

      setRestaurants(filteredData);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <section className="py-6 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {searchQuery || deliveryAddress ? "Searching..." : "Popular Restaurants Near You"}
            </h2>
            <p className="text-muted-foreground text-lg">
              Loading restaurants...
            </p>
          </div>
        </div>
      </section>;
  }
  const formatRestaurantData = (restaurant: Restaurant) => ({
    id: restaurant.id,
    name: restaurant.name,
    image: restaurant.image_url || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop",
    rating: restaurant.rating,
    deliveryTime: `${restaurant.min_delivery_time}-${restaurant.max_delivery_time} min`,
    deliveryFee: restaurant.delivery_fee_cents === 0 ? "Free" : `$${(restaurant.delivery_fee_cents / 100).toFixed(2)}`,
    cuisine: restaurant.cuisine_type,
    isPromoted: restaurant.is_promoted
  });
  return <section className="py-6 bg-muted/30">
      <div className="container mx-auto px-4">
        {!searchQuery && !deliveryAddress && <div className="text-center mb-8">
            
            
          </div>}

        {restaurants.length === 0 ? <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {searchQuery ? `No restaurants found for "${searchQuery}"${deliveryAddress ? ` near ${deliveryAddress}` : ''}` : deliveryAddress ? `No restaurants found within ${deliveryAddress}` : "No restaurants available right now. Be the first to register your restaurant!"}
            </p>
          </div> : <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {restaurants.map((restaurant, index) => <div key={restaurant.id} className="animate-slide-up" style={{
          animationDelay: `${index * 100}ms`
        }}>
                <RestaurantCard {...formatRestaurantData(restaurant)} />
              </div>)}
          </div>}
      </div>
    </section>;
};
export default RestaurantGrid;