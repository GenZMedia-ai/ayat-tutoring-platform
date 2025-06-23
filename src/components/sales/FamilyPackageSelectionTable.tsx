
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface StudentPackageSelection {
  student_id: string;
  student_name: string;
  student_age: number;
  package_id?: string;
  custom_price?: number;
  use_custom_price: boolean;
}

interface FamilyPackageSelectionTableProps {
  selections: StudentPackageSelection[];
  packages: any[];
  currencies: any[];
  selectedCurrency: any;
  onCurrencySelect: (currency: any) => void;
  onUpdateSelection: (studentId: string, field: keyof StudentPackageSelection, value: any) => void;
  onSaveSelection: (studentId: string, packageId: string, customPrice?: number, currency?: string) => Promise<boolean>;
  currencyLocked: boolean;
  totalAmount: number;
}

export const FamilyPackageSelectionTable: React.FC<FamilyPackageSelectionTableProps> = ({
  selections,
  packages,
  currencies,
  selectedCurrency,
  onCurrencySelect,
  onUpdateSelection,
  onSaveSelection,
  currencyLocked,
  totalAmount
}) => {
  const handlePackageChange = async (studentId: string, packageId: string) => {
    onUpdateSelection(studentId, 'package_id', packageId);
    
    // Auto-save when package is selected
    const selection = selections.find(s => s.student_id === studentId);
    if (selection && selectedCurrency) {
      const customPrice = selection.use_custom_price ? selection.custom_price : undefined;
      await onSaveSelection(studentId, packageId, customPrice, selectedCurrency.code);
    }
  };

  const handleCustomPriceToggle = async (studentId: string, useCustom: boolean) => {
    onUpdateSelection(studentId, 'use_custom_price', useCustom);
    
    // Auto-save when toggling custom price
    const selection = selections.find(s => s.student_id === studentId);
    if (selection?.package_id && selectedCurrency) {
      const customPrice = useCustom ? selection.custom_price : undefined;
      await onSaveSelection(studentId, selection.package_id, customPrice, selectedCurrency.code);
    }
  };

  const handleCustomPriceChange = async (studentId: string, price: string) => {
    const numPrice = parseInt(price) || undefined;
    onUpdateSelection(studentId, 'custom_price', numPrice);
    
    // Auto-save when custom price changes
    const selection = selections.find(s => s.student_id === studentId);
    if (selection?.package_id && selectedCurrency && numPrice) {
      await onSaveSelection(studentId, selection.package_id, numPrice, selectedCurrency.code);
    }
  };

  const getDisplayPrice = (selection: StudentPackageSelection) => {
    if (!selection.package_id) return '-';
    
    if (selection.use_custom_price && selection.custom_price) {
      return selection.custom_price;
    }
    
    const selectedPackage = packages.find(p => p.id === selection.package_id);
    return selectedPackage?.price || '-';
  };

  const getSelectionStatus = (selection: StudentPackageSelection) => {
    if (!selection.package_id) return 'incomplete';
    return 'complete';
  };

  return (
    <div className="space-y-4">
      {/* Currency Selection - Only show if not locked */}
      {!currencyLocked && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Label className="text-sm font-medium text-blue-800">
            Family Currency (will be locked after first selection)
          </Label>
          <Select 
            value={selectedCurrency?.code || ''} 
            onValueChange={(code) => {
              const currency = currencies.find(c => c.code === code);
              onCurrencySelect(currency);
            }}
          >
            <SelectTrigger className="w-[200px] mt-2">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.name} ({currency.symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Package Selection Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Custom Price</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selections.map((selection) => (
              <TableRow key={selection.student_id}>
                <TableCell className="font-medium">
                  {selection.student_name}
                </TableCell>
                <TableCell>{selection.student_age}</TableCell>
                <TableCell>
                  <Select
                    value={selection.package_id || ''}
                    onValueChange={(packageId) => handlePackageChange(selection.student_id, packageId)}
                    disabled={!selectedCurrency}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select package" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.name} ({pkg.session_count} sessions)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={selection.use_custom_price}
                      onCheckedChange={(checked) => handleCustomPriceToggle(selection.student_id, checked)}
                      disabled={!selection.package_id}
                    />
                    {selection.use_custom_price && (
                      <Input
                        type="number"
                        placeholder="Price"
                        value={selection.custom_price || ''}
                        onChange={(e) => handleCustomPriceChange(selection.student_id, e.target.value)}
                        className="w-24"
                        min="1"
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">
                    {selectedCurrency?.symbol}{getDisplayPrice(selection)}
                  </span>
                </TableCell>
                <TableCell>
                  {getSelectionStatus(selection) === 'complete' ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <Check className="h-3 w-3 mr-1" />
                      Complete
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-orange-200 text-orange-800">
                      <X className="h-3 w-3 mr-1" />
                      Incomplete
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Total Summary */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-medium text-green-800">Payment Total</h4>
            <p className="text-sm text-green-600">
              {selections.length} students • {selectedCurrency?.name || 'No currency selected'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-800">
              {selectedCurrency?.symbol || ''}{totalAmount}
            </div>
            <div className="text-sm text-green-600">
              Total Amount
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
