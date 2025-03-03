// src/utils/calculators.ts

// Calculate cost for a given quantity and carton configuration
export const calculateCostComponents = (quantity, cartonId, selectedCartonId, candidateCartons, costConfig) => {
  // Find the carton configuration
  const selectedCarton = candidateCartons.find(c => c.id === (cartonId || selectedCartonId));
  if (!selectedCarton) return null;

  const unitsPerCarton = selectedCarton.unitsPerCarton;
  const cartonsPerPallet = selectedCarton.cartonsPerPallet;

  // Calculate derived quantities - always constant for a given quantity
  const totalCartons = Math.ceil(quantity / unitsPerCarton);

  // Calculate total pallets using decimal for smooth calculation
  // This eliminates the step function behavior
  const totalPallets = totalCartons / cartonsPerPallet;

  // C₁ = Carton-Related Costs - should be constant regardless of transport mode
  const cartonHandlingFee = costConfig.cartonHandlingCost;
  const cartonUnloadingFee = costConfig.cartonUnloadingCost;
  const cartonCosts = totalCartons * (cartonHandlingFee + cartonUnloadingFee);

  // C₂ = Pallet-Related Storage Costs - should be constant regardless of transport mode
  const palletStorageFee = costConfig.palletStorageCostPerWeek;
  const storageWeeks = costConfig.storageWeeks;
  const storageCosts = totalPallets * palletStorageFee * storageWeeks;

  // C₃ = Pallet-Related Transportation Costs
  const palletHandlingFee = costConfig.palletHandlingCost;
  const palletHandlingCosts = totalPallets * palletHandlingFee;

  // LTL_cost = N_pallets × Cost_per_pallet_LTL + (N_pallets × Pallet_handling_cost)
  const ltlCostPerPallet = costConfig.ltlCostPerPallet;
  const ltlCost = totalPallets * ltlCostPerPallet + palletHandlingCosts;

  // FTL_cost = Ceiling(N_pallets ÷ Pallets_per_trailer) × Cost_per_trailer + (N_pallets × Pallet_handling_cost)
  const ftlCostPerTruck = costConfig.ftlCostPerTruck;
  const palletsPerTruck = costConfig.palletsPerTruck;
  const ftlCost = Math.ceil(totalPallets / palletsPerTruck) * ftlCostPerTruck + palletHandlingCosts;

  // Choose transport mode based on setting or auto-select
  let transportCosts;
  let transportMode;

  if (costConfig.transportMode === 'ltl') {
    transportCosts = ltlCost;
    transportMode = 'LTL';
  } else if (costConfig.transportMode === 'ftl') {
    transportCosts = ftlCost;
    transportMode = 'FTL';
  } else {
    // Auto mode - choose the minimum cost option
    transportCosts = Math.min(ltlCost, ftlCost);
    transportMode = ltlCost <= ftlCost ? 'LTL' : 'FTL';
  }

  // Total costs
  const totalCost = cartonCosts + storageCosts + transportCosts;

  // Use exact math to avoid floating point issues
  // For cost per unit, round to 2 decimal places
  const costPerUnit = parseFloat((totalCost / quantity).toFixed(2));

  // Calculate component costs per unit
  const cartonCostPerUnit = parseFloat((cartonCosts / quantity).toFixed(2));
  const storageCostPerUnit = parseFloat((storageCosts / quantity).toFixed(2));
  const transportCostPerUnit = parseFloat((transportCosts / quantity).toFixed(2));

  // Calculate component percentages
  const cartonCostPercentage = parseFloat(((cartonCosts / totalCost) * 100).toFixed(2));
  const storageCostPercentage = parseFloat(((storageCosts / totalCost) * 100).toFixed(2));
  const transportCostPercentage = parseFloat(((transportCosts / totalCost) * 100).toFixed(2));

  return {
    quantity,
    totalCartons,
    totalPallets,
    cartonCosts,
    storageCosts,
    palletHandlingCosts,
    transportCosts,
    totalCost,
    costPerUnit,
    cartonCostPerUnit,
    storageCostPerUnit,
    transportCostPerUnit,
    ltlCost,
    ftlCost,
    transportMode,
    carton: selectedCarton,
    cartonCostPercentage,
    storageCostPercentage,
    transportCostPercentage
  };
};

