import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, DollarSign, Shield, CheckCircle } from 'lucide-react';
import Footer from '@/components/Footer';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const DriverGuide = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 py-12">
          <Truck className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-center mb-4">Driver Training Guide</h1>
          <p className="text-xl text-center opacity-90">Learn how to become a successful Crave'N driver</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-8">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" />Getting Started</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><h4 className="font-semibold mb-2">1. Apply & Get Approved</h4><p className="text-sm text-muted-foreground">Complete application at /craver-hub with license, insurance, and vehicle info</p></div>
            <div><h4 className="font-semibold mb-2">2. Pass Background Check</h4><p className="text-sm text-muted-foreground">Wait for verification (typically 24-48 hours)</p></div>
            <div><h4 className="font-semibold mb-2">3. Go Online</h4><p className="text-sm text-muted-foreground">Access driver dashboard and toggle online to start receiving orders</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" />Earning Money</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-green-600" /><span>Starting offer formula: $3.50 base + $1.00 per mile (market configurable)</span></li>
              <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-green-600" /><span>You always see full payout before accepting, including 100% of tips</span></li>
              <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-green-600" /><span>If orders are declined, payout escalates and shows "Payout increased due to driver demand."</span></li>
              <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-green-600" /><span>Wait pay: after 10 minutes at restaurant, earn $1 per minute waited</span></li>
              <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-green-600" /><span>Instant cashout available</span></li>
              <li className="flex items-start gap-2"><CheckCircle className="h-5 w-5 text-green-600" /><span>Daily automatic payouts</span></li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Safety First</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Follow all traffic laws and speed limits</li>
              <li>• Use GPS navigation safely - pull over if needed</li>
              <li>• Verify order details before pickup and delivery</li>
              <li>• Contact customer through app for delivery instructions</li>
              <li>• Report any safety concerns immediately</li>
            </ul>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate('/craver-hub')}>Apply Now</Button>
          <Button variant="outline" onClick={() => navigate('/contact-us')}>Get Support</Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DriverGuide;
