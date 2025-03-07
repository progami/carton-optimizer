// src/hooks/useContainerCalculation.ts
import { useState, useEffect, useCallback } from 'react';
import { useCarton, useCostConfig } from '../contexts/CartonContext';
import { 
  calculateCostComponents, 
  normalizeVolumePercentages,
  CONTAINER_TYPES,
  DEFAULT_CONTAINER_COSTS
} from '../utils/calculators';

// Type definitions
export interface ContainerSKU {
  id: string;
  skuName: string;
  cartonId: number;
  quantity: number;
  volumePercentage: number;
}

export interface ContainerCosts {
  freight: number;
  terminalHandling: number;
  portProcessing: number;
  haulage: number;
  unloading: number;
  [key: string]: number; // Add index signature to make it compatible with Record<string, number>
}

export interface CostBreakdown {
  skuId: string;
  skuName: string;
  cartonId: number;
  dimensions: string;
  quantity: number;
  
  // Container costs
  containerCosts: number;
  containerCostPerUnit: number;
  
  // Supply chain costs from Part 2A
  cartonCosts: number;
  palletCosts: number;
  supplyChainCost: number;
  supplyChainCostPerUnit: number;
  
  // Total costs
  totalCost: number;
  totalCostPerUnit: number;
  
  volumePercentage: number;
  unitsPerCarton: number;
  cartonsPerPallet: number;
}

