
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface CustomPriceFormProps {
  customPrice: string;
  onPriceChange: (price: string) => void;
  currency: any;
}

export const CustomPriceForm: React.FC<CustomPriceFormProps> = ({
  customPrice,
  onPriceChange,
  currency
}) => {
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-orange-800">Custom Negotiated Price</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-price-input">
              Amount {currency ? `(${currency.symbol})` : ''}
            </Label>
            <Input
              id="custom-price-input"
              type="number"
              value={customPrice}
              onChange={(e) => onPriceChange(e.target.value)}
              placeholder="Enter negotiated amount"
              className="border-orange-300 focus:border-orange-500"
            />
          </div>
          <p className="text-xs text-orange-700">
            Use this only when you've negotiated a different price with the customer.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
