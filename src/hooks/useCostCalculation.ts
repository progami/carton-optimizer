// src/hooks/useCostCalculation.ts
import { useState, useEffect } from 'react';
import { calculateCostComponents } from '../utils/calculators';
import { useCarton, useCostConfig } from '../contexts/CartonContext';

export const useCostCalculation = () => {
  const { candidateCartons, getSelectedCartonId } = useCarton();
  const { costConfig } = useCostConfig();
  const [selectedCartonId, setSelectedCartonId] = useState(3); // Default to ID 3 as a fallback
  const [analysisResults, setAnalysisResults] = useState(null);
  
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
      setAnalysisResults(results);
    }
  }, [costConfig, selectedCartonId, candidateCartons]);

  return {
    analysisResults,
    selectedCartonId,
    setSelectedCartonId
  };
};