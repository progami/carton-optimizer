// src/utils/calculators.ts

// Define types for carton and cost config
interface CartonType {
  id: number;
  skuId: string;
  length: number;
  width: number;
  height: number;
  unitsPerCarton: number;
  cartonsPerPallet: number;
  isSelected?: boolean;
}

type ProviderName = 'fmc' | 'vglobal' | '4as';

interface ProviderRate {
  cartonHandlingCost: number;
  cartonUnloadingCost: number;
  palletStorageCostPerWeek: number;
  palletHandlingCost: number;
  ltlCostPerPallet: number;
  ftlCostPerTruck: number;
  palletsPerTruck: number;
}

interface ProviderRates {
  [key: string]: ProviderRate;
}

interface CostConfigType {
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
}

export interface CostAnalysisResult {
  skuId: string;
  cartonId: number;
  dimensions: string;
  unitsPerCarton: number;
  cartonsPerPallet: number;
  unitsPerPallet: number;
  provider: ProviderName;
  lcmQuantity: number;
  cartonCostsPerUnit: number;
  palletCostsPerUnit: number;
  totalCostPerUnit: number;
  isOptimal: boolean;
}

// Find the Greatest Common Divisor (GCD) of two numbers
export const gcd = (a: number, b: number): number => {
  return b === 0 ? a : gcd(b, a % b);
};

// Find the Least Common Multiple (LCM) of two numbers
export const lcm = (a: number, b: number): number => {
  return (a * b) / gcd(a, b);
};

// Find the LCM of an array of numbers
export const findLCM = (numbers: number[]): number => {
  return numbers.reduce((result, num) => lcm(result, num), 1);
};

// Calculate cost analysis for a carton configuration with a specific provider
export const calculateCostAnalysis = (
  carton: CartonType,
  providerRates: ProviderRate,
  storageWeeks: number,
  transportMode: 'auto' | 'ltl' | 'ftl',
  palletsPerTruck: number,
  provider: ProviderName
): CostAnalysisResult => {
  const unitsPerCarton = carton.unitsPerCarton;
  const cartonsPerPallet = carton.cartonsPerPallet;
  const unitsPerPallet = unitsPerCarton * cartonsPerPallet;
  
  // Calculate LCM quantity
  // For LTL, we use units/carton and units/pallet
  // For FTL, we also consider units/truck
  let lcmQuantity: number;
  
  if (transportMode === 'ltl' || transportMode === 'auto') {
    lcmQuantity = findLCM([unitsPerCarton, unitsPerPallet]);
  } else {
    const unitsPerTruck = unitsPerPallet * palletsPerTruck;
    lcmQuantity = findLCM([unitsPerCarton, unitsPerPallet, unitsPerTruck]);
  }
  
  // Ensure a reasonable minimum quantity for better cost representation
  lcmQuantity = Math.max(lcmQuantity, 1000);
  
  // Calculate total cartons and pallets needed
  const totalCartons = Math.ceil(lcmQuantity / unitsPerCarton);
  const totalPallets = Math.ceil(totalCartons / cartonsPerPallet);
  
  // Calculate carton-related costs (g1)
  const cartonHandlingCost = providerRates.cartonHandlingCost;
  const cartonUnloadingCost = providerRates.cartonUnloadingCost;
  const cartonCosts = totalCartons * (cartonHandlingCost + cartonUnloadingCost);
  const cartonCostsPerUnit = cartonCosts / lcmQuantity;
  
  // Calculate pallet-related costs (g2)
  const palletHandlingCost = providerRates.palletHandlingCost;
  const palletStorageCost = providerRates.palletStorageCostPerWeek * storageWeeks;
  
  // Calculate transport costs based on mode
  let transportCost: number;
  
  if (transportMode === 'ltl') {
    transportCost = totalPallets * providerRates.ltlCostPerPallet;
  } else if (transportMode === 'ftl') {
    transportCost = Math.ceil(totalPallets / palletsPerTruck) * providerRates.ftlCostPerTruck;
  } else {
    // Auto mode - choose the cheaper option
    const ltlCost = totalPallets * providerRates.ltlCostPerPallet;
    const ftlCost = Math.ceil(totalPallets / palletsPerTruck) * providerRates.ftlCostPerTruck;
    transportCost = Math.min(ltlCost, ftlCost);
  }
  
  const palletCosts = (totalPallets * palletHandlingCost) + 
                      (totalPallets * palletStorageCost) + 
                      transportCost;
  
  const palletCostsPerUnit = palletCosts / lcmQuantity;
  
  // Calculate total cost per unit
  const totalCostPerUnit = cartonCostsPerUnit + palletCostsPerUnit;
  
  return {
    skuId: carton.skuId,
    cartonId: carton.id,
    dimensions: `${carton.length}×${carton.width}×${carton.height} cm`,
    unitsPerCarton,
    cartonsPerPallet,
    unitsPerPallet,
    provider,
    lcmQuantity,
    cartonCostsPerUnit,
    palletCostsPerUnit,
    totalCostPerUnit,
    isOptimal: false // Will be set later when comparing results
  };
};

