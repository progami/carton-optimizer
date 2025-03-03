// src/hooks/useCostCalculation.ts
import { useState, useEffect } from 'react';
import { calculateCostComponents } from '../utils/calculators';
import { useCarton, useCostConfig } from '../contexts/CartonContext';

export const useCostCalculation = () => {
  const { candidateCartons } = useCarton();
  const { costConfig } = useCostConfig();
  const [selectedCartonId, setSelectedCartonId] = useState(3);
  const [analysisResults, setAnalysisResults] = useState(null);

  useEffect(() => {
    const results = calculateCostComponents(
      costConfig.totalDemand,
      selectedCartonId,
      selectedCartonId,
      candidateCartons,
      costConfig
    );
    setAnalysisResults(results);
  }, [costConfig.totalDemand, selectedCartonId, costConfig, candidateCartons]);

  return {
    analysisResults,
    selectedCartonId,
    setSelectedCartonId
  };
};
