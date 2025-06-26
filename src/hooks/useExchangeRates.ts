
import { useState, useEffect } from 'react';

interface ExchangeRates {
  [currency: string]: number;
}

export const useExchangeRates = () => {
  const [rates, setRates] = useState<ExchangeRates>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Static rates with proper fallbacks
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
    const fetchRates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API call with timeout
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setRates(staticRates);
        setLastUpdated(new Date());
        console.log('Exchange rates loaded:', staticRates);
      } catch (err) {
        console.error('Failed to fetch exchange rates:', err);
        setError('Failed to load exchange rates');
        // Use static rates as fallback
        setRates(staticRates);
        setLastUpdated(new Date());
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  // Stable conversion function that doesn't depend on loading state
  const convertToUSD = (amount: number, fromCurrency: string): number => {
    if (!amount || amount === 0) return 0;
    
    const currency = fromCurrency.toUpperCase();
    console.log(`Converting ${amount} ${currency} to USD`);
    
    if (currency === 'USD') return amount;
    
    // Use current rates or fallback to static rates
    const currentRates = Object.keys(rates).length > 0 ? rates : staticRates;
    const rate = currentRates[currency];
    
    if (!rate) {
      console.warn(`No exchange rate found for ${currency}, using original amount`);
      return amount;
    }
    
    const converted = amount / rate;
    console.log(`Converted ${amount} ${currency} = ${converted} USD (rate: ${rate})`);
    return converted;
  };

  return {
    rates: Object.keys(rates).length > 0 ? rates : staticRates,
    loading,
    error,
    lastUpdated,
    convertToUSD
  };
};
