// src/contexts/CartonContext.tsx
import React, { createContext, useState, useContext } from 'react';

// Define types for our context objects
type CartonType = {
  id: number;
  skuId: string; // Add skuId to the carton type
  length: number;
  width: number;
  height: number;
  unitsPerCarton: number;
  cartonsPerPallet: number;
  isSelected: boolean;
};

// Define a type for SKUs
type SKUType = {
  id: string;
  name: string;
};

type NewCandidateType = {
  skuId?: string;  // Make skuId optional for backward compatibility
  length: number | string;
  width: number | string;
  height: number | string;
  unitsPerCarton: number | string;
  cartonsPerPallet: number | string;
};

// Define provider type - this is key to fixing the error
type ProviderName = 'fmc' | 'vglobal' | '4as';

// Define rate keys type
type ProviderRateKey = 'cartonHandlingCost' | 'cartonUnloadingCost' | 'palletStorageCostPerWeek' | 
                      'palletHandlingCost' | 'ltlCostPerPallet' | 'ftlCostPerTruck' | 'palletsPerTruck';

// Define provider rate structure
type ProviderRate = {
  [key in ProviderRateKey]: number;
};

// Define full provider rates structure
type ProviderRates = {
  [key in ProviderName]: ProviderRate;
};

// Define cost config type
type CostConfigType = {
  provider: ProviderName;
  cartonHandlingCost: number;
  cartonUnloadingCost: number;
  palletStorageCostPerWeek: number;
  storageWeeks: number;
  palletHandlingCost: number;
  ltlCostPerPallet: number;
  ftlCostPerTruck: number;
  palletsPerTruck: number;
  totalDemand: number;
  transportMode: 'auto' | 'ltl' | 'ftl';
  showTotalCosts: boolean;
};

// Define default values with proper function signatures
const CartonContext = createContext<{
  candidateCartons: CartonType[];
  setCandidateCartons: (cartons: CartonType[]) => void;
  toggleCandidateSelection: (id: number) => void;
  getSelectedCartonId: () => number | null;
  handleAddCandidate: (newCandidate: NewCandidateType, editMode: boolean, editCandidateId: number | null) => void;
  handleEditCandidate: (id: number) => NewCandidateType | null;
  handleDeleteCandidate: (id: number) => void;
  // Add these for Part3 compatibility
  skus: SKUType[];
  getOptimalCartonForSku: (skuId: string, quantity: number) => CartonType | null;
}>({
  candidateCartons: [],
  setCandidateCartons: () => {},
  toggleCandidateSelection: () => {},
  getSelectedCartonId: () => null,
  handleAddCandidate: () => {},
  handleEditCandidate: () => null,
  handleDeleteCandidate: () => {},
  // Add default implementations for new properties
  skus: [],
  getOptimalCartonForSku: () => null
});

// Define provider context with proper function signatures
const ProviderContext = createContext<{
  providerRates: ProviderRates;
  setProviderRates: (rates: ProviderRates) => void;
  handleProviderChange: (provider: ProviderName) => void;
  updateProviderRate: (provider: ProviderName, rateKey: ProviderRateKey, value: number) => void;
}>({
  providerRates: {} as ProviderRates,
  setProviderRates: () => {},
  handleProviderChange: () => {},
  updateProviderRate: () => {}
});

// Define cost config context
const CostConfigContext = createContext<{
  costConfig: CostConfigType;
  setCostConfig: (config: CostConfigType | ((prevConfig: CostConfigType) => CostConfigType)) => void;
}>({
  costConfig: {
    provider: 'fmc',
    cartonHandlingCost: 0,
    cartonUnloadingCost: 0,
    palletStorageCostPerWeek: 0,
    storageWeeks: 0,
    palletHandlingCost: 0,
    ltlCostPerPallet: 0,
    ftlCostPerTruck: 0,
    palletsPerTruck: 0,
    totalDemand: 0,
    transportMode: 'auto',
    showTotalCosts: false
  },
  setCostConfig: () => {}
});

