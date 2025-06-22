
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus } from 'lucide-react';
import { useCurrencyManagement } from '@/hooks/useCurrencyManagement';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export const CurrencyManagementTab: React.FC = () => {
  const { currencies, loading, updateCurrencyStatus, createCurrency } = useCurrencyManagement();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createCurrency({
        ...formData,
        is_enabled: true
      });
      
      setFormData({ code: '', name: '', symbol: '' });
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating currency:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading currencies...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Currency Management</h3>
          <p className="text-sm text-muted-foreground">Manage available currencies for payment processing</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Currency
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Currency</DialogTitle>
              <DialogDescription>
                Add a new currency for payment processing.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Currency Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="USD"
                  maxLength={3}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Currency Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="US Dollar"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="symbol">Currency Symbol</Label>
                <Input
                  id="symbol"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  placeholder="$"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Add Currency
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {currencies.map((currency) => (
          <Card key={currency.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{currency.name} ({currency.symbol})</h4>
                    <Badge variant={currency.is_enabled ? "default" : "secondary"}>
                      {currency.is_enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{currency.code}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={currency.is_enabled}
                    onCheckedChange={(checked) => updateCurrencyStatus(currency.id, checked)}
                  />
                  <Label className="text-sm">Enabled</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {currencies.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No currencies configured yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Add currencies to enable payment processing.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
