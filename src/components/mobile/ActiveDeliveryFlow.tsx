// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Navigation, Clock, Phone, MessageCircle, Camera, CheckCircle, ChevronLeft, AlertCircle, Package, Home, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast as showToast } from 'sonner';
import { useNavigation } from '@/hooks/useNavigation';
import { useToast } from '@/hooks/use-toast';
import { DeliveryMap } from './DeliveryMap';

// ===== MODERN UI COMPONENTS =====

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = 'p-6' }) => (
  <div className={className}>{children}</div>
);

// Professional Button Component
const Button = ({ children, onClick, className = '', variant = 'default', size = 'md', disabled = false, fullWidth = false }) => {
  const baseClasses = "flex items-center justify-center font-semibold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed";
  
  const variants = {
    primary: 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-500/30',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    outline: 'bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50',
    success: 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/30',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100'
  };
  
  const sizes = {
    sm: 'h-10 px-4 text-sm',
    md: 'h-12 px-6 text-base',
    lg: 'h-14 px-8 text-lg'
  };
  
  return (
    <button 
      onClick={onClick} 
      className={`${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// Modern Header Component
const AppHeader = ({ title, subtitle, onBack, rightAction }) => (
  <div className="bg-white border-b border-gray-100 sticky top-0 z-50 safe-area-top">
    <div className="px-4 py-4 flex items-center justify-between">
      <button 
        onClick={onBack} 
        className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <ChevronLeft className="h-6 w-6 text-gray-900" />
      </button>
      <div className="flex-1 text-center">
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="w-10">
        {rightAction}
      </div>
    </div>
  </div>
);

// Progress Bar Component
const DeliveryProgressBar = ({ currentStage, stages }) => {
  const currentIndex = stages.findIndex(s => s.id === currentStage);
  const progress = ((currentIndex + 1) / stages.length) * 100;
  
  return (
    <div className="px-4 py-3 bg-white border-b border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-900">
          Step {currentIndex + 1} of {stages.length}
        </span>
        <span className="text-xs text-gray-500">{Math.round(progress)}% Complete</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-orange-600 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status, icon: Icon }) => {
  const variants = {
    active: 'bg-orange-50 text-orange-700 border-orange-200',
    completed: 'bg-green-50 text-green-700 border-green-200',
    pending: 'bg-gray-50 text-gray-600 border-gray-200'
  };
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${variants[status] || variants.pending}`}>
      {Icon && <Icon className="h-4 w-4" />}
      <span className="text-sm font-medium capitalize">{status}</span>
    </div>
  );
};