// Generate scaling data for analysis
export const generateScalingData = (maxQuantity, cartonId, selectedCartonId, candidateCartons, costConfig) => {
  const data = [];
  const selectedCarton = candidateCartons.find(c => c.id === (cartonId || selectedCartonId));
  if (!selectedCarton) return data;

  // Calculate step size based on carton/pallet to ensure smooth curve
  const unitsPerCarton = selectedCarton.unitsPerCarton;
  const cartonsPerPallet = selectedCarton.cartonsPerPallet;
  const unitsPerPallet = unitsPerCarton * cartonsPerPallet;

  // Use units per pallet as step size for smoother curves
  const step = unitsPerPallet;

  // Generate data points
  for (let quantity = step; quantity <= maxQuantity; quantity += step) {
    const costData = calculateCostComponents(quantity, cartonId, selectedCartonId, candidateCartons, costConfig);
    if (costData) {
      data.push(costData);
    }
  }

  return data;
};

// Generate data for quantity intervals
export const generateIntervalData = (cartonId, selectedCartonId, candidateCartons, costConfig) => {
  const quantityIntervals = [1000, 5000, 10000, 20000, 50000];
  return quantityIntervals.map(quantity =>
    calculateCostComponents(quantity, cartonId, selectedCartonId, candidateCartons, costConfig)
  );
};

// Generate comparative data across all carton configurations
export const generateComparativeData = (quantity, candidateCartons, costConfig) => {
  return candidateCartons.map(carton => {
    const costData = calculateCostComponents(quantity, carton.id, carton.id, candidateCartons, costConfig);
    return {
      ...costData,
      cartonId: carton.id,
      dimensions: `${carton.length}×${carton.width}×${carton.height} cm`,
      unitsPerCarton: carton.unitsPerCarton,
      cartonsPerPallet: carton.cartonsPerPallet
    };
  });
};

// Find carton configuration with lowest cost at each quantity interval
export const generateOptimalConfigByQuantity = (candidateCartons, costConfig) => {
  const quantityIntervals = [1000, 5000, 10000, 20000, 50000];
  return quantityIntervals.map(quantity => {
    const comparisons = candidateCartons.map(carton => {
      const costData = calculateCostComponents(quantity, carton.id, carton.id, candidateCartons, costConfig);
      return {
        cartonId: carton.id,
        dimensions: `${carton.length}×${carton.width}×${carton.height}`,
        costPerUnit: costData.costPerUnit,
        unitsPerCarton: carton.unitsPerCarton,
        cartonsPerPallet: carton.cartonsPerPallet
      };
    });

    // Find the minimum cost configuration
    const optimalConfig = comparisons.reduce((min, current) =>
      current.costPerUnit < min.costPerUnit ? current : min
    , comparisons[0]);

    return {
      quantity,
      optimalCartonId: optimalConfig.cartonId,
      dimensions: optimalConfig.dimensions,
      costPerUnit: optimalConfig.costPerUnit
    };
  });
};

// Generate data for cost breakdown visualization
export const generateCostComponentsData = (data) => {
  return data.map(item => ({
    quantity: item.quantity,
    cartonCosts: item.cartonCosts / item.quantity,
    storageCosts: item.storageCosts / item.quantity,
    transportCosts: item.transportCosts / item.quantity,
    totalCost: item.costPerUnit,
    totalPallets: item.totalPallets
  }));
};

// Generate data for comparative cost curves
export const generateComparativeCurves = (candidateCartons, costConfig) => {
  const maxQuantity = Math.max(costConfig.totalDemand * 2, 20000);
  const data = [];

  // Calculate step sizes for each carton to avoid step function
  const stepSizes = candidateCartons.map(carton => {
    const unitsPerCarton = carton.unitsPerCarton;
    const cartonsPerPallet = carton.cartonsPerPallet;
    return unitsPerCarton * cartonsPerPallet; // Units per pallet
  });

  // Use the smallest step size that works for all carton types
  const commonStep = Math.max(...stepSizes);

  // Ensure we don't have too many data points
  const numPoints = 40;
  const step = Math.max(commonStep, Math.ceil(maxQuantity / numPoints / commonStep) * commonStep);

  for (let quantity = step; quantity <= maxQuantity; quantity += step) {
    const entry = { quantity };

    candidateCartons.forEach(carton => {
      const costData = calculateCostComponents(quantity, carton.id, carton.id, candidateCartons, costConfig);
      if (costData) {
        entry[`carton_${carton.id}`] = costData.costPerUnit;
        entry[`carton_${carton.id}_dim`] = `${carton.length}×${carton.width}×${carton.height}`;
      }
    });

    data.push(entry);
  }

  return data;
};
