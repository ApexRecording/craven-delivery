import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  MessageSquare,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  category: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  address: string | null;
  status: string;
  notes: string | null;
  contract_start: string | null;
  contract_end: string | null;
  created_at: string;
}

interface VendorInteraction {
  id: string;
  vendor_id: string;
  interaction_type: string;
  summary: string;
  outcome: string | null;
  next_steps: string | null;
  occurred_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  prospect: 'bg-blue-100 text-blue-800',
  inactive: 'bg-gray-100 text-gray-800',
  former: 'bg-red-100 text-red-800',
};

const CATEGORIES = [
  'Technology',
  'Logistics',
  'Food & Beverage',
  'Marketing',
  'Finance',
  'Legal',
  'Operations',
  'Other',
];

const INTERACTION_TYPES = [
  'meeting',
  'call',
  'email',
  'negotiation',
  'contract',
  'review',
  'other',
];

const emptyVendor = {
  name: '',
  category: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  website: '',
  address: '',
  status: 'active',
  notes: '',
  contract_start: '',
  contract_end: '',
};

const emptyInteraction = {
  interaction_type: 'meeting',
  summary: '',
  outcome: '',
  next_steps: '',
  occurred_at: new Date().toISOString().slice(0, 16),
};

const VendorManagement: React.FC = () => {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [interactions, setInteractions] = useState<Record<string, VendorInteraction[]>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);

  const [vendorForm, setVendorForm] = useState({ ...emptyVendor });
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  const [interactionForm, setInteractionForm] = useState({ ...emptyInteraction });
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
  const [activeVendorForInteraction, setActiveVendorForInteraction] = useState<string | null>(null);

  const fetchVendors = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('vendors')
      .select('*')
      .order('name');

    if (error) {
      toast({ title: 'Error', description: 'Failed to load vendors.', variant: 'destructive' });
    } else {
      setVendors(data ?? []);
    }
    setLoading(false);
  };

  const fetchInteractions = async (vendorId: string) => {
    const { data, error } = await (supabase as any)
      .from('vendor_interactions')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('occurred_at', { ascending: false });

    if (!error) {
      setInteractions(prev => ({ ...prev, [vendorId]: data ?? [] }));
    }
  };

  useEffect(() => { fetchVendors(); }, []);

  const handleToggleExpand = (vendorId: string) => {
    if (expandedVendor === vendorId) {
      setExpandedVendor(null);
    } else {
      setExpandedVendor(vendorId);
      if (!interactions[vendorId]) fetchInteractions(vendorId);
    }
  };

  const openCreateVendor = () => {
    setEditingVendor(null);
    setVendorForm({ ...emptyVendor });
    setVendorDialogOpen(true);
  };

  const openEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setVendorForm({
      name: vendor.name,
      category: vendor.category,
      contact_name: vendor.contact_name ?? '',
      contact_email: vendor.contact_email ?? '',
      contact_phone: vendor.contact_phone ?? '',
      website: vendor.website ?? '',
      address: vendor.address ?? '',
      status: vendor.status,
      notes: vendor.notes ?? '',
      contract_start: vendor.contract_start ?? '',
      contract_end: vendor.contract_end ?? '',
    });
    setVendorDialogOpen(true);
  };

  const handleSaveVendor = async () => {
    if (!vendorForm.name || !vendorForm.category) {
      toast({ title: 'Validation', description: 'Name and category are required.', variant: 'destructive' });
      return;
    }

    const payload = {
      name: vendorForm.name,
      category: vendorForm.category,
      contact_name: vendorForm.contact_name || null,
      contact_email: vendorForm.contact_email || null,
      contact_phone: vendorForm.contact_phone || null,
      website: vendorForm.website || null,
      address: vendorForm.address || null,
      status: vendorForm.status,
      notes: vendorForm.notes || null,
      contract_start: vendorForm.contract_start || null,
      contract_end: vendorForm.contract_end || null,
    };

    let error;
    if (editingVendor) {
      ({ error } = await (supabase as any).from('vendors').update(payload).eq('id', editingVendor.id));
    } else {
      ({ error } = await (supabase as any).from('vendors').insert(payload));
    }

    if (error) {
      toast({ title: 'Error', description: 'Failed to save vendor.', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: editingVendor ? 'Vendor updated.' : 'Vendor added.' });
      setVendorDialogOpen(false);
      fetchVendors();
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (!window.confirm('Delete this vendor and all its interaction history?')) return;
    const { error } = await (supabase as any).from('vendors').delete().eq('id', vendorId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete vendor.', variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Vendor removed.' });
      fetchVendors();
    }
  };

  const openAddInteraction = (vendorId: string) => {
    setActiveVendorForInteraction(vendorId);
    setInteractionForm({ ...emptyInteraction, occurred_at: new Date().toISOString().slice(0, 16) });
    setInteractionDialogOpen(true);
  };

  const handleSaveInteraction = async () => {
    if (!activeVendorForInteraction || !interactionForm.summary) {
      toast({ title: 'Validation', description: 'Summary is required.', variant: 'destructive' });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      vendor_id: activeVendorForInteraction,
      user_id: user?.id ?? null,
      interaction_type: interactionForm.interaction_type,
      summary: interactionForm.summary,
      outcome: interactionForm.outcome || null,
      next_steps: interactionForm.next_steps || null,
      occurred_at: interactionForm.occurred_at,
    };

    const { error } = await (supabase as any).from('vendor_interactions').insert(payload);

    if (error) {
      toast({ title: 'Error', description: 'Failed to log interaction.', variant: 'destructive' });
    } else {
      toast({ title: 'Logged', description: 'Interaction recorded.' });
      setInteractionDialogOpen(false);
      fetchInteractions(activeVendorForInteraction);
    }
  };

  const filtered = vendors.filter(v => {
    const matchesSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.contact_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      v.category.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header / controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors…"
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="former">Former</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={openCreateVendor} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['active', 'prospect', 'inactive', 'former'] as const).map(s => (
          <Card key={s} className="text-center py-3">
            <p className="text-2xl font-bold">{vendors.filter(v => v.status === s).length}</p>
            <p className="text-xs text-muted-foreground capitalize">{s}</p>
          </Card>
        ))}
      </div>

      {/* Vendor list */}
      {loading ? (
        <p className="text-muted-foreground text-center py-12">Loading vendors…</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No vendors found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(vendor => (
            <Card key={vendor.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{vendor.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{vendor.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={STATUS_COLORS[vendor.status] ?? ''}>
                      {vendor.status}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEditVendor(vendor)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteVendor(vendor.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleToggleExpand(vendor.id)}>
                      {expandedVendor === vendor.id
                        ? <ChevronUp className="h-4 w-4" />
                        : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Contact row */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                  {vendor.contact_name && <span className="font-medium text-foreground">{vendor.contact_name}</span>}
                  {vendor.contact_email && (
                    <a href={`mailto:${vendor.contact_email}`} className="flex items-center gap-1 hover:text-primary">
                      <Mail className="h-3 w-3" />{vendor.contact_email}
                    </a>
                  )}
                  {vendor.contact_phone && (
                    <a href={`tel:${vendor.contact_phone}`} className="flex items-center gap-1 hover:text-primary">
                      <Phone className="h-3 w-3" />{vendor.contact_phone}
                    </a>
                  )}
                  {vendor.website && (
                    <a href={vendor.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary">
                      <Globe className="h-3 w-3" />Website
                    </a>
                  )}
                  {vendor.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{vendor.address}
                    </span>
                  )}
                </div>

                {/* Contract dates */}
                {(vendor.contract_start || vendor.contract_end) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Contract: {vendor.contract_start ?? '—'} → {vendor.contract_end ?? 'ongoing'}
                  </p>
                )}
              </CardHeader>

              {/* Expanded: notes + interactions */}
              {expandedVendor === vendor.id && (
                <CardContent className="border-t pt-4 space-y-4">
                  {vendor.notes && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm">{vendor.notes}</p>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Interaction History</p>
                      <Button size="sm" variant="outline" onClick={() => openAddInteraction(vendor.id)}>
                        <Plus className="h-3 w-3 mr-1" />
                        Log Interaction
                      </Button>
                    </div>

                    {(interactions[vendor.id] ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No interactions logged yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {(interactions[vendor.id] ?? []).map(interaction => (
                          <div key={interaction.id} className="border rounded-md p-3 text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <MessageSquare className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium capitalize">{interaction.interaction_type}</span>
                              <span className="text-muted-foreground text-xs ml-auto">
                                {new Date(interaction.occurred_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p>{interaction.summary}</p>
                            {interaction.outcome && (
                              <p className="text-muted-foreground mt-1"><strong>Outcome:</strong> {interaction.outcome}</p>
                            )}
                            {interaction.next_steps && (
                              <p className="text-muted-foreground mt-1"><strong>Next steps:</strong> {interaction.next_steps}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Vendor create/edit dialog */}
      <Dialog open={vendorDialogOpen} onOpenChange={setVendorDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Name *</Label>
                <Input value={vendorForm.name} onChange={e => setVendorForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Category *</Label>
                <Select value={vendorForm.category} onValueChange={v => setVendorForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={vendorForm.status} onValueChange={v => setVendorForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="former">Former</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Contact Name</Label>
                <Input value={vendorForm.contact_name} onChange={e => setVendorForm(f => ({ ...f, contact_name: e.target.value }))} />
              </div>
              <div>
                <Label>Contact Phone</Label>
                <Input value={vendorForm.contact_phone} onChange={e => setVendorForm(f => ({ ...f, contact_phone: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Contact Email</Label>
                <Input type="email" value={vendorForm.contact_email} onChange={e => setVendorForm(f => ({ ...f, contact_email: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Website</Label>
                <Input placeholder="https://…" value={vendorForm.website} onChange={e => setVendorForm(f => ({ ...f, website: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                <Input value={vendorForm.address} onChange={e => setVendorForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div>
                <Label>Contract Start</Label>
                <Input type="date" value={vendorForm.contract_start} onChange={e => setVendorForm(f => ({ ...f, contract_start: e.target.value }))} />
              </div>
              <div>
                <Label>Contract End</Label>
                <Input type="date" value={vendorForm.contract_end} onChange={e => setVendorForm(f => ({ ...f, contract_end: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Textarea rows={3} value={vendorForm.notes} onChange={e => setVendorForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setVendorDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveVendor}>{editingVendor ? 'Save Changes' : 'Add Vendor'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Interaction log dialog */}
      <Dialog open={interactionDialogOpen} onOpenChange={setInteractionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Interaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select
                value={interactionForm.interaction_type}
                onValueChange={v => setInteractionForm(f => ({ ...f, interaction_type: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INTERACTION_TYPES.map(t => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date &amp; Time</Label>
              <Input
                type="datetime-local"
                value={interactionForm.occurred_at}
                onChange={e => setInteractionForm(f => ({ ...f, occurred_at: e.target.value }))}
              />
            </div>
            <div>
              <Label>Summary *</Label>
              <Textarea
                rows={3}
                placeholder="What was discussed?"
                value={interactionForm.summary}
                onChange={e => setInteractionForm(f => ({ ...f, summary: e.target.value }))}
              />
            </div>
            <div>
              <Label>Outcome</Label>
              <Input
                placeholder="Result or agreement reached"
                value={interactionForm.outcome}
                onChange={e => setInteractionForm(f => ({ ...f, outcome: e.target.value }))}
              />
            </div>
            <div>
              <Label>Next Steps</Label>
              <Input
                placeholder="Follow-up actions"
                value={interactionForm.next_steps}
                onChange={e => setInteractionForm(f => ({ ...f, next_steps: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setInteractionDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveInteraction}>Log Interaction</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorManagement;