// Info Card Component
const InfoCard = ({ icon: Icon, title, subtitle, action, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
    <div className="flex items-center gap-4">
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
          <Icon className="h-6 w-6 text-orange-600" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm mb-0.5">{title}</p>
        <p className="text-sm text-gray-500 truncate">{subtitle}</p>
      </div>
      {action}
    </div>
  </div>
);

// ===== TYPES =====

type DeliveryStage = 'navigate_to_restaurant' | 'arrived_at_restaurant' | 'verify_pickup' | 'pickup_photo_verification' | 'navigate_to_customer' | 'capture_proof' | 'delivered';

interface OrderItem {
  name: string;
  quantity: number;
  special_instructions?: string;
}

interface DeliveryProgress {
  currentStage: DeliveryStage;
  stageNumber: number;
  totalStages: number;
  stageName: string;
  isCompleted: boolean;
  pickupPhotoUrl?: string;
  deliveryPhotoUrl?: string;
}

interface ActiveDeliveryProps {
  orderDetails: any;
  onCompleteDelivery: () => void;
  onProgressChange?: (progress: DeliveryProgress) => void;
}

// Main Delivery Stages
const DELIVERY_STAGES = [
  { id: 'navigate_to_restaurant', label: 'Going to Pickup', shortLabel: 'Pickup' },
  { id: 'arrived_at_restaurant', label: 'Arrived at Restaurant', shortLabel: 'Arrived' },
  { id: 'verify_pickup', label: 'Confirm Pickup', shortLabel: 'Confirm' },
  { id: 'pickup_photo_verification', label: 'Photo Verification', shortLabel: 'Photo' },
  { id: 'navigate_to_customer', label: 'Delivering Order', shortLabel: 'Deliver' },
  { id: 'capture_proof', label: 'Proof of Delivery', shortLabel: 'Proof' },
  { id: 'delivered', label: 'Complete', shortLabel: 'Done' }
];

// Helper function to get stage info
const getStageInfo = (stage: DeliveryStage) => {
  const stageMap = {
    'navigate_to_restaurant': { stageNumber: 1, stageName: 'Navigate to Restaurant' },
    'arrived_at_restaurant': { stageNumber: 2, stageName: 'Arrived at Restaurant' },
    'verify_pickup': { stageNumber: 3, stageName: 'Verify Order' },
    'pickup_photo_verification': { stageNumber: 4, stageName: 'Pickup Photo' },
    'navigate_to_customer': { stageNumber: 5, stageName: 'Navigate to Customer' },
    'capture_proof': { stageNumber: 6, stageName: 'Delivery Photo' },
    'delivered': { stageNumber: 7, stageName: 'Delivered' }
  };
  
  return stageMap[stage] || { stageNumber: 1, stageName: 'Unknown' };
};

// ===== MAIN COMPONENT =====

const ActiveDeliveryFlow = ({ orderDetails, onCompleteDelivery, onProgressChange }: ActiveDeliveryProps) => {
  const [currentStage, setCurrentStage] = useState<DeliveryStage>('navigate_to_restaurant');
  const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(null);
  const [pickupPhoto, setPickupPhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [restaurantAddress, setRestaurantAddress] = useState<string>('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const { toast } = useToast();
  const { openExternalNavigation } = useNavigation();

  // Timer for elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update progress whenever stage changes
  useEffect(() => {
    if (onProgressChange) {
      const stageInfo = getStageInfo(currentStage);
      const progress: DeliveryProgress = {
        currentStage,
        stageNumber: stageInfo.stageNumber,
        totalStages: 7,
        stageName: stageInfo.stageName,
        isCompleted: currentStage === 'delivered',
        pickupPhotoUrl: pickupPhoto || undefined,
        deliveryPhotoUrl: deliveryPhoto || undefined
      };
      onProgressChange(progress);
    }
  }, [currentStage, pickupPhoto, deliveryPhoto, onProgressChange]);

  // Fetch restaurant address
  useEffect(() => {
    const fetchRestaurantAddress = async () => {
      try {
        if (orderDetails?.pickup_address) {
          const addr = orderDetails.pickup_address;
          if (typeof addr === 'string') {
            setRestaurantAddress(addr);
          } else if (addr.address) {
            setRestaurantAddress(addr.address);
          } else {
            const parts = [addr.street, addr.city, addr.state, addr.zip_code].filter(Boolean);
            setRestaurantAddress(parts.join(', '));
          }
        }
      } catch (error) {
        console.error('Error fetching restaurant address:', error);
      }
    };
    
    fetchRestaurantAddress();
  }, [orderDetails]);

  const formatElapsedTime = () => {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Photo upload handler
  const handlePhotoCapture = async (file: File, type: 'pickup' | 'delivery') => {
    setIsUploadingPhoto(true);
    try {
      const photoUrl = URL.createObjectURL(file);
      if (type === 'pickup') {
        setPickupPhoto(photoUrl);
        showToast.success('Pickup photo uploaded');
      } else {
        setDeliveryPhoto(photoUrl);
        showToast.success('Delivery photo uploaded');
      }
    } catch (error) {
      showToast.error('Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Navigate to Restaurant Screen
  const renderNavigateToRestaurant = () => (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <AppHeader 
        title="Pickup Order"
        subtitle={formatElapsedTime()}
        onBack={onCompleteDelivery}
        rightAction={null}
      />
      
      <DeliveryProgressBar currentStage={currentStage} stages={DELIVERY_STAGES} />
      
      <div className="p-4 space-y-4">
        {/* Live Map to Restaurant */}
        <DeliveryMap 
          pickupAddress={orderDetails?.pickup_address}
          showRoute={false}
          className="h-64"
        />

        {/* Restaurant Info */}
        <InfoCard
          icon={Package}
          title={orderDetails?.restaurant_name || 'Restaurant'}
          subtitle={restaurantAddress || 'Loading address...'}
          action={
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => openExternalNavigation(orderDetails?.pickup_address, 'pickup')}
            >
              <Navigation className="h-5 w-5" />
            </Button>
          }
        />

        {/* Delivery Details */}
        <Card>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Order ID</span>
                <span className="text-sm font-mono font-semibold text-gray-900">
                  #{orderDetails?.order_id?.slice(-6)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Distance</span>
                <span className="text-sm font-semibold text-gray-900">
                  {orderDetails?.distance_mi || '0'} mi
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estimated Time</span>
                <span className="text-sm font-semibold text-gray-900">
                  {orderDetails?.estimated_time || '0'} min
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Button 
            variant="primary" 
            size="lg" 
            fullWidth
            onClick={async () => {
              try {
                if (orderDetails?.assignment_id) {
                  await supabase
                    .from('order_assignments')
                    .update({ arrived_at_restaurant_at: new Date().toISOString() } as any)
                    .eq('id', orderDetails.assignment_id);
                }
              } catch (error) {
                console.error('Failed to record restaurant arrival timestamp', error);
              } finally {
                setCurrentStage('arrived_at_restaurant');
              }
            }}
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            I've Arrived
          </Button>
          
          <div className="flex gap-3">
            <Button variant="outline" size="md" fullWidth>
              <Phone className="h-5 w-5 mr-2" />
              Call
            </Button>
            <Button variant="outline" size="md" fullWidth>
              <MessageCircle className="h-5 w-5 mr-2" />
              Chat
            </Button>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">
                Having trouble finding the restaurant?
              </p>
              <p className="text-xs text-blue-700">
                Contact support or use the navigation button for directions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Arrived at Restaurant Screen
  const renderArrivedAtRestaurant = () => (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <AppHeader 
        title="At Restaurant"
        subtitle={formatElapsedTime()}
        onBack={() => setCurrentStage('navigate_to_restaurant')}
        rightAction={null}
      />
      
      <DeliveryProgressBar currentStage={currentStage} stages={DELIVERY_STAGES} />
      
      <div className="p-4 space-y-4">
        <StatusBadge status="active" icon={Package} />
        
        <Card>
          <CardContent>
            <div className="text-center py-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-orange-50 flex items-center justify-center">
                <Package className="h-10 w-10 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Picking up order
              </h2>
              <p className="text-gray-600">
                Let the restaurant know you're here for {orderDetails?.restaurant_name}
              </p>
            </div>
          </CardContent>
        </Card>

        <InfoCard
          icon={Package}
          title="Order Details"
          subtitle={`Order #${orderDetails?.order_id?.slice(-6)}`}
          action={null}
        />

        <Button 
          variant="primary" 
          size="lg" 
          fullWidth
          onClick={() => setCurrentStage('verify_pickup')}
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          Confirm Pickup
        </Button>
      </div>
    </div>
  );

  // Verify Pickup Screen
  const renderVerifyPickup = () => (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <AppHeader 
        title="Verify Order"
        subtitle="Confirm all items"
        onBack={() => setCurrentStage('arrived_at_restaurant')}
        rightAction={null}
      />
      
      <DeliveryProgressBar currentStage={currentStage} stages={DELIVERY_STAGES} />
      
      <div className="p-4 space-y-4">
        <Card>
          <CardContent>
            <div className="text-center py-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Verify the order
              </h2>
              <p className="text-gray-600">
                Make sure everything looks correct before continuing
              </p>
            </div>
          </CardContent>
        </Card>

        <Button 
          variant="primary" 
          size="lg" 
          fullWidth
          onClick={() => setCurrentStage('pickup_photo_verification')}
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          Everything Looks Good
        </Button>
      </div>
    </div>
  );

  // Photo Verification Screen
  const renderPhotoVerification = (type: 'pickup' | 'delivery') => (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <AppHeader 
        title={type === 'pickup' ? 'Verify Pickup' : 'Proof of Delivery'}
        subtitle="Take a clear photo"
        onBack={() => setCurrentStage(type === 'pickup' ? 'verify_pickup' : 'navigate_to_customer')}
        rightAction={null}
      />
      
      <DeliveryProgressBar currentStage={currentStage} stages={DELIVERY_STAGES} />
      
      <div className="p-4 space-y-4">
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <div className="w-32 h-32 mx-auto mb-6 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden">
                {(type === 'pickup' ? pickupPhoto : deliveryPhoto) ? (
                  <img 
                    src={type === 'pickup' ? pickupPhoto! : deliveryPhoto!} 
                    alt="Verification" 
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <Camera className="h-16 w-16 text-gray-400" />
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {type === 'pickup' ? 'Photo of Order' : 'Photo of Drop-off'}
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Take a photo showing the {type === 'pickup' ? 'complete order' : 'delivered order at the door'}
              </p>
              
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoCapture(file, type);
                }}
                className="hidden"
                id={`${type}-photo-input`}
              />
              
              <label htmlFor={`${type}-photo-input`} className="cursor-pointer block">
                <div className={`flex items-center justify-center font-semibold rounded-xl transition-all duration-200 active:scale-95 h-14 px-8 text-lg w-full ${
                  isUploadingPhoto 
                    ? 'bg-red-400 text-white cursor-not-allowed' 
                    : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/30'
                }`}>
                  <Camera className="h-5 w-5 mr-2" />
                  {isUploadingPhoto ? 'Uploading...' : 'Take Photo'}
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {(type === 'pickup' ? pickupPhoto : deliveryPhoto) && (
          <Button 
            variant="success" 
            size="lg" 
            fullWidth
            onClick={async () => {
              if (type === 'pickup') {
                try {
                  if (orderDetails?.order_id) {
                    await supabase
                      .from('orders')
                      .update({ pickup_confirmed_at: new Date().toISOString() } as any)
                      .eq('id', orderDetails.order_id);
                  }
                } catch (error) {
                  console.error('Failed to record pickup confirmation timestamp', error);
                }
              }
              setCurrentStage(type === 'pickup' ? 'navigate_to_customer' : 'delivered');
            }}
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Continue
          </Button>
        )}
      </div>
    </div>
  );

  // Navigate to Customer Screen
  const renderNavigateToCustomer = () => (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <AppHeader 
        title="Deliver Order"
        subtitle={formatElapsedTime()}
        onBack={onCompleteDelivery}
        rightAction={null}
      />
      
      <DeliveryProgressBar currentStage={currentStage} stages={DELIVERY_STAGES} />
      
      <div className="p-4 space-y-4">
        {/* Live Map to Customer with Full Route */}
        <DeliveryMap 
          pickupAddress={orderDetails?.pickup_address}
          dropoffAddress={orderDetails?.dropoff_address}
          showRoute={true}
          className="h-64"
        />

        <InfoCard
          icon={Home}
          title="Delivery Address"
          subtitle={typeof orderDetails?.dropoff_address === 'string' 
            ? orderDetails.dropoff_address 
            : `${orderDetails?.dropoff_address?.street || ''} ${orderDetails?.dropoff_address?.city || ''}`
          }
          action={
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => openExternalNavigation(orderDetails?.dropoff_address, 'dropoff')}
            >
              <Navigation className="h-5 w-5" />
            </Button>
          }
        />

        <Button 
          variant="primary" 
          size="lg" 
          fullWidth
          onClick={() => setCurrentStage('capture_proof')}
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          I've Arrived at Customer
        </Button>
        
        <div className="flex gap-3">
          <Button variant="outline" size="md" fullWidth>
            <Phone className="h-5 w-5 mr-2" />
            Call Customer
          </Button>
          <Button variant="outline" size="md" fullWidth>
            <MessageCircle className="h-5 w-5 mr-2" />
            Text Customer
          </Button>
        </div>
      </div>
    </div>
  );

  // Delivery Complete Screen
  const renderDelivered = () => (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="p-4 space-y-6 min-h-screen flex flex-col items-center justify-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Delivery Complete!
          </h1>
          <p className="text-gray-600 text-lg">
            Great job completing this delivery
          </p>
        </div>

        <Card className="w-full max-w-sm">
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Earnings</span>
                <span className="text-2xl font-bold text-green-600">
                  ${(orderDetails?.payout_cents / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Time</span>
                <span className="text-sm font-semibold text-gray-900">{formatElapsedTime()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Distance</span>
                <span className="text-sm font-semibold text-gray-900">
                  {orderDetails?.distance_mi || '0'} mi
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="w-full max-w-sm space-y-3">
          <Button 
            variant="primary" 
            size="lg" 
            fullWidth
            onClick={onCompleteDelivery}
          >
            Continue Accepting Orders
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            fullWidth
            onClick={() => {
              onCompleteDelivery();
              // Notify parent to pause after delivery
              window.dispatchEvent(new CustomEvent('pauseAfterDelivery'));
            }}
          >
            ⏸️ Pause After This Delivery
          </Button>
        </div>
      </div>
    </div>
  );

  // Stage Router
  const getCurrentStageComponent = () => {
    switch (currentStage) {
      case 'navigate_to_restaurant':
        return renderNavigateToRestaurant();
      case 'arrived_at_restaurant':
        return renderArrivedAtRestaurant();
      case 'verify_pickup':
        return renderVerifyPickup();
      case 'pickup_photo_verification':
        return renderPhotoVerification('pickup');
      case 'navigate_to_customer':
        return renderNavigateToCustomer();
      case 'capture_proof':
        return renderPhotoVerification('delivery');
      case 'delivered':
        return renderDelivered();
      default:
        return renderNavigateToRestaurant();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
      {getCurrentStageComponent()}
    </div>
  );
};

export default ActiveDeliveryFlow;
export type { DeliveryStage, DeliveryProgress };
