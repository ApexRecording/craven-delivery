import React, { useEffect, useState } from 'react';
import { ChevronRight, Users, MapPin, Clock, DollarSign, Navigation2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DeliveryMap } from './DeliveryMap';

interface OrderAssignment {
  assignment_id: string;
  order_id: string;
  restaurant_name: string;
  pickup_address: any; 
  dropoff_address: any; 
  payout_cents: number;
  distance_km: number;
  distance_mi: string;
  expires_at: string;
  estimated_time: number;
  isTestOrder?: boolean;
  escalation_message?: string;
  tips_included?: boolean;
}

interface OrderAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: OrderAssignment | null;
  onAccept: (assignment: OrderAssignment) => Promise<void> | void;
  onDecline: (assignment: OrderAssignment) => Promise<void> | void;
}

export const OrderAssignmentModal: React.FC<OrderAssignmentModalProps> = ({
  isOpen,
  onClose,
  assignment,
  onAccept,
  onDecline
}) => {
  const [timeLeft, setTimeLeft] = useState(45);
  const { toast } = useToast();

  // Earnings + routing state
  const [tipCents, setTipCents] = useState<number>(0);
  const [routeMiles, setRouteMiles] = useState<number | null>(null);
  const [routeMins, setRouteMins] = useState<number | null>(null);
  const [locationType, setLocationType] = useState<string | null>(null);

  // Load payout settings and order details
  useEffect(() => {
    if (!isOpen || !assignment) return;

    const run = async () => {
      try {
        // Get order details for supplementary context
        const { data: order } = await supabase
          .from('orders')
          .select('tip_cents, dropoff_address, pickup_address')
          .eq('id', assignment.order_id)
          .maybeSingle();

        if (order) {
          setTipCents(Number(order.tip_cents || 0));

          const dAddr: any = order.dropoff_address;
          const type = dAddr?.type || dAddr?.address_type || dAddr?.location_type || null;
          if (type) setLocationType(String(type));
        }
      } catch (e) {
        console.warn('Order detail fetch failed', e);
      }
    };

    run();
  }, [isOpen, assignment]);

  // Mapbox route fetch
  useEffect(() => {
    if (!isOpen || !assignment) return;
    let canceled = false;

    const fetchRoute = async () => {
      try {
        const pAddr: any = assignment.pickup_address;
        const dAddr: any = assignment.dropoff_address;

        const tokRes = await supabase.functions.invoke('get-mapbox-token');
        const token = (tokRes.data as any)?.token;
        if (!token) return;

        const buildAddress = (addr: any) => {
          if (!addr) return '';
          if (typeof addr === 'string') return addr;
          if (addr.address) return addr.address;
          const parts = [addr.street, addr.city, addr.state, addr.zip_code].filter(Boolean);
          return parts.join(', ');
        };

        const geocode = async (addr: any): Promise<[number, number] | null> => {
          const q = buildAddress(addr);
          if (!q) return null;
          const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?limit=1&access_token=${token}`);
          const j = await res.json();
          const c = j?.features?.[0]?.center;
          return Array.isArray(c) && c.length === 2 ? [Number(c[0]), Number(c[1])] : null;
        };

        let pLat = Number(pAddr?.lat ?? pAddr?.latitude);
        let pLng = Number(pAddr?.lng ?? pAddr?.longitude);
        let dLat = Number(dAddr?.lat ?? dAddr?.latitude);
        let dLng = Number(dAddr?.lng ?? dAddr?.longitude);

        if ([pLat, pLng].some(isNaN)) {
          const g = await geocode(pAddr);
          if (g) { pLng = g[0]; pLat = g[1]; }
        }
        if ([dLat, dLng].some(isNaN)) {
          const g = await geocode(dAddr);
          if (g) { dLng = g[0]; dLat = g[1]; }
        }

        if ([pLat, pLng, dLat, dLng].some(isNaN)) return;

        let originLat: number | null = null;
        let originLng: number | null = null;
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 })
          );
          originLat = position.coords.latitude;
          originLng = position.coords.longitude;
        } catch (_) {}

        const coords = originLat && originLng
          ? `${originLng},${originLat};${pLng},${pLat};${dLng},${dLat}`
          : `${pLng},${pLat};${dLng},${dLat}`;

        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}.json?overview=false&access_token=${token}`;
        const res = await fetch(url);
        const json = await res.json();
        const route = json?.routes?.[0];

        if (!canceled && route) {
          setRouteMiles(Number((route.distance / 1609.34).toFixed(1)));
          setRouteMins(Math.round(route.duration / 60));
        }
      } catch (e) {
        console.warn('Route fetch failed', e);
      }
    };

    fetchRoute();
    return () => { canceled = true; };
  }, [isOpen, assignment]);

  // Countdown timer and notification sound
  useEffect(() => {
    if (!isOpen || !assignment) return;

    const playNotificationSequence = async () => {
      try {
        const audioContext = new AudioContext();
        const duration = 0.3;
        const gap = 0.15;
        for (let i = 0; i < 3; i++) {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.frequency.setValueAtTime(i % 2 === 0 ? 800 : 600, audioContext.currentTime);
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
          const startTime = audioContext.currentTime + (i * (duration + gap));
          oscillator.start(startTime);
          oscillator.stop(startTime + duration);
        }
      } catch (e) {
        console.log('Notification sound failed:', e);
      }
    };

    playNotificationSequence();
    setTimeLeft(45);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, assignment]);

  const handleAccept = async () => {
    if (assignment) {
      try {
        await onAccept(assignment);
        toast({ title: "Order Accepted!", description: "Navigate to the pickup location." });
      } catch (error) {
        console.error('accept assignment failed', error);
        toast({ title: "Accept failed", description: "Please try again.", variant: "destructive" });
      }
    }
  };

  const handleDecline = async () => {
    if (assignment) {
      try {
        await onDecline(assignment);
        toast({ title: "Order Declined", description: "Looking for new offers..." });
      } catch (error) {
        console.error('decline assignment failed', error);
        toast({ title: "Decline failed", description: "Please try again.", variant: "destructive" });
      }
    }
  };

  if (!isOpen || !assignment) return null;

  const estimatedPayout = (Number(assignment.payout_cents || 0) / 100).toFixed(2);
  const milesParsed = parseFloat(assignment.distance_mi || '0') || 0;
  const miles = routeMiles ?? milesParsed;
  const mins = routeMins ?? (assignment.estimated_time || 0);

  const formatAddress = (addr: any): string => {
    if (typeof addr === 'string') return addr;
    if (addr?.address) return addr.address;
    const parts = [addr?.street, addr?.city, addr?.state].filter(Boolean);
    return parts.join(', ') || 'Address unavailable';
  };

  return (
    <div className="fixed modal-overlay" style={{ top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
      <div className="absolute inset-0 flex items-end sm:items-center sm:justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleDecline} />
        
        {/* Modal */}
        <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl transform transition-all duration-300 max-h-[90vh] overflow-y-auto">
        {/* Timer Progress Bar */}
        <div className="sticky top-0 left-0 right-0 h-2 bg-gray-100 rounded-t-3xl overflow-hidden z-10">
          <div 
            className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-1000"
            style={{ width: `${(timeLeft / 45) * 100}%` }}
          />
        </div>

        {/* Close Button */}
        <button
          onClick={handleDecline}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>

        <div className="p-6 pb-8 space-y-6">
          {/* Test Order Badge */}
          {assignment.isTestOrder && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🧪</span>
                <span className="font-bold text-yellow-900">Test Order</span>
              </div>
              <p className="text-sm text-yellow-700">
                This is a test order for training purposes.
              </p>
            </div>
          )}

          {/* Header */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">New Delivery Offer</h2>
            <p className="text-sm text-gray-500">Accept within <span className="font-semibold text-orange-600">{timeLeft}s</span></p>
          </div>

          {/* Earnings Card */}
          <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <span className="text-5xl font-bold text-gray-900">${estimatedPayout}</span>
            </div>
            <p className="text-center text-sm text-gray-600">Full payout shown before accept (tips included)</p>
            {assignment.escalation_message && (
              <p className="text-center text-xs text-orange-700 font-medium mt-2">
                {assignment.escalation_message}
              </p>
            )}
            {tipCents > 0 && (
              <p className="text-center text-xs text-gray-500 mt-1">
                Includes ${((tipCents || 0) / 100).toFixed(2)} customer tip
              </p>
            )}
            
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-green-200">
              <div className="text-center">
                <div className="flex items-center gap-1 justify-center">
                  <Navigation2 className="h-4 w-4 text-gray-500" />
                  <span className="text-lg font-bold text-gray-900">{miles}</span>
                </div>
                <span className="text-xs text-gray-600">miles</span>
              </div>
              <div className="w-px h-8 bg-green-200" />
              <div className="text-center">
                <div className="flex items-center gap-1 justify-center">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-lg font-bold text-gray-900">{mins}</span>
                </div>
                <span className="text-xs text-gray-600">minutes</span>
              </div>
            </div>
          </div>

          {/* Live Map */}
          <div className="rounded-2xl overflow-hidden border border-gray-200">
            <DeliveryMap 
              pickupAddress={assignment.pickup_address}
              dropoffAddress={assignment.dropoff_address}
              showRoute={true}
              className="h-64"
            />
          </div>

          {/* Pickup Info */}
          <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
            <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-orange-600 mb-1">PICKUP</p>
              <p className="font-semibold text-gray-900 mb-1">{assignment.restaurant_name}</p>
              <p className="text-sm text-gray-600 line-clamp-2">
                {formatAddress(assignment.pickup_address)}
              </p>
            </div>
          </div>

          {/* Route Indicator */}
          <div className="flex items-center justify-center">
            <div className="w-1 h-12 bg-gradient-to-b from-orange-300 to-green-300 rounded-full" />
          </div>

          {/* Dropoff Info */}
          <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border border-green-100">
            <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-green-600 mb-1">DROPOFF</p>
              <p className="font-semibold text-gray-900 mb-1">Customer Location</p>
              <p className="text-sm text-gray-600 line-clamp-2">
                {formatAddress(assignment.dropoff_address)}
              </p>
              {locationType && (
                <span className="inline-block mt-2 px-3 py-1 bg-white rounded-lg text-xs text-gray-600 border border-gray-200 font-medium">
                  {locationType}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleDecline}
              className="flex-1 h-14 px-6 rounded-xl font-semibold bg-gray-100 text-gray-900 hover:bg-gray-200 transition-all active:scale-95"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 h-14 px-6 rounded-xl font-semibold bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-lg shadow-orange-500/30 transition-all active:scale-95"
            >
              Accept Order
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
