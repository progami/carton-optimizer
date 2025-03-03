// src/contexts/CartonContext.tsx
import React, { createContext, useState, useContext } from 'react';

// Define types for our context objects
type CartonType = {
  id: number;
  length: number;
  width: number;
  height: number;
  unitsPerCarton: number;
  cartonsPerPallet: number;
  isSelected: boolean;
};

type NewCandidateType = {
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
}>({
  candidateCartons: [],
  setCandidateCartons: () => {},
  toggleCandidateSelection: () => {},
  getSelectedCartonId: () => null,
  handleAddCandidate: () => {},
  handleEditCandidate: () => null,
  handleDeleteCandidate: () => {}
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
  const [candidateCartons, setCandidateCartons] = useState<CartonType[]>([
    { id: 1, length: 40, width: 30, height: 20, unitsPerCarton: 6, cartonsPerPallet: 20, isSelected: false },
    { id: 2, length: 60, width: 40, height: 25, unitsPerCarton: 12, cartonsPerPallet: 12, isSelected: false },
    { id: 3, length: 45, width: 35, height: 30, unitsPerCarton: 9, cartonsPerPallet: 16, isSelected: true }
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
      handleDeleteCandidate
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