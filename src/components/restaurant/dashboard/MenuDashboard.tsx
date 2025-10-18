import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MenuManagerDashboard from "./menu/MenuManagerDashboard";
import PricingDashboard from "./menu/PricingDashboard";

interface MenuDashboardProps {
  restaurantId: string;
}

const MenuDashboard = ({ restaurantId }: MenuDashboardProps) => {
  return (
    <div className="w-full h-full bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold mb-4">Menu</h1>
          <Tabs defaultValue="manager" className="w-full">
            <TabsList className="bg-muted">
              <TabsTrigger value="manager">Menu Manager</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
            </TabsList>

            <TabsContent value="manager" className="mt-6">
              <MenuManagerDashboard restaurantId={restaurantId} />
            </TabsContent>

            <TabsContent value="pricing" className="mt-6">
              <PricingDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default MenuDashboard;
