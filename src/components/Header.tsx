import React, { useState, useEffect } from "react";
import { MapPin, Search, User, ShoppingCart, ChevronDown, LogOut, Menu, X, Gift, Store, Handshake } from "lucide-react";
import { Link } from "react-router-dom";
import cravenLogo from "@/assets/craven-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMerchantStatus } from "@/hooks/useMerchantStatus";
import { useUserRole } from "@/hooks/useUserRole";
import AuthModal from "./auth/AuthModal";
import AddressSelector from "./address/AddressSelector";
import { ThemeToggle } from "./ThemeToggle";

interface User {
  id: string;
  email?: string;
  user_metadata?: any;
}

const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [cartItems, setCartItems] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const { isMerchant, merchantLoading } = useMerchantStatus(user?.id || null);
  const { hasRole: userHasRole } = useUserRole();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account."
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <header className="bg-background border-b border-border sticky top-0 z-50 shadow-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/">
              <img src={cravenLogo} alt="CRAVE'N" className="h-10" />
            </Link>
            <div className="animate-pulse">Loading...</div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="bg-background border-b border-border sticky top-0 z-50 shadow-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/">
                <img src={cravenLogo} alt="CRAVE'N" className="h-10" />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-6">
              <a href="/restaurants" className="text-foreground hover:text-primary transition-colors">Restaurants</a>
              <a href="/feeder" className="text-foreground hover:text-primary transition-colors">Become a Feeder</a>
            </nav>

            {/* Desktop Location/Address Selector */}
            <div className="hidden lg:flex">
              {user ? (
                <AddressSelector 
                  userId={user.id} 
                  onAddressChange={(address) => setSelectedAddress(address)} 
                />
              ) : (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">Deliver to</span>
                  <span className="text-xs font-medium text-foreground">Current Location</span>
                </div>
              )}
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search restaurants, cuisines, or dishes"
                  className="pl-10 bg-muted border-0 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-2">
              <ThemeToggle />
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => window.location.href = '/admin'}
              >
                Admin
              </Button>
              
              {user && (
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {cartItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItems}
                    </span>
                  )}
                </Button>
              )}
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden lg:inline">{user.email}</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => window.location.href = '/customer-dashboard'}>
                      <User className="mr-2 h-4 w-4" />
                      <span>My Orders</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.href = '/customer-dashboard?tab=rewards'}>
                      <Gift className="mr-2 h-4 w-4" />
                      <span>Rewards</span>
                    </DropdownMenuItem>
                    {isMerchant && !merchantLoading && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => window.location.href = '/merchant-portal'}>
                          <Store className="mr-2 h-4 w-4" />
                          <span>Merchant Portal</span>
                        </DropdownMenuItem>
                      </>
                    )}
                    {(userHasRole('cpo') || userHasRole('admin')) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => window.location.href = '/chief-partnership-portal'}>
                          <Handshake className="mr-2 h-4 w-4" />
                          <span>Partnership Portal</span>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden lg:inline">Sign In</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Sign In to Crave'n</DialogTitle>
                    </DialogHeader>
                    <AuthModal onClose={() => setIsAuthModalOpen(false)} />
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Mobile Burger Menu */}
            <div className="flex md:hidden items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-foreground hover:bg-background"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg z-50">
            <div className="container mx-auto px-4 py-6 space-y-4">
              {/* Mobile Navigation */}
              <nav className="space-y-4">
                <a 
                  href="/restaurants" 
                  className="block text-lg font-semibold text-foreground hover:text-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Restaurants
                </a>
                <a 
                  href="/feeder" 
                  className="block text-lg font-semibold text-foreground hover:text-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Become a Feeder
                </a>
                <a 
                  href="/admin" 
                  className="block text-lg font-semibold text-primary hover:text-primary/80"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin
                </a>
              </nav>

              {/* Mobile Theme Toggle */}
              <div className="flex items-center justify-between pb-4">
                <span className="text-sm font-medium text-foreground">Theme</span>
                <ThemeToggle />
              </div>

              {/* Mobile Auth Section */}
              <div className="pt-4 border-t border-border">
                {user ? (
                  <div className="space-y-4">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-lg h-12"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        window.location.href = '/customer-dashboard';
                      }}
                    >
                      <User className="mr-3 h-5 w-5" />
                      My Orders
                    </Button>
                    {isMerchant && !merchantLoading && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-lg h-12"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          window.location.href = '/merchant-portal';
                        }}
                      >
                        <Store className="mr-3 h-5 w-5" />
                        Merchant Portal
                      </Button>
                    )}
                    {(userHasRole('cpo') || userHasRole('admin')) && (
                      <Button
                        variant="outline"
                        className="w-full justify-start text-lg h-12"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          window.location.href = '/chief-partnership-portal';
                        }}
                      >
                        <Handshake className="mr-3 h-5 w-5" />
                        Partnership Portal
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-lg h-12 text-destructive border-destructive/20 hover:bg-destructive/10"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleSignOut();
                      }}
                    >
                      <LogOut className="mr-3 h-5 w-5" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="default" 
                    className="w-full text-lg h-12"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                  >
                    <User className="mr-3 h-5 w-5" />
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign In to Crave'n</DialogTitle>
          </DialogHeader>
          <AuthModal onClose={() => setIsAuthModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;