// src/hooks/useCostCalculation.ts
import { useState, useEffect } from 'react';
import { calculateCostComponents } from '../utils/calculators';
import { useCarton, useCostConfig } from '../contexts/CartonContext';

// Define the type based on what calculateCostComponents actually returns
// This matches the error message structure
type CalculationResult = {
  quantity: any; // Using 'any' as shown in the error
  totalCartons: number;
  totalPallets: number;
  cartonCosts: number;
  storageCosts: number;
  palletHandlingCosts: number;
  transportCosts: number;
  totalCost: number;
  costPerUnit: number;
  cartonCostPercentage: number;
  storageCostPercentage: number;
  transportCostPercentage: number;
  // Add any other properties from the actual result
  [key: string]: any; // This allows for additional properties we might not know about
};

export const useCostCalculation = () => {
  const { candidateCartons, getSelectedCartonId } = useCarton();
  const { costConfig } = useCostConfig();
  const [selectedCartonId, setSelectedCartonId] = useState(3); // Default to ID 3 as a fallback
  const [analysisResults, setAnalysisResults] = useState<CalculationResult | null>(null);

  // Update the selected carton ID when a new one is selected
  useEffect(() => {
    const selected = getSelectedCartonId();
    if (selected) {
      setSelectedCartonId(selected);
    }
  }, [getSelectedCartonId]);

  // Calculate results when dependencies change
  useEffect(() => {
    if (selectedCartonId) {
      const results = calculateCostComponents(
        costConfig.totalDemand,
        selectedCartonId,
        selectedCartonId,
        candidateCartons,
        costConfig
      );
      setAnalysisResults(results as CalculationResult);
    }
  }, [costConfig, selectedCartonId, candidateCartons]);

  return {
    analysisResults,
    selectedCartonId,
    setSelectedCartonId
  };
};

export default useCostCalculation;