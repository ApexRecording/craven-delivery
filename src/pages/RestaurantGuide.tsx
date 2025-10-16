import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Store, Utensils, ShoppingCart, BarChart, Settings, 
  DollarSign, Bell, CheckCircle, AlertCircle, Users 
} from 'lucide-react';
import Footer from '@/components/Footer';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const RestaurantGuide = () => {
  const navigate = useNavigate();

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Store,
      content: {
        intro: 'Welcome to Crave\'N! This guide will help you set up your restaurant and start receiving orders.',
        steps: [
          {
            title: 'Create Your Account',
            description: 'Sign up and complete restaurant registration',
            details: 'Provide business name, address, contact info, tax ID, and banking details for payouts'
          },
          {
            title: 'Set Up Your Profile',
            description: 'Add restaurant details and photos',
            details: 'Upload logo, cover photos, write compelling description, set cuisine type and operating hours'
          },
          {
            title: 'Complete Verification',
            description: 'Submit required business documents',
            details: 'Upload business license, food handler permit, insurance certificate - approval typically within 24-48 hours'
          },
          {
            title: 'Configure Settings',
            description: 'Set delivery fees, minimum orders, and prep times',
            details: 'Customize your operational parameters to match your capacity and business model'
          }
        ]
      }
    },
    {
      id: 'menu-setup',
      title: 'Menu Management',
      icon: Utensils,
      content: {
        intro: 'Your menu is the heart of your online presence. Keep it updated and appealing.',
        steps: [
          {
            title: 'Create Categories',
            description: 'Organize your menu into logical sections',
            details: 'Examples: Appetizers, Entrees, Desserts, Beverages. Use display order to control appearance'
          },
          {
            title: 'Add Menu Items',
            description: 'Add dishes with photos, descriptions, and prices',
            details: 'Include high-quality photos, detailed descriptions, allergen info, and dietary tags (vegan, gluten-free, etc.)'
          },
          {
            title: 'Set Modifiers',
            description: 'Add customization options',
            details: 'Configure options like size, toppings, cooking preferences. Set additional charges where applicable'
          },
          {
            title: 'Manage Availability',
            description: 'Mark items as available or sold out',
            details: 'Quickly toggle item availability during service. Set prep times to manage customer expectations'
          },
          {
            title: 'Import Existing Menu',
            description: 'Bulk upload from various formats',
            details: 'Use our menu import tool to parse PDFs, images, or CSV files. Review and edit before publishing'
          }
        ],
        tips: [
          'Use professional food photography - it significantly increases orders',
          'Write appetizing descriptions that highlight unique ingredients',
          'Keep menu organized - too many items can overwhelm customers',
          'Update regularly based on seasonal ingredients and popular items',
          'Mark items as "Chef\'s Special" to drive attention'
        ]
      }
    },
    {
      id: 'order-management',
      title: 'Managing Orders',
      icon: ShoppingCart,
      content: {
        intro: 'Efficient order management ensures happy customers and smooth operations.',
        steps: [
          {
            title: 'Receive New Orders',
            description: 'Get notified via sound, notification, and on-screen alert',
            details: 'You have 2 minutes to accept or reject incoming orders. Auto-reject occurs after timeout'
          },
          {
            title: 'Accept Orders',
            description: 'Review order details and confirm acceptance',
            details: 'Check available ingredients, current kitchen capacity, and estimated prep time before accepting'
          },
          {
            title: 'Prepare Food',
            description: 'Update order status as you prepare',
            details: 'Mark order as "Preparing" to keep customers informed. Update when ready for pickup'
          },
          {
            title: 'Ready for Pickup',
            description: 'Mark order ready when food is prepared',
            details: 'Driver will be notified and should arrive within minutes. Keep food warm and packaged securely'
          },
          {
            title: 'Handle Issues',
            description: 'Communicate problems immediately',
            details: 'If items are unavailable or delays occur, contact customer through the app. Offer substitutions or refunds'
          }
        ],
        tips: [
          'Respond to orders within 60 seconds for best customer experience',
          'Keep prep times realistic - better to over-deliver than disappoint',
          'Package food securely to prevent spills during delivery',
          'Include napkins, utensils, and condiments',
          'Mark items ready only when fully prepared and packaged'
        ]
      }
    },
    {
      id: 'pricing',
      title: 'Pricing & Fees',
      icon: DollarSign,
      content: {
        intro: 'Understand how pricing works and manage your commission structure.',
        details: [
          {
            title: 'Commission Structure',
            description: 'Platform commission on each order',
            info: 'Standard: 15-30% based on order volume. Negotiate rates with platform team as you grow'
          },
          {
            title: 'Delivery Fees',
            description: 'What you set vs what customer pays',
            info: 'You set base fee. Platform may add surge pricing during peak times. You keep 100% of delivery fee you set'
          },
          {
            title: 'Menu Pricing',
            description: 'Setting competitive prices',
            info: 'Factor in food costs, labor, platform commission, and packaging. Many restaurants charge 15-20% more than in-store'
          },
          {
            title: 'Promotions',
            description: 'Platform and restaurant promotions',
            info: 'Platform may run promotions - commission reduced accordingly. You can create your own restaurant-specific deals'
          },
          {
            title: 'Payouts',
            description: 'When and how you get paid',
            info: 'Weekly payouts to your registered bank account. View detailed earnings reports in your dashboard'
          }
        ]
      }
    },
    {
      id: 'analytics',
      title: 'Analytics & Growth',
      icon: BarChart,
      content: {
        intro: 'Use data insights to optimize your menu and grow sales.',
        metrics: [
          {
            name: 'Order Volume',
            description: 'Track daily, weekly, monthly order trends',
            action: 'Identify peak hours to optimize staffing'
          },
          {
            name: 'Popular Items',
            description: 'See which menu items sell best',
            action: 'Promote top sellers, reconsider low performers'
          },
          {
            name: 'Average Order Value',
            description: 'Monitor typical customer spending',
            action: 'Encourage add-ons and combos to increase'
          },
          {
            name: 'Customer Ratings',
            description: 'Track satisfaction scores and feedback',
            action: 'Address negative reviews promptly, maintain high standards'
          },
          {
            name: 'Prep Times',
            description: 'Analyze actual vs estimated preparation times',
            action: 'Optimize kitchen workflow, adjust estimates'
          },
          {
            name: 'Revenue Breakdown',
            description: 'View earnings, commissions, and net income',
            action: 'Compare performance period-over-period'
          }
        ]
      }
    },
    {
      id: 'best-practices',
      title: 'Best Practices',
      icon: CheckCircle,
      content: {
        intro: 'Follow these guidelines to maximize success on the platform.',
        practices: [
          {
            category: 'Operations',
            items: [
              'Keep menu updated - remove unavailable items immediately',
              'Respond to orders within 60 seconds',
              'Maintain realistic prep times',
              'Package food to prevent spills and maintain temperature',
              'Be available during posted business hours'
            ]
          },
          {
            category: 'Customer Service',
            items: [
              'Respond professionally to reviews and complaints',
              'Include utensils, napkins, and condiments',
              'Double-check orders before marking ready',
              'Communicate proactively about delays or issues',
              'Offer solutions when problems occur'
            ]
          },
          {
            category: 'Marketing',
            items: [
              'Use high-quality food photography',
              'Write compelling menu descriptions',
              'Run promotions during slow periods',
              'Respond to all customer reviews',
              'Feature seasonal specials and new items'
            ]
          },
          {
            category: 'Quality',
            items: [
              'Maintain consistent food quality',
              'Use appropriate packaging for each dish type',
              'Verify order accuracy before handoff',
              'Monitor customer feedback closely',
              'Address quality issues immediately'
            ]
          }
        ]
      }
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 py-12">
          <Store className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-center mb-4">Restaurant Partner Guide</h1>
          <p className="text-xl text-center opacity-90 max-w-3xl mx-auto">
            Everything you need to succeed on Crave'N
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Quick Access */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button onClick={() => navigate('/restaurant-auth')} variant="outline">
                Restaurant Login
              </Button>
              <Button onClick={() => navigate('/restaurant-dashboard')} variant="outline">
                Dashboard
              </Button>
              <Button onClick={() => navigate('/help-center')} variant="outline">
                Help Center
              </Button>
              <Button onClick={() => navigate('/contact-us')} variant="outline">
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="getting-started" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-2 py-3">
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{section.title}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <TabsContent key={section.id} value={section.id} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-6 w-6 text-primary" />
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-muted-foreground">{section.content.intro}</p>

                    {section.content.steps && (
                      <div className="space-y-4">
                        {section.content.steps.map((step, i) => (
                          <Card key={i}>
                            <CardHeader>
                              <CardTitle className="text-base flex items-center gap-2">
                                <Badge>{i + 1}</Badge>
                                {step.title}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <p className="font-medium text-sm">{step.description}</p>
                              <p className="text-sm text-muted-foreground">{step.details}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {section.content.tips && (
                      <Card className="bg-primary/5 border-primary/20">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Pro Tips
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {section.content.tips.map((tip, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {section.content.details && (
                      <div className="grid gap-4">
                        {section.content.details.map((detail, i) => (
                          <Card key={i}>
                            <CardContent className="p-4">
                              <h4 className="font-semibold mb-2">{detail.title}</h4>
                              <p className="text-sm text-muted-foreground mb-2">{detail.description}</p>
                              <p className="text-sm">{detail.info}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {section.content.metrics && (
                      <div className="grid gap-4">
                        {section.content.metrics.map((metric, i) => (
                          <Card key={i}>
                            <CardContent className="p-4">
                              <h4 className="font-semibold mb-1">{metric.name}</h4>
                              <p className="text-sm text-muted-foreground mb-2">{metric.description}</p>
                              <p className="text-sm font-medium text-primary">{metric.action}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {section.content.practices && (
                      <div className="space-y-6">
                        {section.content.practices.map((practice, i) => (
                          <div key={i}>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-primary" />
                              {practice.category}
                            </h4>
                            <ul className="space-y-2 ml-7">
                              {practice.items.map((item, j) => (
                                <li key={j} className="flex items-start gap-2 text-sm">
                                  <span className="text-primary">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Support CTA */}
        <Card className="mt-8 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-2xl font-bold mb-3">Need Help?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Our restaurant support team is here to help you succeed. Contact us anytime for assistance.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" onClick={() => navigate('/contact-us')}>
                Contact Support
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/partner-with-us')}>
                Partner Info
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default RestaurantGuide;