export const useContainerCalculation = () => {
  // Unmount detection for cleanup
  const [unmounted, setUnmounted] = useState(false);
  useEffect(() => {
    return () => {
      setUnmounted(true);
    };
  }, []);

  const { candidateCartons, skus, getOptimalCartonForSku } = useCarton();
  const { costConfig } = useCostConfig();

  // Container configuration with explicit defaults
  const [containerType, setContainerType] = useState<keyof typeof CONTAINER_TYPES>('40HC');
  const [totalContainers, setTotalContainers] = useState<number>(1);
  
  // Initialize container costs with proper defaults
  const [containerCosts, setContainerCosts] = useState<ContainerCosts>({
    freight: 4000,
    terminalHandling: 450,
    portProcessing: 150,
    haulage: 835,
    unloading: 500,
  });
  
  // Debug initialization
  useEffect(() => {
    console.log("Initial container costs:", containerCosts);
  }, []);
  
  // State for SKUs in container
  const [containerSkus, setContainerSkus] = useState<ContainerSKU[]>([]);
  
  // State for cost breakdown
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);
  const [totalContainerCost, setTotalContainerCost] = useState<number>(0);
  const [totalSupplyChainCost, setTotalSupplyChainCost] = useState<number>(0);
  const [grandTotalCost, setGrandTotalCost] = useState<number>(0);

  // Force initialization with equal volume percentages
  const initializeContainerSkus = useCallback(() => {
    if (unmounted || skus.length === 0) return;
    
    console.log("Initializing container SKUs with", skus.length, "SKUs");
    
    // Calculate equal percentage for each SKU
    const equalPercentage = parseFloat((100 / skus.length).toFixed(1));
    
    const initialSkuState = skus.map((sku) => {
      // Get optimal carton for this SKU
      const optimalCarton = getOptimalCartonForSku(sku.id, 1000);
      const cartonId = optimalCarton?.id || candidateCartons.find(c => c.skuId === sku.id)?.id || 0;
      
      return {
        id: sku.id,
        skuName: sku.name,
        cartonId,
        quantity: 1000,
        volumePercentage: equalPercentage
      };
    });
    
    // If we have any remaining percentage due to rounding, add it to the first SKU
    const totalPercentage = initialSkuState.reduce((sum, sku) => sum + sku.volumePercentage, 0);
    if (totalPercentage < 100 && initialSkuState.length > 0) {
      initialSkuState[0].volumePercentage += (100 - totalPercentage);
    }
    
    setContainerSkus(initialSkuState);
  }, [skus, getOptimalCartonForSku, candidateCartons, unmounted]);
  
  // Initialize state with SKUs from context
  useEffect(() => {
    if (skus.length > 0 && (containerSkus.length === 0 || containerSkus.length !== skus.length)) {
      initializeContainerSkus();
    }
  }, [skus.length, containerSkus.length, initializeContainerSkus]);

  // Update a specific SKU's data
  const updateSkuData = useCallback((id: string, field: keyof ContainerSKU, value: any) => {
    if (unmounted) return;
    
    setContainerSkus(prevSkus => 
      prevSkus.map(sku => 
        sku.id === id ? { ...sku, [field]: value } : sku
      )
    );
  }, [unmounted]);

  // Recalculate volume percentages to ensure they sum to 100%
  const recalculateVolumePercentages = useCallback(() => {
    if (unmounted || containerSkus.length === 0) return;
    
    const normalizedSkus = normalizeVolumePercentages(containerSkus);
    setContainerSkus(normalizedSkus);
  }, [containerSkus, unmounted]);

  // Set optimal cartons for all SKUs
  const setOptimalCartonsForAll = useCallback(() => {
    if (unmounted) return;
    
    setContainerSkus(prevSkus => 
      prevSkus.map(sku => {
        const optimalCarton = getOptimalCartonForSku(sku.id, sku.quantity);
        return optimalCarton 
          ? { ...sku, cartonId: optimalCarton.id }
          : sku;
      })
    );
  }, [getOptimalCartonForSku, unmounted]);

  // Calculate costs for each SKU including supply chain costs from Part 2A
  useEffect(() => {
    // Skip execution if no data
    if (unmounted || containerSkus.length === 0) return;
    
    // Force volume percentages to add up to 100%
    const total = containerSkus.reduce((sum: number, sku: ContainerSKU) => sum + (sku.volumePercentage || 0), 0);
    if (Math.abs(total - 100) > 0.1) {
      console.log("Volume percentages don't sum to 100%, recalculating...");
      recalculateVolumePercentages();
      return;
    }
    
    // Calculate container costs directly without relying on utility function
    const containerBaseRate = 
      parseFloat(containerCosts.freight.toString()) + 
      parseFloat(containerCosts.terminalHandling.toString()) + 
      parseFloat(containerCosts.portProcessing.toString()) + 
      parseFloat(containerCosts.haulage.toString()) + 
      parseFloat(containerCosts.unloading.toString());
    
    // Multiply by number of containers
    const calculatedTotalContainerCost = containerBaseRate * totalContainers;
    
    // Debug output
    console.log("Container costs calculation:", {
      freight: containerCosts.freight,
      terminalHandling: containerCosts.terminalHandling,
      portProcessing: containerCosts.portProcessing,
      haulage: containerCosts.haulage,
      unloading: containerCosts.unloading,
      baseRate: containerBaseRate,
      totalContainers,
      calculatedTotalContainerCost
    });
    
    // Explicitly set the total container cost
    setTotalContainerCost(calculatedTotalContainerCost);
    
    // Force a state update by creating new breakdown array
    const updatedBreakdown = containerSkus.map(sku => {
      // Get carton details
      const carton = candidateCartons.find(c => c.id === sku.cartonId);
      if (!carton) {
        return {
          skuId: sku.id,
          skuName: sku.skuName,
          cartonId: 0,
          dimensions: 'No carton selected',
          quantity: sku.quantity,
          containerCosts: 0,
          containerCostPerUnit: 0,
          cartonCosts: 0,
          palletCosts: 0,
          supplyChainCost: 0,
          supplyChainCostPerUnit: 0,
          totalCost: 0,
          totalCostPerUnit: 0,
          volumePercentage: sku.volumePercentage,
          unitsPerCarton: 0,
          cartonsPerPallet: 0
        };
      }
      
      // Calculate SKU's portion of container cost
      const skuContainerCost = calculatedTotalContainerCost * (sku.volumePercentage / 100);
      
      // Calculate supply chain costs
      let cartonCosts = 0;
      let palletCosts = 0;
      
      // Calculate physical units, cartons, and pallets
      const unitsPerCarton = carton.unitsPerCarton;
      const cartonsPerPallet = carton.cartonsPerPallet;
      const totalCartons = Math.ceil(sku.quantity / unitsPerCarton);
      const totalPallets = Math.ceil(totalCartons / cartonsPerPallet);
      
      // Calculate carton-related costs
      cartonCosts = totalCartons * (costConfig.cartonHandlingCost + costConfig.cartonUnloadingCost);
      
      // Calculate pallet-related costs
      const storageWeeks = costConfig.storageWeeks;
      const storageAndHandlingCost = totalPallets * (costConfig.palletHandlingCost + 
                                    costConfig.palletStorageCostPerWeek * storageWeeks);
      
      // Calculate transport costs
      let transportCost = 0;
      const ltlCost = totalPallets * costConfig.ltlCostPerPallet;
      const ftlCost = Math.ceil(totalPallets / costConfig.palletsPerTruck) * costConfig.ftlCostPerTruck;
      
      // Choose the cheaper transport option
      transportCost = Math.min(ltlCost, ftlCost);
      
      // Total pallet-related costs
      palletCosts = storageAndHandlingCost + transportCost;
      
      // Total supply chain cost
      const supplyChainCost = cartonCosts + palletCosts;
      
      // Total cost and per unit cost
      const totalCost = skuContainerCost + supplyChainCost;
      const costPerUnit = sku.quantity > 0 ? totalCost / sku.quantity : 0;
      
      return {
        skuId: sku.id,
        skuName: sku.skuName,
        cartonId: carton.id,
        dimensions: `${carton.length}×${carton.width}×${carton.height} cm`,
        quantity: sku.quantity,
        containerCosts: skuContainerCost,
        containerCostPerUnit: sku.quantity > 0 ? skuContainerCost / sku.quantity : 0,
        cartonCosts,
        palletCosts,
        supplyChainCost,
        supplyChainCostPerUnit: sku.quantity > 0 ? supplyChainCost / sku.quantity : 0,
        totalCost,
        totalCostPerUnit: costPerUnit,
        volumePercentage: sku.volumePercentage,
        unitsPerCarton: carton.unitsPerCarton,
        cartonsPerPallet: carton.cartonsPerPallet
      };
    });
    
    // Update state with the new breakdown
    setCostBreakdown(updatedBreakdown);
    
    // Calculate totals
    const totalSupplyChain = updatedBreakdown.reduce(
      (sum, sku) => sum + sku.supplyChainCost, 
      0
    );
    
    const grandTotal = updatedBreakdown.reduce(
      (sum, sku) => sum + sku.totalCost,
      0
    );
    
    // Update state with calculated values
    setTotalSupplyChainCost(totalSupplyChain);
    setGrandTotalCost(grandTotal);
    
    console.log("Final calculated values:", {
      calculatedTotalContainerCost,
      totalSupplyChain,
      grandTotal
    });
    
  }, [containerSkus, containerCosts, totalContainers, candidateCartons, costConfig, recalculateVolumePercentages, unmounted]);

  return {
    // Container configuration
    containerType,
    setContainerType,
    totalContainers,
    setTotalContainers,
    containerCosts,
    setContainerCosts,
    
    // SKU management
    containerSkus,
    updateSkuData,
    recalculateVolumePercentages,
    setOptimalCartonsForAll,
    initializeContainerSkus,
    
    // Cost calculations
    costBreakdown,
    totalContainerCost,
    totalSupplyChainCost,
    grandTotalCost,
  };
};

export default useContainerCalculation;