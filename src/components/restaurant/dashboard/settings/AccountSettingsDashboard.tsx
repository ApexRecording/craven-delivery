import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurantData } from "@/hooks/useRestaurantData";
import { toast } from "sonner";

const AccountSettingsDashboard = () => {
  const { restaurant, loading } = useRestaurantData();
  const [autoDescriptions, setAutoDescriptions] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [pickupInstructions, setPickupInstructions] = useState("");
  const [customerPickupInstructions, setCustomerPickupInstructions] = useState("");
  const [pausePin, setPausePin] = useState("");
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (restaurant?.id) {
      // Load settings from restaurant settings if they exist
      fetchSettings();
    }
  }, [restaurant?.id]);

  const fetchSettings = async () => {
    // Settings would be stored in restaurant preferences or settings
    // For now using placeholder
  };

  const handleSavePickupInstructions = async () => {
    setSaving(true);
    try {
      const existingNotes = (restaurant as any)?.verification_notes || {};
      const { error } = await supabase
        .from("restaurants")
        .update({
          verification_notes: {
            ...existingNotes,
            pickup_instructions: pickupInstructions,
            customer_pickup_instructions: customerPickupInstructions
          }
        })
        .eq("id", restaurant?.id);

      if (error) throw error;
      toast.success("Instructions saved successfully");
    } catch (error) {
      console.error("Error saving instructions:", error);
      toast.error("Failed to save instructions");
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePin = async () => {
    if (pausePin.length !== 4 || !/^\d{4}$/.test(pausePin)) {
      toast.error("PIN must be exactly 4 digits");
      return;
    }

    setSaving(true);
    try {
      const existingNotes = (restaurant as any)?.verification_notes || {};
      const { error } = await supabase
        .from("restaurants")
        .update({
          verification_notes: {
            ...existingNotes,
            pause_pin: pausePin
          }
        })
        .eq("id", restaurant?.id);

      if (error) throw error;
      toast.success("PIN created successfully");
      setShowPinDialog(false);
    } catch (error) {
      console.error("Error creating PIN:", error);
      toast.error("Failed to create PIN");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <Card>
          <CardContent className="p-20 text-center">
            <p>Loading settings...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Permission Alert */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm">
                You do not have permission to access the daily payout currently.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Settings */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Menu settings</h2>
          
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Use auto-generated menu descriptions</h3>
                <p className="text-sm text-muted-foreground">
                  Add AI-powered descriptions to items that don't already have them across all of your stores.{" "}
                  <a href="#" className="text-primary underline">Learn more</a>
                </p>
              </div>
              <Switch 
                checked={autoDescriptions} 
                onCheckedChange={setAutoDescriptions}
              />
            </div>

            <div className="pt-6 border-t">
              <h3 className="font-semibold mb-2">Alcohol sales</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sell alcohol on Crave'N in compliance with local laws and regulations. To get started, confirm that alcohol delivery is allowed in your state.{" "}
                <a href="#" className="text-primary underline">Learn more</a>
              </p>
              <Button variant="destructive">Add</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tablet Settings */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-6">Tablet Settings</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Login information</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Username:</p>
                  <p className="font-mono">{restaurant?.id?.slice(0, 15) || 'Not set'}</p>
                </div>
                <Button variant="outline">Reset password</Button>
              </div>
            </div>

            <div className="pt-6 border-t">
              <h3 className="font-semibold mb-2">Pause store PIN</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create and manage your PIN to pause your store on the Crave'N Tablet.
              </p>
              {!((restaurant as any)?.verification_notes?.pause_pin) ? (
                <>
                  <p className="text-sm text-red-600 mb-4">You haven't created a PIN yet.</p>
                  <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Create PIN</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Pause Store PIN</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="pin">4-Digit PIN</Label>
                          <Input
                            id="pin"
                            type="password"
                            maxLength={4}
                            placeholder="1234"
                            value={pausePin}
                            onChange={(e) => setPausePin(e.target.value.replace(/\D/g, ''))}
                          />
                        </div>
                        <Button 
                          onClick={handleCreatePin} 
                          disabled={saving || pausePin.length !== 4}
                          className="w-full"
                        >
                          {saving ? "Creating..." : "Create PIN"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                <p className="text-sm text-green-600">PIN is set. Use it to pause your store on the tablet.</p>
              )}
            </div>

            <div className="pt-6 border-t">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Chat feature</h3>
                  <p className="text-sm text-muted-foreground">
                    Add chat functionality to contact customers directly through the Crave'N Tablet.
                  </p>
                </div>
                <Switch 
                  checked={chatEnabled} 
                  onCheckedChange={setChatEnabled}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feeder Pickup Instructions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Feeder pickup instructions</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Provide Feeders with instructions to help them navigate your store and improve the order delivery experience.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Default instructions</h3>
              </div>
              <Textarea
                placeholder="Enter pickup instructions for delivery drivers..."
                value={pickupInstructions}
                onChange={(e) => setPickupInstructions(e.target.value)}
                className="min-h-24"
              />
              <p className="text-xs text-muted-foreground mt-2">
                e.g., "Use the side entrance" or "Ask for orders at the counter"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Pickup Instructions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Customer pickup instructions</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Help customers pick up orders faster by providing clear pickup instructions.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Textarea
              placeholder="Enter pickup instructions for customers..."
              value={customerPickupInstructions}
              onChange={(e) => setCustomerPickupInstructions(e.target.value)}
              className="min-h-24"
            />
            <p className="text-xs text-muted-foreground">
              e.g., "Pick up at the front counter" or "Orders ready at the drive-thru window"
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSavePickupInstructions}
          disabled={saving}
          size="lg"
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default AccountSettingsDashboard;
