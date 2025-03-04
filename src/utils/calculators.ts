// src/utils/calculators.ts

// Define types for carton and cost config
interface CartonType {
  id: number;
  length: number;
  width: number;
  height: number;
  unitsPerCarton: number;
  cartonsPerPallet: number;
  isSelected: boolean;
}

interface CostConfigType {
  provider: string;
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
}

// Define the cost calculation result type
interface CostCalculationResult {
  quantity: number;
  totalCartons: number;
  totalPallets: number;      // Calculated (fractional) pallets - for display only
  physicalPallets: number;   // Actual physical (whole) pallets - used for cost calculations
  cartonCosts: number;
  storageCosts: number;
  palletHandlingCosts: number;
  transportCosts: number;
  totalCost: number;
  costPerUnit: number;
  cartonCostPerUnit: number;
  storageCostPerUnit: number;
  transportCostPerUnit: number;
  ltlCost: number;
  ftlCost: number;
  transportMode: string;
  carton: CartonType;
  cartonCostPercentage: number;
  storageCostPercentage: number;
  transportCostPercentage: number;
}

// Define comparative data result type
interface ComparativeDataResult extends CostCalculationResult {
  cartonId: number;
  dimensions: string;
  unitsPerCarton: number;
  cartonsPerPallet: number;
}

// Define optimal config result type
interface OptimalConfigResult {
  quantity: number;
  optimalCartonId: number;
  dimensions: string;
  costPerUnit: number;
}

// Define cost components data type
interface CostComponentsData {
  quantity: number;
  cartonCosts: number;
  storageCosts: number;
  transportCosts: number;
  totalCost: number;
  totalPallets: number;
}

// Define comparative curves entry type
interface ComparativeCurveEntry {
  quantity: number;
  [key: string]: number | string;
}

