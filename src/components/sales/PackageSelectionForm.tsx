
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

interface PackageSelectionFormProps {
  packages: any[];
  selectedPackage: any;
  onPackageSelect: (pkg: any) => void;
  currencies: any[];
  selectedCurrency: any;
  onCurrencySelect: (currency: any) => void;
}

export const PackageSelectionForm: React.FC<PackageSelectionFormProps> = ({
  packages,
  selectedPackage,
  onPackageSelect,
  currencies,
  selectedCurrency,
  onCurrencySelect
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Select Package</Label>
        <Select
          value={selectedPackage?.id || ''}
          onValueChange={(value) => {
            const pkg = packages.find(p => p.id === value);
            onPackageSelect(pkg);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a package..." />
          </SelectTrigger>
          <SelectContent>
            {packages.map((pkg) => (
              <SelectItem key={pkg.id} value={pkg.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{pkg.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {pkg.session_count} sessions • Base price: {pkg.price}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedPackage && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Package Details</h4>
            <div className="space-y-1 text-sm">
              <div><span className="font-medium">Name:</span> {selectedPackage.name}</div>
              <div><span className="font-medium">Description:</span> {selectedPackage.description}</div>
              <div><span className="font-medium">Sessions:</span> {selectedPackage.session_count}</div>
              <div><span className="font-medium">Base Price:</span> {selectedPackage.price}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <Label>Select Currency</Label>
        <Select
          value={selectedCurrency?.id || ''}
          onValueChange={(value) => {
            const currency = currencies.find(c => c.id === value);
            onCurrencySelect(currency);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose currency..." />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((currency) => (
              <SelectItem key={currency.id} value={currency.id}>
                {currency.name} ({currency.symbol}) - {currency.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
