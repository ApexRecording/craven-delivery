import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <h2 className="text-lg font-semibold mb-3">{title}</h2>
    {children}
  </div>
);

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cart, setCart] = useState<any[]>([]);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    instructions: '',
    tip: 0,
    tipType: 'percentage',
    tipPercent: 15
  });

  // Load cart from localStorage (from restaurant page)
  useEffect(() => {
    const savedCart = localStorage.getItem('checkout_cart');
    const savedRestaurant = localStorage.getItem('checkout_restaurant');
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedRestaurant) setRestaurant(JSON.parse(savedRestaurant));
  }, []);

  const subtotal = useMemo(() => 
    cart.reduce((sum, item) => sum + (item.price_cents * item.quantity), 0), [cart]
  );

  const deliveryFee = 300; // $3.00
  const tax = Math.round((subtotal + deliveryFee) * 0.08); // 8% tax
  const tipAmount = formData.tipType === 'percentage' 
    ? Math.round(subtotal * (formData.tipPercent / 100))
    : formData.tip;
  
  const total = subtotal + deliveryFee + tax + tipAmount;

  const handlePlaceOrder = async () => {
    if (!restaurant || cart.length === 0) {
      toast({ title: "Error", description: "No items in cart", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create order
      const orderData = {
        customer_id: user?.id || null,
        restaurant_id: restaurant.id,
        subtotal_cents: subtotal,
        delivery_fee_cents: deliveryFee,
        tax_cents: tax,
        tip_cents: tipAmount,
        total_cents: total,
        order_status: 'pending',
        customer_name: formData.name,
        customer_phone: formData.phone,
        delivery_address: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}`,
          special_instructions: formData.instructions
        },
        estimated_delivery_time: new Date(Date.now() + 45 * 60000).toISOString()
      };

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: newOrder.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price_cents: item.price_cents,
        special_instructions: item.special_instructions || null
      }));

      await supabase.from('order_items').insert(orderItems);

      // Clear cart
      localStorage.removeItem('checkout_cart');
      localStorage.removeItem('checkout_restaurant');

      toast({ title: "Order placed!", description: "Your order has been submitted." });
      navigate(`/track-order/${newOrder.id}`);
      
    } catch (error) {
      console.error('Order error:', error);
      toast({ title: "Error", description: "Failed to place order", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Forms */}
          <div className="lg:col-span-2 space-y-6">
            <Section title="Delivery Address">
              <div className="space-y-3">
                {/* Saved addresses */}
                <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                  {['Home','Work','Recent'].map((label, i) => (
                    <button key={i} className="px-3 py-2 rounded-full border text-sm whitespace-nowrap">{label}</button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input 
                    className="border rounded-lg px-3 py-2" 
                    placeholder="Street address" 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                  <input className="border rounded-lg px-3 py-2" placeholder="Apt, suite (optional)" />
                  <input 
                    className="border rounded-lg px-3 py-2" 
                    placeholder="City" 
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      className="border rounded-lg px-3 py-2" 
                      placeholder="State" 
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                    />
                    <input 
                      className="border rounded-lg px-3 py-2" 
                      placeholder="ZIP" 
                      value={formData.zip}
                      onChange={(e) => setFormData({...formData, zip: e.target.value})}
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-500">Address will be validated on map before placing order.</div>
              </div>
            </Section>

            <Section title="Delivery Options">
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="method" defaultChecked />
                  <span>Delivery</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="method" />
                  <span>Pickup</span>
                </label>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <textarea 
                  className="w-full border rounded-lg px-3 py-2 md:col-span-2" 
                  rows={3} 
                  placeholder="Delivery instructions (optional)"
                  value={formData.instructions}
                  onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                />
                <div className="flex items-center gap-2">
                  <input id="leaveAtDoor" type="checkbox" className="accent-orange-500" />
                  <label htmlFor="leaveAtDoor" className="text-sm">Leave at door</label>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Schedule</label>
                  <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
                    <option>ASAP</option>
                    <option>In 30 minutes</option>
                    <option>In 1 hour</option>
                    <option>Pick a time…</option>
                  </select>
                </div>
              </div>
            </Section>

            <Section title="Contact Info">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input 
                  className="border rounded-lg px-3 py-2" 
                  placeholder="Full name" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
                <input 
                  className="border rounded-lg px-3 py-2" 
                  placeholder="Phone number" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
                <input 
                  className="sm:col-span-2 border rounded-lg px-3 py-2" 
                  placeholder="Email (receipt)" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </Section>

            <Section title="Payment">
              <div className="space-y-3">
                <div className="space-y-2">
                  {['Visa •••• 4242','Apple Pay','Add new card'].map((label, i) => (
                    <label key={i} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer">
                      <input type="radio" name="payment" defaultChecked={i===0} />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
                <div className="text-xs text-gray-500">You won’t be charged until the order is accepted.</div>
              </div>
            </Section>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <h2 className="text-lg font-semibold">Order Summary</h2>
                <div className="text-sm text-gray-600">Cart summary will appear here</div>
                {/* Promo code */}
                <div className="flex gap-2">
                  <input className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="Promo code" />
                  <button className="px-3 py-2 rounded-lg border text-sm">Apply</button>
                </div>
                {/* Tip selector */}
                <div>
                  <div className="text-sm font-medium mb-2">Tip your driver</div>
                  <div className="flex gap-2">
                    {["$0","10%","15%","20%","Custom"].map((t, i) => (
                      <button key={i} className="px-3 py-2 rounded-full border text-sm">{t}</button>
                    ))}
                  </div>
                </div>
                <div className="border-t pt-3 space-y-2 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>${(subtotal / 100).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Delivery fee</span><span>${(deliveryFee / 100).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Tax</span><span>${(tax / 100).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Tip</span><span>${(tipAmount / 100).toFixed(2)}</span></div>
                </div>
                <div className="flex justify-between items-center font-semibold text-base border-t pt-3">
                  <span>Total</span>
                  <span>${(total / 100).toFixed(2)}</span>
                </div>
                <div className="text-[11px] text-gray-500">By placing your order, you agree to the Terms and acknowledge the Privacy Policy.</div>
                <button 
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-md py-3 text-sm font-semibold"
                >
                  {isProcessing ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;