// Calculate cost analysis for all cartons and all providers
export const calculateAllCostAnalyses = (
  cartons: CartonType[],
  providerRates: ProviderRates,
  storageWeeks: number,
  transportMode: 'auto' | 'ltl' | 'ftl',
  palletsPerTruck: number = 25 // Default value
): CostAnalysisResult[] => {
  const results: CostAnalysisResult[] = [];
  
  // Process all cartons with all providers
  cartons.forEach(carton => {
    Object.entries(providerRates).forEach(([provider, rates]) => {
      const result = calculateCostAnalysis(
        carton,
        rates,
        storageWeeks,
        transportMode,
        palletsPerTruck,
        provider as ProviderName
      );
      results.push(result);
    });
  });
  
  // Set isOptimal flag for the lowest cost configuration for each SKU
  const skuGroups = groupResultsBySKU(results);
  
  Object.values(skuGroups).forEach(group => {
    if (group.length > 0) {
      // Find the minimum cost configuration in this group
      const minCostConfig = group.reduce(
        (min, current) => current.totalCostPerUnit < min.totalCostPerUnit ? current : min,
        group[0]
      );
      
      // Set the isOptimal flag for this configuration
      const index = results.findIndex(
        r => r.skuId === minCostConfig.skuId && 
             r.cartonId === minCostConfig.cartonId && 
             r.provider === minCostConfig.provider
      );
      
      if (index !== -1) {
        results[index].isOptimal = true;
      }
    }
  });
  
  return results;
};

// Group results by SKU for easier processing
export const groupResultsBySKU = (
  results: CostAnalysisResult[]
): Record<string, CostAnalysisResult[]> => {
  const groups: Record<string, CostAnalysisResult[]> = {};
  
  results.forEach(result => {
    if (!groups[result.skuId]) {
      groups[result.skuId] = [];
    }
    groups[result.skuId].push(result);
  });
  
  return groups;
};

// Group results by SKU and provider for easier processing
export const groupResultsBySKUAndProvider = (
  results: CostAnalysisResult[]
): Record<string, CostAnalysisResult[]> => {
  const groups: Record<string, CostAnalysisResult[]> = {};
  
  results.forEach(result => {
    const key = `${result.skuId}-${result.provider}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(result);
  });
  
  return groups;
};

// Find the optimal carton for each SKU (lowest cost across all providers)
export const findOptimalCartonsPerSKU = (
  results: CostAnalysisResult[]
): CostAnalysisResult[] => {
  const skuGroups = groupResultsBySKU(results);
  
  return Object.keys(skuGroups).map(skuId => {
    const configs = skuGroups[skuId];
    return configs.reduce(
      (min, current) => current.totalCostPerUnit < min.totalCostPerUnit ? current : min,
      configs[0]
    );
  });
};

// Container types and their dimensions in cm
export const CONTAINER_TYPES = {
  '40HC': { name: "40' High-Cube", length: 1203, width: 235, height: 269, volume: 76 }, // volume in m³
  '40STD': { name: "40' Standard", length: 1203, width: 235, height: 239, volume: 67 }, // volume in m³
  '20STD': { name: "20' Standard", length: 590, width: 235, height: 239, volume: 33 }  // volume in m³
};

// Default container costs
export const DEFAULT_CONTAINER_COSTS = {
  freight: 4000,
  terminalHandling: 185,
  portProcessing: 24.5,
  documentationFee: 65,
  containerInspection: 20,
  customsClearance: 145,
  portCharges: 32,
  defermentFee: 30,
  haulage: 835,
  containerUnloading: 500
};

// The following functions are added for compatibility with useContainerCalculation.ts
// even if we're not using them in Part 2

// Legacy function for compatibility
export const calculateCostComponents = (
  quantity: number, 
  cartonId: number | null, 
  selectedCartonId: number, 
  candidateCartons: CartonType[], 
  costConfig: CostConfigType
): any => {
  // Placeholder implementation to maintain compatibility
  const carton = candidateCartons.find(c => c.id === (cartonId || selectedCartonId));
  if (!carton) return null;
  
  const unitsPerCarton = carton.unitsPerCarton;
  const cartonsPerPallet = carton.cartonsPerPallet;
  const totalCartons = Math.ceil(quantity / unitsPerCarton);
  const totalPallets = Math.ceil(totalCartons / cartonsPerPallet);
  
  return {
    quantity,
    totalCartons,
    totalPallets,
    physicalPallets: totalPallets,
    carton,
    transportMode: costConfig.transportMode
  };
};

// Normalize volume percentages to ensure they sum to 100%
export const normalizeVolumePercentages = <T extends { volumePercentage: number }>(
  items: T[]
): T[] => {
  if (items.length === 0) return [];
  
  // Create a deep copy to avoid mutating the original objects
  const result = items.map(item => ({...item}));
  
  // Calculate total percentage
  const total = result.reduce((sum, item) => sum + (item.volumePercentage || 0), 0);
  
  // If all percentages are 0 or NaN, distribute evenly
  const allZero = result.every(item => !item.volumePercentage || isNaN(item.volumePercentage));
  
  if (allZero) {
    const equalPercentage = parseFloat((100 / result.length).toFixed(1));
    return result.map((item, index) => ({
      ...item,
      volumePercentage: index === 0 
        ? parseFloat((equalPercentage + (100 - (equalPercentage * result.length))).toFixed(1)) 
        : equalPercentage
    }));
  }
  
  // If total is already close to 100%, return as is
  if (Math.abs(total - 100) < 0.1) return result;
  
  // Otherwise, scale all percentages proportionally
  const factor = 100 / total;
  return result.map(item => ({
    ...item,
    volumePercentage: parseFloat(((item.volumePercentage || 0) * factor).toFixed(1))
  }));
};