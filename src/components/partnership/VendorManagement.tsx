// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  MoreVertical,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  FileText,
  MessageSquare,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  Eye,
  X,
  Users,
  TrendingUp,
  Clock,
  Filter,
} from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  category: string;
  status: string;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  contract_value_cents: number | null;
  payment_terms: string | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

interface VendorNote {
  id: string;
  vendor_id: string;
  content: string;
  note_type: string;
  created_at: string;
}

const VENDOR_CATEGORIES = [
  'general',
  'food_supplier',
  'packaging',
  'technology',
  'logistics',
  'marketing',
  'equipment',
  'services',
  'insurance',
  'legal',
];

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  food_supplier: 'Food Supplier',
  packaging: 'Packaging',
  technology: 'Technology',
  logistics: 'Logistics',
  marketing: 'Marketing',
  equipment: 'Equipment',
  services: 'Services',
  insurance: 'Insurance',
  legal: 'Legal',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  archived: 'bg-red-100 text-red-800',
};

const NOTE_TYPE_LABELS: Record<string, string> = {
  general: 'General',
  meeting: 'Meeting',
  call: 'Phone Call',
  email: 'Email',
  contract: 'Contract',
  issue: 'Issue',
};

const VendorManagement: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [vendorNotes, setVendorNotes] = useState<VendorNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newNoteType, setNewNoteType] = useState('general');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    category: 'general',
    status: 'active',
    website: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    contract_start_date: '',
    contract_end_date: '',
    contract_value_cents: '',
    payment_terms: '',
    notes: '',
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to load vendors', variant: 'destructive' });
    } else {
      setVendors(data || []);
    }
    setLoading(false);
  };

  const fetchVendorNotes = async (vendorId: string) => {
    const { data, error } = await (supabase as any)
      .from('vendor_notes')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (!error) {
      setVendorNotes(data || []);
    }
  };

  const handleAddVendor = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const insertData: any = {
      name: formData.name,
      contact_name: formData.contact_name || null,
      contact_email: formData.contact_email || null,
      contact_phone: formData.contact_phone || null,
      category: formData.category,
      status: formData.status,
      website: formData.website || null,
      address: formData.address || null,
      city: formData.city || null,
      state: formData.state || null,
      zip_code: formData.zip_code || null,
      contract_start_date: formData.contract_start_date || null,
      contract_end_date: formData.contract_end_date || null,
      contract_value_cents: formData.contract_value_cents ? parseInt(formData.contract_value_cents) * 100 : null,
      payment_terms: formData.payment_terms || null,
      notes: formData.notes || null,
      created_by: user?.id || null,
    };

    const { error } = await (supabase as any).from('vendors').insert(insertData);

    if (error) {
      toast({ title: 'Error', description: 'Failed to add vendor', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Vendor added successfully' });
      setShowAddDialog(false);
      resetForm();
      fetchVendors();
    }
  };

  const handleUpdateVendor = async () => {
    if (!selectedVendor) return;

    const updateData: any = {
      name: formData.name,
      contact_name: formData.contact_name || null,
      contact_email: formData.contact_email || null,
      contact_phone: formData.contact_phone || null,
      category: formData.category,
      status: formData.status,
      website: formData.website || null,
      address: formData.address || null,
      city: formData.city || null,
      state: formData.state || null,
      zip_code: formData.zip_code || null,
      contract_start_date: formData.contract_start_date || null,
      contract_end_date: formData.contract_end_date || null,
      contract_value_cents: formData.contract_value_cents ? parseInt(formData.contract_value_cents) * 100 : null,
      payment_terms: formData.payment_terms || null,
      notes: formData.notes || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await (supabase as any)
      .from('vendors')
      .update(updateData)
      .eq('id', selectedVendor.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update vendor', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Vendor updated successfully' });
      setEditMode(false);
      fetchVendors();
      setSelectedVendor({ ...selectedVendor, ...updateData });
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    const { error } = await (supabase as any)
      .from('vendors')
      .delete()
      .eq('id', vendorId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete vendor', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Vendor deleted successfully' });
      setShowDetailDialog(false);
      setSelectedVendor(null);
      fetchVendors();
    }
  };

  const handleAddNote = async () => {
    if (!selectedVendor || !newNote.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await (supabase as any).from('vendor_notes').insert({
      vendor_id: selectedVendor.id,
      content: newNote,
      note_type: newNoteType,
      created_by: user?.id || null,
    });

    if (error) {
      toast({ title: 'Error', description: 'Failed to add note', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Note added' });
      setNewNote('');
      setNewNoteType('general');
      fetchVendorNotes(selectedVendor.id);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      category: 'general',
      status: 'active',
      website: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      contract_start_date: '',
      contract_end_date: '',
      contract_value_cents: '',
      payment_terms: '',
      notes: '',
    });
  };

  const openVendorDetail = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setFormData({
      name: vendor.name,
      contact_name: vendor.contact_name || '',
      contact_email: vendor.contact_email || '',
      contact_phone: vendor.contact_phone || '',
      category: vendor.category,
      status: vendor.status,
      website: vendor.website || '',
      address: vendor.address || '',
      city: vendor.city || '',
      state: vendor.state || '',
      zip_code: vendor.zip_code || '',
      contract_start_date: vendor.contract_start_date || '',
      contract_end_date: vendor.contract_end_date || '',
      contract_value_cents: vendor.contract_value_cents ? String(vendor.contract_value_cents / 100) : '',
      payment_terms: vendor.payment_terms || '',
      notes: vendor.notes || '',
    });
    setEditMode(false);
    fetchVendorNotes(vendor.id);
    setShowDetailDialog(true);
  };

  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.contact_name && v.contact_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.contact_email && v.contact_email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || v.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const stats = {
    total: vendors.length,
    active: vendors.filter((v) => v.status === 'active').length,
    pending: vendors.filter((v) => v.status === 'pending').length,
    totalContractValue: vendors.reduce((sum, v) => sum + (v.contract_value_cents || 0), 0),
  };

  const renderVendorForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <Label htmlFor="name">Vendor Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter vendor name"
        />
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {VENDOR_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="contact_name">Contact Name</Label>
        <Input
          id="contact_name"
          value={formData.contact_name}
          onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
          placeholder="Primary contact"
        />
      </div>
      <div>
        <Label htmlFor="contact_email">Contact Email</Label>
        <Input
          id="contact_email"
          type="email"
          value={formData.contact_email}
          onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
          placeholder="email@vendor.com"
        />
      </div>
      <div>
        <Label htmlFor="contact_phone">Contact Phone</Label>
        <Input
          id="contact_phone"
          value={formData.contact_phone}
          onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
          placeholder="(555) 123-4567"
        />
      </div>
      <div>
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          placeholder="https://vendor.com"
        />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Street address"
        />
      </div>
      <div>
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="zip_code">ZIP</Label>
          <Input
            id="zip_code"
            value={formData.zip_code}
            onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="contract_start_date">Contract Start</Label>
        <Input
          id="contract_start_date"
          type="date"
          value={formData.contract_start_date}
          onChange={(e) => setFormData({ ...formData, contract_start_date: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="contract_end_date">Contract End</Label>
        <Input
          id="contract_end_date"
          type="date"
          value={formData.contract_end_date}
          onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="contract_value_cents">Contract Value ($)</Label>
        <Input
          id="contract_value_cents"
          type="number"
          value={formData.contract_value_cents}
          onChange={(e) => setFormData({ ...formData, contract_value_cents: e.target.value })}
          placeholder="0.00"
        />
      </div>
      <div>
        <Label htmlFor="payment_terms">Payment Terms</Label>
        <Input
          id="payment_terms"
          value={formData.payment_terms}
          onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
          placeholder="e.g., Net 30"
        />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes about this vendor..."
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Vendors</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Contract Value</p>
                <p className="text-2xl font-bold">
                  ${(stats.totalContractValue / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {VENDOR_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vendor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Vendor</DialogTitle>
                </DialogHeader>
                {renderVendorForm()}
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                  <Button onClick={handleAddVendor} disabled={!formData.name.trim()}>Add Vendor</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Vendors Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {vendors.length === 0 ? 'No vendors yet' : 'No vendors match your filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {vendors.length === 0
                  ? 'Add your first vendor to start tracking partnerships.'
                  : 'Try adjusting your search or filters.'}
              </p>
              {vendors.length === 0 && (
                <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Vendor
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contract Value</TableHead>
                  <TableHead>Contract End</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor) => (
                  <TableRow
                    key={vendor.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openVendorDetail(vendor)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{vendor.name}</p>
                        {vendor.website && (
                          <p className="text-xs text-muted-foreground">{vendor.website}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{CATEGORY_LABELS[vendor.category] || vendor.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {vendor.contact_name && <p>{vendor.contact_name}</p>}
                        {vendor.contact_email && (
                          <p className="text-muted-foreground text-xs">{vendor.contact_email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[vendor.status] || 'bg-gray-100 text-gray-800'}>
                        {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {vendor.contract_value_cents
                        ? `$${(vendor.contract_value_cents / 100).toLocaleString()}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {vendor.contract_end_date
                        ? format(new Date(vendor.contract_end_date), 'MMM d, yyyy')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openVendorDetail(vendor); }}>
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openVendorDetail(vendor); setEditMode(true); }}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => { e.stopPropagation(); handleDeleteVendor(vendor.id); }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Vendor Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={(open) => { setShowDetailDialog(open); if (!open) setEditMode(false); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {selectedVendor?.name}
              </DialogTitle>
              <div className="flex gap-2">
                {!editMode ? (
                  <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleUpdateVendor}>Save Changes</Button>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          {selectedVendor && (
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="notes">Notes & Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4">
                {editMode ? (
                  renderVendorForm()
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_COLORS[selectedVendor.status]}>
                        {selectedVendor.status.charAt(0).toUpperCase() + selectedVendor.status.slice(1)}
                      </Badge>
                      <Badge variant="outline">{CATEGORY_LABELS[selectedVendor.category]}</Badge>
                    </div>

                    {/* Contact Info */}
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-3">CONTACT INFORMATION</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedVendor.contact_name && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{selectedVendor.contact_name}</span>
                          </div>
                        )}
                        {selectedVendor.contact_email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a href={`mailto:${selectedVendor.contact_email}`} className="text-blue-600 hover:underline">
                              {selectedVendor.contact_email}
                            </a>
                          </div>
                        )}
                        {selectedVendor.contact_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{selectedVendor.contact_phone}</span>
                          </div>
                        )}
                        {selectedVendor.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <a href={selectedVendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {selectedVendor.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Address */}
                    {(selectedVendor.address || selectedVendor.city) && (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-3">ADDRESS</h4>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            {selectedVendor.address && <p>{selectedVendor.address}</p>}
                            <p>
                              {[selectedVendor.city, selectedVendor.state, selectedVendor.zip_code].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contract Details */}
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-3">CONTRACT DETAILS</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedVendor.contract_start_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Start: {format(new Date(selectedVendor.contract_start_date), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                        {selectedVendor.contract_end_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>End: {format(new Date(selectedVendor.contract_end_date), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                        {selectedVendor.contract_value_cents && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span>Value: ${(selectedVendor.contract_value_cents / 100).toLocaleString()}</span>
                          </div>
                        )}
                        {selectedVendor.payment_terms && (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>Terms: {selectedVendor.payment_terms}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {selectedVendor.notes && (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-3">NOTES</h4>
                        <p className="text-sm">{selectedVendor.notes}</p>
                      </div>
                    )}

                    <div className="pt-4 border-t text-xs text-muted-foreground">
                      Created: {format(new Date(selectedVendor.created_at), 'MMM d, yyyy h:mm a')}
                      {selectedVendor.updated_at !== selectedVendor.created_at && (
                        <> · Updated: {format(new Date(selectedVendor.updated_at), 'MMM d, yyyy h:mm a')}</>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notes" className="mt-4">
                <div className="space-y-4">
                  {/* Add Note */}
                  <Card>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Select value={newNoteType} onValueChange={setNewNoteType}>
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(NOTE_TYPE_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Textarea
                          placeholder="Add a note about this vendor interaction..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          rows={3}
                        />
                        <div className="flex justify-end">
                          <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim()}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Add Note
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notes List */}
                  {vendorNotes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notes yet. Add your first note above.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {vendorNotes.map((note) => (
                        <Card key={note.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-2">
                              <Badge variant="outline" className="text-xs">
                                {NOTE_TYPE_LABELS[note.note_type] || note.note_type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorManagement;
