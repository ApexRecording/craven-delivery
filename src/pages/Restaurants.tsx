import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RestaurantGrid from '@/components/RestaurantGrid';
import AccountPopup from '@/components/AccountPopup';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  MapPin, 
  Filter, 
  Star, 
  Clock, 
  Zap, 
  TrendingUp, 
  ChevronLeft, 
  Plus,
  Bell,
  ShoppingCart,
  Home,
  Utensils,
  Coffee,
  Store,
  Heart,
  User,
  Settings,
  ChevronRight,
  Flame,
  Award,
  Truck,
  Shield,
  DollarSign,
  Timer,
  Navigation,
  Menu,
  X,
  Sparkles,
  Crown,
  Gift,
  Target,
  TrendingDown,
  Users,
  Globe,
  Smartphone,
  Wifi,
  CreditCard,
  ShieldCheck,
  TruckIcon,
  MapIcon,
  Phone,
  MessageCircle,
  Share2,
  Bookmark,
  Eye,
  ThumbsUp,
  RefreshCw,
  ChevronDown,
  SlidersHorizontal,
  SortAsc,
  Grid3X3,
  List,
  Layers,
  Compass,
  Zap as Lightning,
  Star as StarIcon,
  Clock as ClockIcon,
  DollarSign as DollarIcon,
  Truck as TruckIconAlt,
  Navigation as NavigationIcon,
  MapPin as MapPinIcon,
  Phone as PhoneIcon,
  MessageCircle as MessageIcon,
  Share2 as ShareIcon,
  Bookmark as BookmarkIcon,
  Eye as EyeIcon,
  ThumbsUp as ThumbsUpIcon,
  RefreshCw as RefreshIcon,
  ChevronDown as ChevronDownIcon,
  SlidersHorizontal as SlidersIcon,
  SortAsc as SortIcon,
  Grid3X3 as GridIcon,
  List as ListIcon,
  Layers as LayersIcon,
  Compass as CompassIcon
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import cravenLogo from "@/assets/craven-logo.png";

