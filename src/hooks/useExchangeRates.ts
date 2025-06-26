
import { useState, useEffect } from 'react';

interface ExchangeRates {
  [currency: string]: number;
}

export const useExchangeRates = () => {
  const [rates, setRates] = useState<ExchangeRates>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // For now, using static rates - in production, integrate with exchange rate API
  const staticRates: ExchangeRates = {
    USD: 1.00,
    EUR: 0.85,
    GBP: 0.73,
    EGP: 30.50,
    AED: 3.67,
    SAR: 3.75,
    QAR: 3.64,
    KWD: 0.31,
    BHD: 0.38
  };

  useEffect(() => {
    // Simulate API call
    const fetchRates = async () => {
      setLoading(true);
      // In production, fetch from exchange rate API
      await new Promise(resolve => setTimeout(resolve, 500));
      setRates(staticRates);
      setLastUpdated(new Date());
      setLoading(false);
    };

    fetchRates();
    // Update rates every hour in production
    const interval = setInterval(fetchRates, 3600000);
    return () => clearInterval(interval);
  }, []);

  const convertToUSD = (amount: number, fromCurrency: string): number => {
    if (fromCurrency.toUpperCase() === 'USD') return amount;
    const rate = rates[fromCurrency.toUpperCase()];
    if (!rate) return amount; // Fallback to original amount
    return amount / rate;
  };

  return {
    rates,
    loading,
    lastUpdated,
    convertToUSD
  };
};