export const CartonProvider = ({ children }: { children: React.ReactNode }) => {
  // Create SKUs based on carton SKU IDs
  const defaultSkus: SKUType[] = [
    { id: 'CS 007', name: 'CS 007' },
    { id: 'CS 009', name: 'CS 009' },
    { id: 'CS 011', name: 'CS 011' },
    { id: 'CS 012', name: 'CS 012' },
    { id: 'CS-CDS-001', name: 'CS-CDS-001' },
    { id: 'CS-CDS-002', name: 'CS-CDS-002' },
    { id: 'CS 008', name: 'CS 008' },
    { id: 'CS 010', name: 'CS 010' }
  ];

  const [skus] = useState<SKUType[]>(defaultSkus);

  const [candidateCartons, setCandidateCartons] = useState<CartonType[]>([
    // Default carton configurations based on real data
    { id: 1, skuId: 'CS 007', length: 40, width: 44, height: 52.5, unitsPerCarton: 60, cartonsPerPallet: 18, isSelected: true },
    { id: 2, skuId: 'CS 009', length: 38, width: 44, height: 52.5, unitsPerCarton: 36, cartonsPerPallet: 18, isSelected: false },
    { id: 3, skuId: 'CS 011', length: 41, width: 26, height: 51.5, unitsPerCarton: 24, cartonsPerPallet: 24, isSelected: false },
    { id: 4, skuId: 'CS 012', length: 44, width: 27, height: 51.5, unitsPerCarton: 16, cartonsPerPallet: 24, isSelected: false },
    { id: 5, skuId: 'CS-CDS-001', length: 32, width: 60, height: 53, unitsPerCarton: 33, cartonsPerPallet: 18, isSelected: false },
    { id: 6, skuId: 'CS-CDS-002', length: 32, width: 60, height: 50, unitsPerCarton: 14, cartonsPerPallet: 20, isSelected: false },
    { id: 7, skuId: 'CS 008', length: 40, width: 28, height: 29.5, unitsPerCarton: 60, cartonsPerPallet: 45, isSelected: false },
    { id: 8, skuId: 'CS 010', length: 41, width: 28, height: 39.5, unitsPerCarton: 52, cartonsPerPallet: 40, isSelected: false }
  ]);

  const [providerRates, setProviderRates] = useState<ProviderRates>({
    fmc: {
      cartonHandlingCost: 1.3,
      cartonUnloadingCost: 1.75,
      palletStorageCostPerWeek: 3.9,
      palletHandlingCost: 6.75,
      ltlCostPerPallet: 50,
      ftlCostPerTruck: 500,
      palletsPerTruck: 25
    },
    vglobal: {
      cartonHandlingCost: 1.2,
      cartonUnloadingCost: 1.65,
      palletStorageCostPerWeek: 4.1,
      palletHandlingCost: 7.0,
      ltlCostPerPallet: 48,
      ftlCostPerTruck: 520,
      palletsPerTruck: 26
    },
    '4as': {
      cartonHandlingCost: 1.35,
      cartonUnloadingCost: 1.8,
      palletStorageCostPerWeek: 3.7,
      palletHandlingCost: 6.5,
      ltlCostPerPallet: 52,
      ftlCostPerTruck: 480,
      palletsPerTruck: 24
    }
  });

  const [costConfig, setCostConfig] = useState<CostConfigType>({
    provider: 'fmc',
    cartonHandlingCost: 1.3,
    cartonUnloadingCost: 1.75,
    palletStorageCostPerWeek: 3.9,
    storageWeeks: 8,
    palletHandlingCost: 6.75,
    ltlCostPerPallet: 50,
    ftlCostPerTruck: 500,
    palletsPerTruck: 25,
    totalDemand: 10000,
    transportMode: 'auto',
    showTotalCosts: false
  });

  // Toggle candidate selection
  const toggleCandidateSelection = (id: number) => {
    setCandidateCartons(
      candidateCartons.map(carton => ({
        ...carton,
        isSelected: carton.id === id
      }))
    );
  };

  // Get selected carton ID
  const getSelectedCartonId = () => {
    const selectedCarton = candidateCartons.find(c => c.isSelected);
    return selectedCarton ? selectedCarton.id : null;
  };

  // Handle adding a new candidate
  const handleAddCandidate = (newCandidate: NewCandidateType, editMode: boolean, editCandidateId: number | null) => {
    if (editMode && editCandidateId !== null) {
      // Update existing candidate
      setCandidateCartons(
        candidateCartons.map(carton =>
          carton.id === editCandidateId ?
          {
            ...carton,
            skuId: newCandidate.skuId || carton.skuId, // Keep existing skuId if not provided
            length: parseFloat(newCandidate.length as string),
            width: parseFloat(newCandidate.width as string),
            height: parseFloat(newCandidate.height as string),
            unitsPerCarton: parseInt(newCandidate.unitsPerCarton as string),
            cartonsPerPallet: parseInt(newCandidate.cartonsPerPallet as string)
          } : carton
        )
      );
    } else {
      // Add new candidate
      const newId = Math.max(...candidateCartons.map(c => c.id), 0) + 1;
      setCandidateCartons([
        ...candidateCartons,
        {
          id: newId,
          skuId: newCandidate.skuId || 'Unknown', // Default to 'Unknown' if not provided
          length: parseFloat(newCandidate.length as string),
          width: parseFloat(newCandidate.width as string),
          height: parseFloat(newCandidate.height as string),
          unitsPerCarton: parseInt(newCandidate.unitsPerCarton as string),
          cartonsPerPallet: parseInt(newCandidate.cartonsPerPallet as string),
          isSelected: false
        }
      ]);
    }
  };

  // Handle editing a candidate
  const handleEditCandidate = (id: number): NewCandidateType | null => {
    const candidateToEdit = candidateCartons.find(c => c.id === id);
    if (candidateToEdit) {
      return {
        skuId: candidateToEdit.skuId,
        length: candidateToEdit.length,
        width: candidateToEdit.width,
        height: candidateToEdit.height,
        unitsPerCarton: candidateToEdit.unitsPerCarton,
        cartonsPerPallet: candidateToEdit.cartonsPerPallet
      };
    }
    return null;
  };

  // Handle deleting a candidate
  const handleDeleteCandidate = (id: number) => {
    // Check if this is the selected carton
    const isSelected = candidateCartons.find(c => c.id === id)?.isSelected;

    // Remove from the list
    setCandidateCartons(candidateCartons.filter(c => c.id !== id));

    // If the deleted carton was selected, select another one
    if (isSelected && candidateCartons.length > 1) {
      const newSelectedId = candidateCartons.find(c => c.id !== id)?.id;
      if (newSelectedId) {
        toggleCandidateSelection(newSelectedId);
      }
    }
  };

  // Get optimal carton for a SKU
  const getOptimalCartonForSku = (skuId: string, quantity: number): CartonType | null => {
    // Get all cartons for this SKU
    const skuCartons = candidateCartons.filter(c => c.skuId === skuId);
    if (skuCartons.length === 0) return null;
    
    // If only one carton, return it
    if (skuCartons.length === 1) return skuCartons[0];
    
    // Simple cost calculation (could be more sophisticated)
    const costEstimates = skuCartons.map(carton => {
      const totalCartons = Math.ceil(quantity / carton.unitsPerCarton);
      const totalPallets = Math.ceil(totalCartons / carton.cartonsPerPallet);
      
      // Simplified calculation
      const estimatedCost = 
        totalCartons * (costConfig.cartonHandlingCost + costConfig.cartonUnloadingCost) +
        totalPallets * (costConfig.palletHandlingCost + costConfig.palletStorageCostPerWeek * costConfig.storageWeeks) +
        totalPallets * costConfig.ltlCostPerPallet;
      
      return {
        carton,
        costPerUnit: estimatedCost / quantity
      };
    });
    
    // Find the lowest cost configuration
    const optimal = costEstimates.reduce(
      (min, current) => current.costPerUnit < min.costPerUnit ? current : min,
      costEstimates[0]
    );
    
    return optimal.carton;
  };

  // Handle cost provider change
  const handleProviderChange = (provider: ProviderName) => {
    // Update costConfig with the selected provider's rates
    setCostConfig(prevConfig => ({
      ...prevConfig,
      provider,
      cartonHandlingCost: providerRates[provider].cartonHandlingCost,
      cartonUnloadingCost: providerRates[provider].cartonUnloadingCost,
      palletStorageCostPerWeek: providerRates[provider].palletStorageCostPerWeek,
      palletHandlingCost: providerRates[provider].palletHandlingCost,
      ltlCostPerPallet: providerRates[provider].ltlCostPerPallet,
      ftlCostPerTruck: providerRates[provider].ftlCostPerTruck,
      palletsPerTruck: providerRates[provider].palletsPerTruck
    }));
  };

  // Update provider rates
  const updateProviderRate = (provider: ProviderName, rateKey: ProviderRateKey, value: number) => {
    setProviderRates(prevRates => ({
      ...prevRates,
      [provider]: {
        ...prevRates[provider],
        [rateKey]: value
      }
    }));

    // If current provider rate is updated, also update costConfig
    if (provider === costConfig.provider) {
      setCostConfig(prevConfig => ({
        ...prevConfig,
        [rateKey]: value
      }));
    }
  };

  return (
    <CartonContext.Provider value={{
      candidateCartons,
      setCandidateCartons,
      toggleCandidateSelection,
      getSelectedCartonId,
      handleAddCandidate,
      handleEditCandidate,
      handleDeleteCandidate,
      // Add these for Part3 compatibility
      skus,
      getOptimalCartonForSku
    }}>
      <ProviderContext.Provider value={{
        providerRates,
        setProviderRates,
        handleProviderChange,
        updateProviderRate
      }}>
        <CostConfigContext.Provider value={{ costConfig, setCostConfig }}>
          {children}
        </CostConfigContext.Provider>
      </ProviderContext.Provider>
    </CartonContext.Provider>
  );
};

export const useCarton = () => useContext(CartonContext);
export const useProvider = () => useContext(ProviderContext);
export const useCostConfig = () => useContext(CostConfigContext);