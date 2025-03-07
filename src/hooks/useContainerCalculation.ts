// src/hooks/useContainerCalculation.ts
import { useState, useEffect, useCallback } from 'react';
import { useCarton, useCostConfig } from '../contexts/CartonContext';
import { 
  calculateCostComponents, 
  calculateTotalContainerCost, 
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

  // Container configuration
  const [containerType, setContainerType] = useState<keyof typeof CONTAINER_TYPES>('40HC');
  const [totalContainers, setTotalContainers] = useState<number>(1);
  const [containerCosts, setContainerCosts] = useState<ContainerCosts>(DEFAULT_CONTAINER_COSTS);
  
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
    if (unmounted || containerSkus.length === 0) return;
    
    // Force volume percentages to add up to 100%
    const total = containerSkus.reduce((sum: number, sku: ContainerSKU) => sum + (sku.volumePercentage || 0), 0);
    if (Math.abs(total - 100) > 0.1) {
      console.log("Volume percentages don't sum to 100%, recalculating...");
      recalculateVolumePercentages();
      return;
    }
    
    const totalCost = calculateTotalContainerCost(containerCosts, totalContainers);
    console.log("Total container cost:", totalCost);
    setTotalContainerCost(totalCost);
    
    let totalSupplyChain = 0;
    let grandTotal = 0;
    
    // Calculate cost breakdown per SKU
    const breakdown = containerSkus.map((sku: ContainerSKU) => {
      // Get carton details
      const carton = candidateCartons.find(c => c.id === sku.cartonId);
      if (!carton) {
        // Return placeholder if carton not found
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
      
      const dimensions = `${carton.length}×${carton.width}×${carton.height} cm`;
      
      // Container cost attribution based on volume percentage
      const skuContainerCost = totalCost * (sku.volumePercentage / 100);
      const containerCostPerUnit = sku.quantity > 0 ? skuContainerCost / sku.quantity : 0;
      
      // Calculate supply chain costs from Part 2A
      const costResults = calculateCostComponents(
        sku.quantity,
        carton.id,
        carton.id,
        candidateCartons,
        costConfig
      );
      
      let cartonCosts = 0;
      let palletCosts = 0;
      let supplyChainCost = 0;
      let supplyChainCostPerUnit = 0;
      
      if (costResults) {
        // Extract costs from the results
        cartonCosts = costResults.cartonCosts || 0;
        
        // Combine all pallet-related costs
        palletCosts = (costResults.palletHandlingCosts || 0) + 
                      (costResults.storageCosts || 0) + 
                      (costResults.transportCosts || 0);
        
        supplyChainCost = cartonCosts + palletCosts;
        supplyChainCostPerUnit = costResults.costPerUnit || 0;
      }
      
      // Total costs (container + supply chain)
      const totalSkuCost = skuContainerCost + supplyChainCost;
      const totalCostPerUnit = sku.quantity > 0 ? totalSkuCost / sku.quantity : 0;
      
      // Add to running totals
      totalSupplyChain += supplyChainCost;
      grandTotal += totalSkuCost;
      
      return {
        skuId: sku.id,
        skuName: sku.skuName,
        cartonId: carton.id,
        dimensions,
        quantity: sku.quantity,
        containerCosts: skuContainerCost,
        containerCostPerUnit,
        cartonCosts,
        palletCosts,
        supplyChainCost,
        supplyChainCostPerUnit,
        totalCost: totalSkuCost,
        totalCostPerUnit,
        volumePercentage: sku.volumePercentage,
        unitsPerCarton: carton.unitsPerCarton,
        cartonsPerPallet: carton.cartonsPerPallet
      };
    });
    
    setCostBreakdown(breakdown);
    setTotalSupplyChainCost(totalSupplyChain);
    setGrandTotalCost(grandTotal);
    
    console.log("Updated cost breakdown:", {
      totalContainerCost,
      totalSupplyChain,
      grandTotal,
      breakdownItems: breakdown.length
    });
    
  }, [containerSkus, containerCosts, totalContainers, recalculateVolumePercentages, candidateCartons, costConfig, unmounted]);

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