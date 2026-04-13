import React, { useState } from 'react';
import CPOAccessGuard from '@/components/CPOAccessGuard';
import VendorManagement from '@/components/partnership/VendorManagement';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, BarChart3, Building2, Handshake, ChevronRight } from 'lucide-react';
import cravenLogo from '@/assets/craven-logo.png';
import { cn } from '@/lib/utils';

const ChiefPartnershipPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState('vendors');
  const [expandedSection, setExpandedSection] = useState<string | null>('partnerships');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const navSections = [
    {
      id: 'partnerships',
      title: 'Partnerships',
      icon: Handshake,
      items: [
        { id: 'vendors', label: 'Vendors', icon: Building2 },
      ],
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'vendors':
        return <VendorManagement />;
      default:
        return <VendorManagement />;
    }
  };

  return (
    <CPOAccessGuard>
      <div className="flex h-screen w-full bg-background">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-4">
              <img src={cravenLogo} alt="Crave'n" className="h-6" />
              <span className="font-bold">Chief Partnership Portal</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = '/')}
              className="w-full justify-start"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to App
            </Button>
          </div>

          <ScrollArea className="flex-1 px-3">
            <div className="space-y-4 py-4">
              <div className="pt-4 pb-2">
                <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Manage
                </h3>
              </div>

              {navSections.map((section) => (
                <div key={section.id} className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-between"
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="flex items-center">
                      <section.icon className="h-4 w-4 mr-2" />
                      <span>{section.title}</span>
                    </div>
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 transition-transform',
                        expandedSection === section.id && 'rotate-90'
                      )}
                    />
                  </Button>

                  {expandedSection === section.id && (
                    <div className="ml-4 space-y-1">
                      {section.items.map((item) => (
                        <Button
                          key={item.id}
                          variant={activeTab === item.id ? 'secondary' : 'ghost'}
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => setActiveTab(item.id)}
                        >
                          <item.icon className="h-4 w-4 mr-2" />
                          {item.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </CPOAccessGuard>
  );
};

export default ChiefPartnershipPortal;
