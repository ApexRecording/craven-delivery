import React, { useState } from 'react';
import ChiefPartnershipAccessGuard from '@/components/ChiefPartnershipAccessGuard';
import VendorManagement from '@/components/partnership/VendorManagement';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Building2,
  LayoutDashboard,
} from 'lucide-react';
import cravenLogo from '@/assets/craven-logo.png';

type ActiveTab = 'dashboard' | 'vendors';

const ChiefPartnershipPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('vendors');

  const navItems: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'vendors', label: 'Vendors', icon: Building2 },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Chief Partnership Portal</h2>
            <p className="text-muted-foreground">
              Welcome to the Chief Partnership Portal. Use the sidebar to manage vendor
              relationships and track partnership activity.
            </p>
            <div
              className="cursor-pointer rounded-xl border p-6 flex items-center gap-4 hover:bg-muted/50 transition-colors"
              onClick={() => setActiveTab('vendors')}
            >
              <div className="bg-primary/10 p-3 rounded-lg">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Vendor Management</p>
                <p className="text-sm text-muted-foreground">
                  Build and track your vendor relationships, contacts, contracts, and interaction history.
                </p>
              </div>
            </div>
          </div>
        );
      case 'vendors':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-1">Vendors</h2>
            <p className="text-muted-foreground mb-6">
              Manage vendor relationships, contacts, contracts, and interaction history.
            </p>
            <VendorManagement />
          </div>
        );
    }
  };

  return (
    <ChiefPartnershipAccessGuard>
      <div className="flex h-screen w-full bg-background">
        {/* Sidebar */}
        <aside className="w-60 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-4">
              <img src={cravenLogo} alt="Crave'n" className="h-6" />
              <span className="font-bold text-sm leading-tight">Chief Partnership<br />Portal</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => window.location.href = '/'}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to App
            </Button>
          </div>

          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {navItems.map(item => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab(item.id)}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 max-w-5xl">
            {renderContent()}
          </div>
        </main>
      </div>
    </ChiefPartnershipAccessGuard>
  );
};

export default ChiefPartnershipPortal;
