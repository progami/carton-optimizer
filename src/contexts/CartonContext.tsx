// src/contexts/CartonContext.tsx
import React, { createContext, useState, useContext } from 'react';

const CartonContext = createContext(null);
const ProviderContext = createContext(null);
const CostConfigContext = createContext(null);

export const CartonProvider = ({ children }) => {
  const [candidateCartons, setCandidateCartons] = useState([
    { id: 1, length: 40, width: 30, height: 20, unitsPerCarton: 6, cartonsPerPallet: 20, isSelected: false },
    { id: 2, length: 60, width: 40, height: 25, unitsPerCarton: 12, cartonsPerPallet: 12, isSelected: false },
    { id: 3, length: 45, width: 35, height: 30, unitsPerCarton: 9, cartonsPerPallet: 16, isSelected: true }
  ]);

  const [providerRates, setProviderRates] = useState({
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

  const [costConfig, setCostConfig] = useState({
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
  const toggleCandidateSelection = (id) => {
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
  const handleAddCandidate = (newCandidate, editMode, editCandidateId) => {
    if (editMode && editCandidateId !== null) {
      // Update existing candidate
      setCandidateCartons(
        candidateCartons.map(carton =>
          carton.id === editCandidateId ?
          {
            ...carton,
            length: parseFloat(newCandidate.length),
            width: parseFloat(newCandidate.width),
            height: parseFloat(newCandidate.height),
            unitsPerCarton: parseInt(newCandidate.unitsPerCarton),
            cartonsPerPallet: parseInt(newCandidate.cartonsPerPallet)
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
          length: parseFloat(newCandidate.length),
          width: parseFloat(newCandidate.width),
          height: parseFloat(newCandidate.height),
          unitsPerCarton: parseInt(newCandidate.unitsPerCarton),
          cartonsPerPallet: parseInt(newCandidate.cartonsPerPallet),
          isSelected: false
        }
      ]);
    }
  };

  // Handle editing a candidate
  const handleEditCandidate = (id) => {
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
  const handleDeleteCandidate = (id) => {
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
  const handleProviderChange = (provider) => {
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
  const updateProviderRate = (provider, rateKey, value) => {
    setProviderRates(prevRates => ({
      ...prevRates,
      [provider]: {
        ...prevRates[provider],
        [rateKey]: parseFloat(value)
      }
    }));

    // If current provider rate is updated, also update costConfig
    if (provider === costConfig.provider) {
      setCostConfig(prevConfig => ({
        ...prevConfig,
        [rateKey]: parseFloat(value)
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