const Restaurants = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '6759 Nebraska Ave');
  const [cuisineFilter, setCuisineFilter] = useState(searchParams.get('cuisine') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'rating');
  const [weeklyDeals, setWeeklyDeals] = useState<any[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [activeFilter, setActiveFilter] = useState('deals');
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  
  // New state for enhanced functionality
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<any[]>([]);
  const [showAccountPopup, setShowAccountPopup] = useState(false);
  const [nationalFavorites, setNationalFavorites] = useState<any[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  // Derived filter values from activeFilter pill selection
  const getActiveFilterProps = () => {
    switch (activeFilter) {
      case 'deals':
        return { dealsOnly: true };
      case 'rating':
        return { minRating: 4.5 };
      case 'time':
        return { maxDeliveryTime: 30 };
      case 'price':
        return { sortBy: 'delivery_fee' };
      default:
        return {};
    }
  };
  const [accountPopupPosition, setAccountPopupPosition] = useState({ top: 0, left: 0 });
  
  const { toast } = useToast();
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const weeklyDealsScrollRef = useRef<HTMLDivElement>(null);
  const featuredScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (location) params.set('location', location);
    if (cuisineFilter && cuisineFilter !== 'all') params.set('cuisine', cuisineFilter);
    if (sortBy !== 'rating') params.set('sort', sortBy);
    setSearchParams(params);
  }, [searchQuery, location, cuisineFilter, sortBy, setSearchParams]);

  const handleSearch = () => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Address selector functionality
  const handleAddressSearch = async (query: string) => {
    if (query.length < 3) return;
    
    // Mock address suggestions - in real app, this would call a geocoding API
    const mockSuggestions = [
      `${query} Street, Toledo, OH`,
      `${query} Avenue, Toledo, OH`,
      `${query} Boulevard, Toledo, OH`,
      `${query} Drive, Toledo, OH`,
      `${query} Lane, Toledo, OH`
    ];
    setAddressSuggestions(mockSuggestions);
  };

  const selectAddress = (address: string) => {
    setLocation(address);
    setShowAddressSelector(false);
    toast({
      title: "Location Updated",
      description: `Delivery address set to ${address}`,
    });
  };

  // Notifications functionality
  const fetchNotifications = async () => {
    // Mock notifications - in real app, this would fetch from database
    const mockNotifications = [
      {
        id: 1,
        title: "Order Update",
        message: "Your order from CMIH Kitchen is being prepared",
        time: "2 min ago",
        read: false,
        type: "order"
      },
      {
        id: 2,
        title: "New Deal Available",
        message: "20% off your next order at McDonald's",
        time: "1 hour ago",
        read: false,
        type: "promotion"
      },
      {
        id: 3,
        title: "Delivery Complete",
        message: "Your order has been delivered successfully",
        time: "3 hours ago",
        read: true,
        type: "delivery"
      }
    ];
    setNotifications(mockNotifications);
  };

  // Cart functionality
  const addToCart = (item: any) => {
    setCartItems(prev => [...prev, item]);
    toast({
      title: "Added to Cart",
      description: `${item.name} has been added to your cart`,
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price || 0), 0);
  };

  // Filter functionality — updates activeFilter which drives getActiveFilterProps()
  const applyFilters = (filterId: string) => {
    setActiveFilter(filterId);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Scroll functions for horizontal sections
  const scrollWeeklyDealsLeft = () => {
    if (weeklyDealsScrollRef.current) {
      weeklyDealsScrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollWeeklyDealsRight = () => {
    if (weeklyDealsScrollRef.current) {
      weeklyDealsScrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const scrollFeaturedLeft = () => {
    if (featuredScrollRef.current) {
      featuredScrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollFeaturedRight = () => {
    if (featuredScrollRef.current) {
      featuredScrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  // Fetch promoted restaurants for weekly deals
  const fetchWeeklyDeals = async () => {
    try {
      setLoadingDeals(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          promotion_title,
          promotion_description,
          promotion_discount_percentage,
          promotion_discount_amount_cents,
          promotion_minimum_order_cents,
          promotion_maximum_discount_cents,
          promotion_valid_until,
          promotion_image_url
        `)
        .eq('is_promoted', true)
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(6);

      if (error) throw error;
      setWeeklyDeals(data || []);
    } catch (error) {
      console.error('Error fetching weekly deals:', error);
      setWeeklyDeals([]);
    } finally {
      setLoadingDeals(false);
    }
  };

  // Fetch top-rated active restaurants for "National favorites" section
  const fetchNationalFavorites = async () => {
    try {
      setLoadingFavorites(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, image_url, rating, total_reviews, min_delivery_time, max_delivery_time, delivery_fee_cents, latitude, longitude, delivery_radius_miles')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(8);
      if (error) throw error;
      setNationalFavorites(data || []);
    } catch (error) {
      console.error('Error fetching national favorites:', error);
      setNationalFavorites([]);
    } finally {
      setLoadingFavorites(false);
    }
  };

  // Fetch deals on component mount
  useEffect(() => {
    fetchWeeklyDeals();
    fetchNotifications();
    fetchNationalFavorites();
  }, []);

  // Update filter options based on delivery mode
  useEffect(() => {
    const updatedFilters = filterOptions.map(filter => ({
      ...filter,
      active: filter.id === activeFilter
    }));
    // This would update the filter options in real implementation
  }, [activeFilter, deliveryMode]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setShowAddressSelector(false);
        setShowNotifications(false);
        setShowCart(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navigation categories
  const navCategories = [
    { id: 'all', label: 'All', icon: Home, active: activeCategory === 'all' },
    { id: 'grocery', label: 'Grocery', icon: Store, active: activeCategory === 'grocery' },
    { id: 'convenience', label: 'Convenience', icon: Coffee, active: activeCategory === 'convenience' },
    { id: 'dashmart', label: "Craven'Z", icon: Store, active: activeCategory === 'dashmart' },
    { id: 'beauty', label: 'Beauty', icon: Heart, active: activeCategory === 'beauty' },
    { id: 'pets', label: 'Pets', icon: Heart, active: activeCategory === 'pets' },
    { id: 'health', label: 'Health', icon: Shield, active: activeCategory === 'health' },
    { id: 'browse', label: 'Browse All', icon: Search, active: activeCategory === 'browse' },
    { id: 'orders', label: 'Orders', icon: Clock, active: activeCategory === 'orders' },
    { id: 'account', label: 'Account', icon: User, active: activeCategory === 'account' }
  ];

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    
    // Handle different category types
    if (categoryId === 'all' || categoryId === 'browse') {
      setCuisineFilter('all');
    } else if (['grocery', 'convenience', 'dashmart', 'beauty', 'pets', 'health'].includes(categoryId)) {
      setCuisineFilter(categoryId);
    } else if (categoryId === 'orders') {
      // Navigate to orders page
      window.location.href = '/customer-dashboard?tab=orders';
      return;
    } else if (categoryId === 'account') {
      // Navigate to customer dashboard account tab
      window.location.href = '/customer-dashboard?tab=account';
      return;
    }
    
    // Scroll to results section for restaurant categories
    if (['all', 'browse', 'grocery', 'convenience', 'dashmart', 'beauty', 'pets', 'health'].includes(categoryId)) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Filter options
  const filterOptions = [
    { id: 'deals', label: 'Deals', active: true },
    { id: 'pickup', label: 'Pickup' },
    { id: 'rating', label: 'Over 4.5★' },
    { id: 'time', label: 'Under 30 min' },
    { id: 'price', label: 'Price' },
    { id: 'dashpass', label: 'CravePass' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header - DoorDash Style */}
      <div className="lg:hidden sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <img src={cravenLogo} alt="CRAVE'N" className="h-8" />
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
                )}
              </button>
            </div>
            <button 
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="p-2 -mr-2 active:bg-gray-100 rounded-full transition-colors"
            >
              {showMobileNav ? <X className="w-6 h-6 text-gray-900" /> : <Menu className="w-6 h-6 text-gray-900" />}
            </button>
          </div>
          
          {/* Location & Delivery Mode */}
          <div className="flex items-center space-x-2 mb-3">
            <button 
              onClick={() => setShowAddressSelector(!showAddressSelector)}
              className="flex-1 flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2 min-w-0"
            >
              <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-900 truncate flex-1">{location}</span>
              <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
            </button>
            
            <div className="flex bg-gray-100 rounded-lg p-0.5 flex-shrink-0">
              <button 
                onClick={() => setDeliveryMode('delivery')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  deliveryMode === 'delivery' 
                    ? 'bg-black text-white' 
                    : 'text-gray-600'
                }`}
              >
                Delivery
              </button>
              <button 
                onClick={() => setDeliveryMode('pickup')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  deliveryMode === 'pickup' 
                    ? 'bg-black text-white' 
                    : 'text-gray-600'
                }`}
              >
                Pickup
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search restaurants or dishes"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Desktop Header - Hidden on Mobile */}
      <div className="hidden lg:block sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo */}
            <div className="flex items-center space-x-4">
              <img src={cravenLogo} alt="CRAVE'N" className="h-10" />
            </div>

            {/* Center: Search */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input 
                  placeholder="Search Crave'N" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Right: Location, Delivery/Pickup, Notifications, Cart */}
            <div className="flex items-center space-x-4">
              {/* Location Selector */}
              <div className="relative">
                <button 
                  onClick={() => setShowAddressSelector(!showAddressSelector)}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium max-w-32 truncate">{location}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                
                {/* Address Selector Dropdown */}
                {showAddressSelector && (
                  <div data-dropdown className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Select delivery address</h3>
                      <div className="space-y-2">
                        <Input
                          placeholder="Search for an address"
                          onChange={(e) => handleAddressSearch(e.target.value)}
                          className="w-full"
                        />
                        {addressSuggestions.length > 0 && (
                          <div className="space-y-1">
                            {addressSuggestions.map((address, index) => (
                              <button
                                key={index}
                                onClick={() => selectAddress(address)}
                                className="w-full text-left p-2 hover:bg-gray-100 rounded-md text-sm"
                              >
                                {address}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="pt-2 border-t">
                          <button className="text-orange-600 text-sm font-medium">
                            Add new address
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery/Pickup Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button 
                  onClick={() => setDeliveryMode('delivery')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    deliveryMode === 'delivery' 
                      ? 'bg-orange-500 text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Delivery
                </button>
                <button 
                  onClick={() => setDeliveryMode('pickup')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    deliveryMode === 'pickup' 
                      ? 'bg-orange-500 text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Pickup
                </button>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <Bell className="w-6 h-6 text-gray-600 hover:text-gray-900 transition-colors" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div data-dropdown className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        <button className="text-sm text-orange-600">Mark all as read</button>
                      </div>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {notifications.map((notification) => (
                          <div 
                            key={notification.id}
                            className={`p-3 rounded-lg border ${
                              notification.read ? 'bg-gray-50' : 'bg-orange-50 border-orange-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm text-gray-900">{notification.title}</h4>
                                <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart */}
              <div className="relative">
                <button 
                  onClick={() => setShowCart(!showCart)}
                  className="relative"
                >
                  <ShoppingCart className="w-6 h-6 text-gray-600 hover:text-gray-900 transition-colors" />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                      {cartItems.length}
                    </span>
                  )}
                </button>
                
                {/* Cart Dropdown */}
                {showCart && (
                  <div data-dropdown className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Your Cart</h3>
                        <button className="text-sm text-orange-600">Clear all</button>
                      </div>
                      {cartItems.length > 0 ? (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {cartItems.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm text-gray-900">{item.name}</h4>
                                <p className="text-xs text-gray-600">${item.price?.toFixed(2) || '0.00'}</p>
                              </div>
                              <button 
                                onClick={() => removeFromCart(item.id)}
                                className="text-primary hover:text-primary"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <div className="pt-3 border-t">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-semibold">Total: ${getCartTotal().toFixed(2)}</span>
                            </div>
                            <Button className="w-full bg-orange-500 hover:bg-orange-600">
                              Checkout
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">Your cart is empty</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu */}
              <button 
                onClick={() => setShowMobileNav(!showMobileNav)}
                className="lg:hidden p-2"
              >
                {showMobileNav ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Pills */}
      <div className="lg:hidden sticky top-[140px] z-40 bg-white border-b border-gray-200 overflow-x-auto scrollbar-hide">
        <div className="flex space-x-2 px-4 py-3">
          {filterOptions.map((filter) => (
            <button
              key={filter.id}
              onClick={() => applyFilters(filter.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeFilter === filter.id
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex">
        {/* Right Side Navigation - Desktop Only */}
        <div className="hidden lg:block w-64 bg-gray-50 border-r border-gray-200 min-h-screen side-menu-container">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Browse</h3>
            <nav className="space-y-1">
              {navCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  <category.icon className="w-5 h-5" />
                  <span className="font-medium">{category.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Filter Bar - Desktop Only */}
          <div className="hidden lg:block border-b border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center space-x-4 overflow-x-auto">
                {filterOptions.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => applyFilters(filter.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                      activeFilter === filter.id
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* National Favorites Section */}
          <div className="bg-white py-8">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">National favorites</h2>
                <div className="hidden lg:flex items-center space-x-2">
                  <span className="text-sm text-gray-600">See All</span>
                  <div className="flex space-x-1">
                    <button 
                      onClick={scrollFeaturedLeft}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={scrollFeaturedRight}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <button className="lg:hidden text-sm text-primary font-semibold">
                  See All
                </button>
              </div>

              {/* Featured Restaurant Cards - loaded from database */}
              {loadingFavorites ? (
                <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="flex-shrink-0 w-56 sm:w-64 bg-gray-200 rounded-xl animate-pulse">
                      <div className="h-48 bg-gray-300 rounded-t-xl"></div>
                      <div className="p-3">
                        <div className="h-3 bg-gray-300 rounded mb-1"></div>
                        <div className="h-2 bg-gray-300 rounded mb-1"></div>
                        <div className="h-2 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : nationalFavorites.length > 0 ? (
                <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4" ref={featuredScrollRef}>
                  {nationalFavorites.map((restaurant) => (
                    <div
                      key={restaurant.id}
                      className="flex-shrink-0 w-56 sm:w-64 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => window.location.href = `/restaurant/${restaurant.id}`}
                    >
                      <div className="h-48 overflow-hidden rounded-t-xl">
                        <img
                          src={restaurant.image_url || `https://placehold.co/320x192/FF6B35/ffffff?text=${encodeURIComponent(restaurant.name)}`}
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `https://placehold.co/320x192/FF6B35/ffffff?text=${encodeURIComponent(restaurant.name)}`;
                          }}
                        />
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">{restaurant.name}</h3>
                          <ChevronRight className="w-4 h-4 text-green-500 flex-shrink-0" />
                        </div>
                        <div className="flex items-center text-xs text-gray-600 mb-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-1" />
                          <span>
                            {(restaurant.rating || 0).toFixed(1)} ★
                            {restaurant.total_reviews > 0 && ` (${restaurant.total_reviews > 999 ? Math.round(restaurant.total_reviews / 1000) + 'k+' : restaurant.total_reviews + '+'}) `}
                            {restaurant.min_delivery_time && ` • ${restaurant.min_delivery_time}-${restaurant.max_delivery_time} min`}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-gray-900">
                            {restaurant.delivery_fee_cents === 0 ? 'Free delivery' : `$${(restaurant.delivery_fee_cents / 100).toFixed(2)} delivery`}
                          </p>
                          {(restaurant.rating || 0) >= 4.5 && (
                            <div className="flex items-center text-orange-600 font-semibold text-xs">
                              <Plus className="w-3 h-3 mr-1" />
                              <span>Customer favorite</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No restaurants available right now.</p>
                </div>
              )}
            </div>
          </div>

          {/* Deals for You Section */}
          <div className="bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Deals for you</h2>
                <div className="hidden lg:flex items-center space-x-2">
                  <span className="text-sm text-gray-600">See All</span>
                  <div className="flex space-x-1">
                    <button 
                      onClick={scrollWeeklyDealsLeft}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={scrollWeeklyDealsRight}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <button className="lg:hidden text-sm text-primary font-semibold">
                  See All
                </button>
              </div>

              {/* Weekly Deals Cards */}
              {loadingDeals ? (
                <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="flex-shrink-0 w-64 bg-gray-200 rounded-xl animate-pulse">
                      <div className="h-48 bg-gray-300"></div>
                      <div className="p-3">
                        <div className="h-3 bg-gray-300 rounded mb-1"></div>
                        <div className="h-2 bg-gray-300 rounded mb-1"></div>
                        <div className="h-2 bg-gray-300 rounded mb-1"></div>
                        <div className="h-2 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : weeklyDeals.length > 0 ? (
                <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4" ref={weeklyDealsScrollRef}>
                  {weeklyDeals.map((restaurant) => {
                    const formatPromotionTitle = () => {
                      if (restaurant.promotion_title) return restaurant.promotion_title;
                      
                      if (restaurant.promotion_discount_percentage) {
                        const maxDiscount = restaurant.promotion_maximum_discount_cents 
                          ? `, up to $${(restaurant.promotion_maximum_discount_cents / 100).toFixed(0)}`
                          : '';
                        return `${restaurant.promotion_discount_percentage}% off${maxDiscount}`;
                      }
                      
                      if (restaurant.promotion_discount_amount_cents) {
                        return `$${(restaurant.promotion_discount_amount_cents / 100).toFixed(2)} off`;
                      }
                      
                      return '+ Featured Deal';
                    };

                    const formatPromotionDescription = () => {
                      if (restaurant.promotion_description) return restaurant.promotion_description;
                      
                      if (restaurant.promotion_minimum_order_cents) {
                        return `Valid on orders over $${(restaurant.promotion_minimum_order_cents / 100).toFixed(0)}`;
                      }
                      
                      return 'Special promotion available';
                    };

                    return (
                      <div key={restaurant.id} className="flex-shrink-0 w-64 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="h-48 overflow-hidden rounded-t-xl">
                          <img
                            src={restaurant.promotion_image_url || restaurant.image_url || `https://placehold.co/320x192/FF6B35/ffffff?text=${encodeURIComponent(restaurant.name)}`}
                            alt={restaurant.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = `https://placehold.co/320x192/FF6B35/ffffff?text=${encodeURIComponent(restaurant.name)}`;
                            }}
                          />
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold text-gray-900 mb-1 text-sm">{restaurant.name}</h3>
                          <div className="flex items-center text-xs text-gray-600 mb-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-1" />
                            <span>{restaurant.rating.toFixed(1)} ★ • {restaurant.min_delivery_time}-{restaurant.max_delivery_time} min</span>
                          </div>
                          <p className="text-xs font-semibold text-gray-900 mb-1">
                            ${(restaurant.delivery_fee_cents / 100).toFixed(2)} delivery fee
                          </p>
                          <p className="text-xs text-gray-500 mb-1">Sponsored</p>
                          <div className="flex items-center text-orange-600 font-semibold text-xs">
                            <Plus className="w-3 h-3 mr-1" />
                            <span>{formatPromotionTitle()}</span>
                          </div>
                          {restaurant.promotion_description && (
                            <p className="text-xs text-gray-600 mt-0.5">{formatPromotionDescription()}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No weekly deals available at the moment.</p>
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white py-8" ref={resultsRef}>
            <div className="max-w-7xl mx-auto px-4">
              {/* Results Header */}
              {(searchQuery || location || cuisineFilter !== 'all') && (
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {searchQuery ? `Results for "${searchQuery}"` : 'Restaurants Near You'}
                  </h2>
                  {location && (
                    <p className="text-gray-600 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Delivering to: {location}
                    </p>
                  )}
                </div>
              )}

              {/* Restaurant Grid */}
              <RestaurantGrid 
                searchQuery={searchQuery} 
                deliveryAddress={location} 
                cuisineFilter={cuisineFilter}
                sortBy={sortBy}
                {...getActiveFilterProps()}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      {showMobileNav && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="fixed right-0 top-0 h-full w-64 bg-white shadow-xl">
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Browse</h3>
                <button 
                  onClick={() => setShowMobileNav(false)}
                  className="p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-1">
                {navCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      handleCategoryClick(category.id);
                      setShowMobileNav(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <category.icon className="w-5 h-5" />
                    <span className="font-medium">{category.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      <Footer />

      {/* Account Popup */}
      <AccountPopup 
        isOpen={showAccountPopup}
        onClose={() => setShowAccountPopup(false)}
        position={accountPopupPosition}
      />

      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Restaurants;