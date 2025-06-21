
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, Timer } from 'lucide-react';
import { toast } from 'sonner';

interface Package {
  id: string;
  name: string;
  sessionCount: number;
  price: number;
}

interface PaymentLinkGeneratorProps {
  packages: Package[];
  onGenerateLink: (data: PaymentLinkData) => Promise<string>;
  isGenerating: boolean;
}

interface PaymentLinkData {
  packageId: string;
  currency: string;
  customPrice?: number;
  studentIds: string[];
  expiryHours: number;
}

const PaymentLinkGenerator: React.FC<PaymentLinkGeneratorProps> = ({
  packages,
  onGenerateLink,
  isGenerating
}) => {
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [currency, setCurrency] = useState<string>('usd');
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [customPrice, setCustomPrice] = useState<string>('');
  const [expiryHours, setExpiryHours] = useState<string>('48');
  const [generatedLink, setGeneratedLink] = useState<string>('');

  const currencies = [
    { code: 'usd', name: 'US Dollar', symbol: '$' },
    { code: 'eur', name: 'Euro', symbol: '€' },
    { code: 'gbp', name: 'British Pound', symbol: '£' },
    { code: 'aed', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'sar', name: 'Saudi Riyal', symbol: 'ر.س' }
  ];

  const selectedPackageData = packages.find(p => p.id === selectedPackage);
  const selectedCurrency = currencies.find(c => c.code === currency);

  const handleGenerateLink = async () => {
    if (!selectedPackage) {
      toast.error('Please select a package');
      return;
    }

    const linkData: PaymentLinkData = {
      packageId: selectedPackage,
      currency,
      customPrice: useCustomPrice ? parseFloat(customPrice) : undefined,
      studentIds: [], // This would be populated with actual student IDs
      expiryHours: parseInt(expiryHours)
    };

    try {
      const link = await onGenerateLink(linkData);
      setGeneratedLink(link);
      toast.success('Payment link generated successfully!');
    } catch (error) {
      toast.error('Failed to generate payment link');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('Link copied to clipboard!');
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(
      `Hello! Here's your payment link for the English learning package:\n\n${generatedLink}\n\nThis link expires in ${expiryHours} hours. Please complete your payment to secure your sessions.`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="w-5 h-5" />
          Payment Link Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="package">Package Selection</Label>
          <Select value={selectedPackage} onValueChange={setSelectedPackage}>
            <SelectTrigger>
              <SelectValue placeholder="Select a package" />
            </SelectTrigger>
            <SelectContent>
              {packages.map((pkg) => (
                <SelectItem key={pkg.id} value={pkg.id}>
                  {pkg.name} ({pkg.sessionCount} sessions)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((curr) => (
                <SelectItem key={curr.code} value={curr.code}>
                  {curr.symbol} {curr.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="custom-price">Use Custom Price</Label>
            <Switch
              checked={useCustomPrice}
              onCheckedChange={setUseCustomPrice}
            />
          </div>
          
          {useCustomPrice && (
            <div className="space-y-2">
              <Input
                id="custom-price"
                type="number"
                placeholder="Enter custom price"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
              />
            </div>
          )}

          {!useCustomPrice && selectedPackageData && selectedCurrency && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-muted-foreground">Standard Price</div>
              <div className="text-lg font-semibold">
                {selectedCurrency.symbol}{selectedPackageData.price}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiry">Link Expiry (Hours)</Label>
          <Select value={expiryHours} onValueChange={setExpiryHours}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24">24 hours</SelectItem>
              <SelectItem value="48">48 hours</SelectItem>
              <SelectItem value="72">72 hours</SelectItem>
              <SelectItem value="168">1 week</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleGenerateLink}
          disabled={isGenerating || !selectedPackage}
          className="w-full ayat-button-primary"
        >
          {isGenerating ? 'Generating...' : 'Generate Payment Link'}
        </Button>

        {generatedLink && (
          <div className="space-y-3 p-4 border border-border rounded-lg bg-green-50">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">Link Generated</Badge>
              <Badge variant="outline" className="gap-1">
                <Timer className="w-3 h-3" />
                Expires in {expiryHours}h
              </Badge>
            </div>
            
            <div className="break-all text-sm bg-white p-2 rounded border">
              {generatedLink}
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={copyToClipboard}
                className="gap-1"
              >
                <Copy className="w-3 h-3" />
                Copy
              </Button>
              <Button
                size="sm"
                className="ayat-button-primary gap-1"
                onClick={shareViaWhatsApp}
              >
                <ExternalLink className="w-3 h-3" />
                Share via WhatsApp
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentLinkGenerator;
