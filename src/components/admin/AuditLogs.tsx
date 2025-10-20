// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Search, Filter, Download, Calendar, User, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  created_at: string;
  admin_email?: string;
  admin_name?: string;
}

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [dateRange, setDateRange] = useState('7'); // days
  const { toast } = useToast();

  useEffect(() => {
    fetchAuditLogs();
  }, [dateRange]);

  const fetchAuditLogs = async () => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      // Fetch admin names separately
      const formattedLogs = await Promise.all(
        (data || []).map(async (log: any) => {
          const { data: admin } = await supabase
            .from('user_profiles')
            .select('full_name')
            .eq('user_id', log.admin_id)
            .single();
          
          const { data: authUser } = await supabase.auth.admin.getUserById(log.admin_id);
          
          return {
            ...log,
            admin_email: authUser?.user?.email,
            admin_name: admin?.full_name || 'Admin'
          };
        })
      );

      setLogs(formattedLogs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: 'Error loading logs',
        description: 'Failed to load audit logs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const csv = [
        ['Timestamp', 'Admin', 'Action', 'Entity Type', 'Entity ID', 'Details'],
        ...filteredLogs.map(log => [
          format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
          log.admin_name || log.admin_email || 'Unknown',
          log.action,
          log.entity_type,
          log.entity_id,
          JSON.stringify(log.details || {})
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();

      toast({
        title: 'Export successful',
        description: 'Audit logs exported as CSV'
      });
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export audit logs',
        variant: 'destructive'
      });
    }
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      create: 'bg-green-100 text-green-800',
      update: 'bg-blue-100 text-blue-800',
      delete: 'bg-red-100 text-red-800',
      approve: 'bg-green-100 text-green-800',
      reject: 'bg-red-100 text-red-800',
      suspend: 'bg-yellow-100 text-yellow-800',
      ban: 'bg-red-100 text-red-800',
      reinstate: 'bg-green-100 text-green-800',
      refund: 'bg-orange-100 text-orange-800'
    };

    const actionKey = action.split('_')[0];
    const colorClass = colors[actionKey] || 'bg-gray-100 text-gray-800';

    return (
      <Badge className={colorClass}>
        {action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
      </Badge>
    );
  };

  const getEntityBadge = (entityType: string) => {
    const colors: Record<string, string> = {
      customer: 'bg-purple-100 text-purple-800',
      driver: 'bg-orange-100 text-orange-800',
      restaurant: 'bg-blue-100 text-blue-800',
      order: 'bg-green-100 text-green-800',
      refund: 'bg-red-100 text-red-800',
      dispute: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <Badge className={colors[entityType] || 'bg-gray-100 text-gray-800'}>
        {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
      </Badge>
    );
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.admin_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = filterAction === 'all' || log.action.includes(filterAction);
    const matchesEntity = filterEntity === 'all' || log.entity_type === filterEntity;

    return matchesSearch && matchesAction && matchesEntity;
  });

  // Get unique actions and entity types for filters
  const uniqueActions = [...new Set(logs.map(log => log.action.split('_')[0]))];
  const uniqueEntities = [...new Set(logs.map(log => log.entity_type))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Audit Logs</h2>
          <p className="text-muted-foreground">Track all admin actions and system changes</p>
        </div>
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Total Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
            <p className="text-xs text-muted-foreground">In selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-green-500" />
              Active Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {[...new Set(logs.map(log => log.admin_id))].length}
            </div>
            <p className="text-xs text-muted-foreground">Unique administrators</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-500" />
              Entity Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueEntities.length}</div>
            <p className="text-xs text-muted-foreground">Different entities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-500" />
              Today's Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(log => 
                new Date(log.created_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">Actions today</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map(action => (
              <SelectItem key={action} value={action}>
                {action.charAt(0).toUpperCase() + action.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterEntity} onValueChange={setFilterEntity}>
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {uniqueEntities.map(entity => (
              <SelectItem key={entity} value={entity}>
                {entity.charAt(0).toUpperCase() + entity.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Detailed record of all administrative actions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <Activity className="h-8 w-8 animate-pulse text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading audit logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No audit logs found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="border rounded-md p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        {getActionBadge(log.action)}
                        {getEntityBadge(log.entity_type)}
                        <span className="text-sm text-muted-foreground font-mono">
                          ID: {log.entity_id.substring(0, 8)}...
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{log.admin_name || 'Admin'}</span>
                          <span className="text-muted-foreground">({log.admin_email})</span>
                        </div>
                        <div className="text-muted-foreground">
                          {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                        </div>
                      </div>

                      {log.details && Object.keys(log.details).length > 0 && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View details
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogs;
