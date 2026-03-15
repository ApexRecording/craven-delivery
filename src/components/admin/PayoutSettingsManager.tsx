import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Save, Clock, Navigation, TrendingUp } from 'lucide-react';

type PayoutFrameworkSettings = {
  percentage: number;
  base_offer_cents: number;
  per_mile_cents: number;
  wait_pay_grace_minutes: number;
  wait_pay_per_minute_cents: number;
  escalation_interval_minutes: number;
  escalation_sequence_cents: number[];
  max_offer_cents: number | null;
};

const defaultSettings: PayoutFrameworkSettings = {
  percentage: 70,
  base_offer_cents: 350,
  per_mile_cents: 100,
  wait_pay_grace_minutes: 10,
  wait_pay_per_minute_cents: 100,
  escalation_interval_minutes: 2,
  escalation_sequence_cents: [100, 125, 125, 150],
  max_offer_cents: null,
};

export const PayoutSettingsManager: React.FC = () => {
  const [settings, setSettings] = useState<PayoutFrameworkSettings>(defaultSettings);
  const [sequenceInput, setSequenceInput] = useState<string>('1.00, 1.25, 1.25, 1.50');
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const centsToDollars = (cents: number) => (cents / 100).toFixed(2);
  const dollarsToCents = (value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return Math.round(parsed * 100);
  };

  const parseSequenceToCents = (input: string): number[] => {
    const values = input
      .split(',')
      .map((part) => Number(part.trim()))
      .filter((value) => Number.isFinite(value) && value >= 0)
      .map((value) => Math.round(value * 100));

    return values.length ? values : defaultSettings.escalation_sequence_cents;
  };

  const fetchCurrent = async () => {
    const { data, error } = await supabase
      .from('driver_payout_settings')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (!error && data) {
      const framework = data as Record<string, unknown>;
      const next: PayoutFrameworkSettings = {
        percentage: Number(framework.percentage ?? defaultSettings.percentage),
        base_offer_cents: Number(framework.base_offer_cents ?? defaultSettings.base_offer_cents),
        per_mile_cents: Number(framework.per_mile_cents ?? defaultSettings.per_mile_cents),
        wait_pay_grace_minutes: Number(framework.wait_pay_grace_minutes ?? defaultSettings.wait_pay_grace_minutes),
        wait_pay_per_minute_cents: Number(framework.wait_pay_per_minute_cents ?? defaultSettings.wait_pay_per_minute_cents),
        escalation_interval_minutes: Number(framework.escalation_interval_minutes ?? defaultSettings.escalation_interval_minutes),
        escalation_sequence_cents: Array.isArray(framework.escalation_sequence_cents) && framework.escalation_sequence_cents.length
          ? framework.escalation_sequence_cents.map((value: unknown) => Number(value))
          : defaultSettings.escalation_sequence_cents,
        max_offer_cents: framework.max_offer_cents == null ? null : Number(framework.max_offer_cents),
      };

      setSettings(next);
      setSequenceInput(next.escalation_sequence_cents.map((value) => (value / 100).toFixed(2)).join(', '));
    }
  };

  useEffect(() => {
    fetchCurrent();
  }, []);

  const save = async () => {
    try {
      setLoading(true);
      // Deactivate existing active row and insert a new one to keep history
      const { data: userData } = await supabase.auth.getUser();

      const escalationSequence = parseSequenceToCents(sequenceInput);
      const payload = {
        percentage: settings.percentage,
        base_offer_cents: settings.base_offer_cents,
        per_mile_cents: settings.per_mile_cents,
        wait_pay_grace_minutes: settings.wait_pay_grace_minutes,
        wait_pay_per_minute_cents: settings.wait_pay_per_minute_cents,
        escalation_interval_minutes: settings.escalation_interval_minutes,
        escalation_sequence_cents: escalationSequence,
        max_offer_cents: settings.max_offer_cents,
        is_active: true,
        updated_by: userData?.user?.id || null,
      };

      await supabase.from('driver_payout_settings').update({ is_active: false }).eq('is_active', true);
      const { error } = await supabase.from('driver_payout_settings').insert(payload as never);
      if (error) throw error;
      toast({
        title: 'Payout framework updated',
        description: `Base $${centsToDollars(settings.base_offer_cents)} + $${centsToDollars(settings.per_mile_cents)}/mile, full tips, dynamic escalation, and wait pay are now active.`,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      toast({ title: 'Save failed', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Driver Payout Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label className="mb-2 block flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Base offer ($)
            </Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={centsToDollars(settings.base_offer_cents)}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, base_offer_cents: dollarsToCents(e.target.value) }))
              }
            />
          </div>

          <div>
            <Label className="mb-2 block flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              Per-mile pay ($/mile)
            </Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={centsToDollars(settings.per_mile_cents)}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, per_mile_cents: dollarsToCents(e.target.value) }))
              }
            />
          </div>

          <div>
            <Label className="mb-2 block flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Wait-pay grace period (minutes)
            </Label>
            <Input
              type="number"
              min={0}
              step="1"
              value={settings.wait_pay_grace_minutes}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  wait_pay_grace_minutes: Math.max(0, Number(e.target.value) || 0),
                }))
              }
            />
          </div>

          <div>
            <Label className="mb-2 block">Wait pay after grace ($/minute)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={centsToDollars(settings.wait_pay_per_minute_cents)}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, wait_pay_per_minute_cents: dollarsToCents(e.target.value) }))
              }
            />
          </div>

          <div>
            <Label className="mb-2 block flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Escalation interval (minutes)
            </Label>
            <Input
              type="number"
              min={1}
              step="1"
              value={settings.escalation_interval_minutes}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  escalation_interval_minutes: Math.max(1, Number(e.target.value) || 1),
                }))
              }
            />
          </div>

          <div>
            <Label className="mb-2 block">Maximum offer cap ($, optional)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="Leave blank for no cap"
              value={settings.max_offer_cents == null ? '' : centsToDollars(settings.max_offer_cents)}
              onChange={(e) => {
                const raw = e.target.value.trim();
                setSettings((prev) => ({ ...prev, max_offer_cents: raw === '' ? null : dollarsToCents(raw) }));
              }}
            />
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Escalation sequence ($ increments, comma-separated)</Label>
          <Input
            value={sequenceInput}
            onChange={(e) => setSequenceInput(e.target.value)}
            placeholder="1.00, 1.25, 1.25, 1.50"
          />
          <p className="text-sm text-muted-foreground mt-2">
            Driver offer formula: Base + (Per-mile × distance) + 100% tip. If declined, payout increases using this sequence.
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={loading} className="gap-2">
            <Save className="h-4 w-4" /> Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PayoutSettingsManager;
