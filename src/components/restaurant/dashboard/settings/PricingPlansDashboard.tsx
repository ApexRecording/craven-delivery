import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Check, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurantData } from "@/hooks/useRestaurantData";
import { toast } from "sonner";

interface PricingPlan {
  id: string;
  tier: string;
  name: string;
  delivery_commission_percent: number;
  pickup_commission_percent: number;
  monthly_fee_cents: number;
  features: string[] | null;
  display_order: number;
}


const PricingPlansDashboard = () => {
  const { restaurant, loading } = useRestaurantData();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<PricingPlan | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    fetchPricingPlans();
  }, []);

  useEffect(() => {
    if (restaurant && plans.length > 0) {
      const plan = plans.find(p => p.tier === (restaurant as any).commission_tier);
      setCurrentPlan(plan || plans[0]);
    }
  }, [restaurant, plans]);

  const fetchPricingPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      toast.error('Failed to load pricing plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  const formatTier = (tier: string) =>
    tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();

  if (loading || loadingPlans) {
    return (
      <div className="space-y-6 pb-8">
        <Card>
          <CardContent className="p-20 text-center">
            <p>Loading pricing information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Description */}
      <p className="text-muted-foreground">
        View your plan and compare it with our other pricing plans.
      </p>

      <Tabs defaultValue="your-plan" className="w-full">
        <TabsList className="bg-muted">
          <TabsTrigger value="your-plan">Your plan</TabsTrigger>
          <TabsTrigger value="all-plans">All plans</TabsTrigger>
        </TabsList>

        <TabsContent value="your-plan" className="space-y-6 mt-6">
          {/* Contact Support Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Contact support to change plans</h3>
                    <p className="text-sm text-muted-foreground">
                      Please contact our support team who will be happy to help you change plans.
                    </p>
                  </div>
                </div>
                <Button variant="outline">Contact support</Button>
              </div>
            </CardContent>
          </Card>

          {/* Your Plan Details */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Your plan</h2>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  {currentPlan?.name || 'No plan selected'}
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="font-medium">Delivery commission rate</span>
                  <span className="text-lg font-semibold">{currentPlan?.delivery_commission_percent || 0}%</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b">
                  <span className="font-medium">Pickup commission rate</span>
                  <span className="text-lg font-semibold">{currentPlan?.pickup_commission_percent || 0}%</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b">
                  <span className="font-medium">Monthly subscription fee</span>
                  <span className="text-lg font-semibold">
                    ${((currentPlan?.monthly_fee_cents || 0) / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {currentPlan && currentPlan.features && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-3">Plan features</h3>
                  <ul className="space-y-2">
                    {(currentPlan.features as string[]).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground">
                  Questions about your commission rates?{" "}
                  <a href="#" className="text-primary underline">Learn more</a>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-plans" className="space-y-6 mt-6">
          <h2 className="text-2xl font-bold">All plans</h2>

          {plans.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                No pricing plans are configured yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={currentPlan?.tier === plan.tier ? "border-primary border-2" : ""}
                >
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{formatTier(plan.tier)} plan</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-sm">What you pay</span>
                      </div>
                      <p className="text-sm">
                        {plan.delivery_commission_percent}% commission per delivery order
                      </p>
                      <p className="text-sm">
                        {plan.pickup_commission_percent}% commission per pickup order
                      </p>
                      <p className="text-sm">
                        ${((plan.monthly_fee_cents || 0) / 100).toFixed(2)} monthly subscription fee
                      </p>
                    </div>

                    {Array.isArray(plan.features) && plan.features.length > 0 && (
                      <div className="space-y-2">
                        <span className="font-semibold text-sm">Plan features</span>
                        <ul className="space-y-2">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PricingPlansDashboard;