// Calculate cost for a given quantity and carton configuration
export const calculateCostComponents = (
  quantity: number, 
  cartonId: number | null, 
  selectedCartonId: number, 
  candidateCartons: CartonType[], 
  costConfig: CostConfigType
): CostCalculationResult | null => {
  // Find the carton configuration
  const selectedCarton = candidateCartons.find(c => c.id === (cartonId || selectedCartonId));
  if (!selectedCarton) return null;

  const unitsPerCarton = selectedCarton.unitsPerCarton;
  const cartonsPerPallet = selectedCarton.cartonsPerPallet;

  // Calculate derived quantities - always use ceiling for actual cartons needed
  const totalCartons = Math.ceil(quantity / unitsPerCarton);
  
  // Calculate both fractional pallets (for display) and whole pallets (for costs)
  const calculatedPallets = totalCartons / cartonsPerPallet;
  const physicalPallets = Math.ceil(calculatedPallets);
  
  // C₁ = Carton-Related Costs
  const cartonHandlingFee = costConfig.cartonHandlingCost;
  const cartonUnloadingFee = costConfig.cartonUnloadingCost;
  const cartonCosts = totalCartons * (cartonHandlingFee + cartonUnloadingFee);

  // C₂ = Pallet-Related Storage Costs - ALWAYS use whole pallets
  const palletStorageFee = costConfig.palletStorageCostPerWeek;
  const storageWeeks = costConfig.storageWeeks;
  const storageCosts = physicalPallets * palletStorageFee * storageWeeks;

  // C₃ = Pallet-Related Transportation Costs - ALWAYS use whole pallets
  const palletHandlingFee = costConfig.palletHandlingCost;
  const palletHandlingCosts = physicalPallets * palletHandlingFee;

  // LTL_cost = N_pallets × Cost_per_pallet_LTL + (N_pallets × Pallet_handling_cost)
  const ltlCostPerPallet = costConfig.ltlCostPerPallet;
  const ltlCost = physicalPallets * ltlCostPerPallet;

  // FTL_cost = Ceiling(N_pallets ÷ Pallets_per_trailer) × Cost_per_trailer
  const ftlCostPerTruck = costConfig.ftlCostPerTruck;
  const palletsPerTruck = costConfig.palletsPerTruck;
  const ftlCost = Math.ceil(physicalPallets / palletsPerTruck) * ftlCostPerTruck;

  // Choose transport mode based on setting or auto-select
  let transportCosts;
  let transportMode;

  if (costConfig.transportMode === 'ltl') {
    transportCosts = ltlCost + palletHandlingCosts;
    transportMode = 'LTL';
  } else if (costConfig.transportMode === 'ftl') {
    transportCosts = ftlCost + palletHandlingCosts;
    transportMode = 'FTL';
  } else {
    // Auto mode - choose the minimum cost option
    if (ltlCost <= ftlCost) {
      transportCosts = ltlCost + palletHandlingCosts;
      transportMode = 'LTL';
    } else {
      transportCosts = ftlCost + palletHandlingCosts;
      transportMode = 'FTL';
    }
  }

  // Total costs
  const totalCost = cartonCosts + storageCosts + transportCosts;

  // Calculate cost per unit
  const costPerUnit = totalCost / quantity;

  // Calculate component costs per unit
  const cartonCostPerUnit = cartonCosts / quantity;
  const storageCostPerUnit = storageCosts / quantity;
  const transportCostPerUnit = transportCosts / quantity;

  // Calculate component percentages
  const cartonCostPercentage = (cartonCosts / totalCost) * 100;
  const storageCostPercentage = (storageCosts / totalCost) * 100;
  const transportCostPercentage = (transportCosts / totalCost) * 100;

  return {
    quantity,
    totalCartons,
    totalPallets: calculatedPallets,   // Fractional number for display
    physicalPallets,                   // Whole number for cost calculations
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
export const generateScalingData = (
  maxQuantity: number, 
  cartonId: number | null, 
  selectedCartonId: number, 
  candidateCartons: CartonType[], 
  costConfig: CostConfigType
): CostCalculationResult[] => {
  const data: CostCalculationResult[] = [];
  const selectedCarton = candidateCartons.find(c => c.id === (cartonId || selectedCartonId));
  if (!selectedCarton) return data;

  // Always include a data point at the current quantity
  const currentQuantity = costConfig.totalDemand;
  
  // Generate at least 20 data points, with more for larger ranges
  const minPoints = 20;
  const pointCount = Math.max(minPoints, Math.min(40, maxQuantity / 500));
  
  // Create an array of quantities to calculate
  const quantities: number[] = [];
  
  // Always include small quantities for better curve visualization
  quantities.push(1);
  if (maxQuantity > 100) quantities.push(100);
  if (maxQuantity > 1000) quantities.push(1000);
  
  // Then add evenly spaced points
  const step = maxQuantity / pointCount;
  for (let i = 1; i <= pointCount; i++) {
    const qty = Math.round(i * step);
    if (qty > quantities[quantities.length - 1]) {
      quantities.push(qty);
    }
  }
  
  // Always include the current quantity
  if (!quantities.includes(currentQuantity)) {
    quantities.push(currentQuantity);
  }
  
  // Sort quantities and remove duplicates
  const uniqueQuantities = [...new Set(quantities)].sort((a, b) => a - b);
  
  // Calculate cost data for each quantity
  for (const quantity of uniqueQuantities) {
    const costData = calculateCostComponents(quantity, cartonId, selectedCartonId, candidateCartons, costConfig);
    if (costData) {
      data.push(costData);
    }
  }

  return data;
};

// Generate data for quantity intervals
export const generateIntervalData = (
  cartonId: number | null, 
  selectedCartonId: number, 
  candidateCartons: CartonType[], 
  costConfig: CostConfigType
): (CostCalculationResult | null)[] => {
  const quantityIntervals = [1000, 5000, 10000, 20000, 50000];
  return quantityIntervals.map(quantity =>
    calculateCostComponents(quantity, cartonId, selectedCartonId, candidateCartons, costConfig)
  );
};

// Generate comparative data across all carton configurations
export const generateComparativeData = (
  quantity: number, 
  candidateCartons: CartonType[], 
  costConfig: CostConfigType
): ComparativeDataResult[] => {
  return candidateCartons.map(carton => {
    const costData = calculateCostComponents(quantity, carton.id, carton.id, candidateCartons, costConfig);
    if (!costData) {
      // This should never happen since we're iterating over existing cartons,
      // but TypeScript wants us to handle this case
      throw new Error(`Failed to calculate costs for carton ${carton.id}`);
    }
    
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
export const generateOptimalConfigByQuantity = (
  candidateCartons: CartonType[], 
  costConfig: CostConfigType
): OptimalConfigResult[] => {
  const quantityIntervals = [1000, 5000, 10000, 20000, 50000];
  return quantityIntervals.map(quantity => {
    const comparisons = candidateCartons.map(carton => {
      const costData = calculateCostComponents(quantity, carton.id, carton.id, candidateCartons, costConfig);
      if (!costData) {
        throw new Error(`Failed to calculate costs for carton ${carton.id}`);
      }
      
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
export const generateCostComponentsData = (
  data: CostCalculationResult[]
): CostComponentsData[] => {
  return data.map(item => ({
    quantity: item.quantity,
    cartonCosts: item.cartonCosts / item.quantity,
    storageCosts: item.storageCosts / item.quantity,
    transportCosts: item.transportCosts / item.quantity,
    totalCost: item.costPerUnit,
    totalPallets: item.physicalPallets
  }));
};

// Generate data for comparative cost curves
export const generateComparativeCurves = (
  candidateCartons: CartonType[], 
  costConfig: CostConfigType
): ComparativeCurveEntry[] => {
  const maxQuantity = Math.max(costConfig.totalDemand * 2, 20000);
  const data: ComparativeCurveEntry[] = [];

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
    const entry: ComparativeCurveEntry = { quantity };

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