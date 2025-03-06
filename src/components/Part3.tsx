// src/components/Part3.tsx
import { useState, useEffect } from 'react';
import { useCarton, useCostConfig } from '../contexts/CartonContext';
import { formatCurrency } from '../utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

// Define container cost constants
const CONTAINER_COSTS = {
  freight: 4000,
  terminalHandling: 185,
  portProcessing: 24.50,
  documentation: 65,
  inspection: 20,
  customsClearance: 145,
  portCharges: 32,
  deferment: 30,
  haulage: 835,
  unloading: 500
};

// Sum of all fixed costs per container
const CONTAINER_FIXED_COSTS = Object.values(CONTAINER_COSTS).reduce((a, b) => a + b, 0);

// Container capacity in cubic meters (40' High-Cube)
const CONTAINER_CAPACITY = 76; // m³ (approximate volume for a 40' HC)

// Type definitions
interface ContainerSKU {
  id: string;
  skuName: string;
  cartonId: number;
  quantity: number;
  unitsPerContainer: number;
  volumePercentage: number; // New field for volume allocation
  volumeEfficiency: number; // How efficiently the carton uses its allocated volume
}

interface SKUCostBreakdown {
  skuId: string;
  skuName: string;
  quantity: number;
  totalCartons: number;
  totalContainers: number;
  containerCosts: number;
  cartonCosts: number;
  palletCosts: number;
  totalCost: number;
  costPerUnit: number;
  dimensions: string;
  volumePercentage: number;
  volumeEfficiency: number;
}

const Part3ContainerOptimization = () => {
  const { candidateCartons, skus, getOptimalCartonForSku } = useCarton();
  const { costConfig } = useCostConfig();

  // State for SKUs in container
  const [containerSkus, setContainerSkus] = useState<ContainerSKU[]>([]);
  
  // Initialize state using SKUs from context
  useEffect(() => {
    if (skus.length > 0 && containerSkus.length === 0) {
      const initialSkuState = skus.map((sku) => {
        // Calculate even distribution of volume percentage
        const volumePercentage = 100 / skus.length;
        
        // Get optimal carton for this SKU (if available)
        const optimalCarton = getOptimalCartonForSku(sku.id, 1000);
        const cartonId = optimalCarton?.id || candidateCartons[0]?.id || 1;
        
        return {
          id: sku.id,
          skuName: sku.name,
          cartonId,
          quantity: 1000,
          unitsPerContainer: 2500,
          volumePercentage,
          volumeEfficiency: 0.85 // Default efficiency
        };
      });
      
      setContainerSkus(initialSkuState);
    }
  }, [skus, containerSkus.length, getOptimalCartonForSku, candidateCartons]);

  // State for cost breakdown
  const [costBreakdown, setCostBreakdown] = useState<SKUCostBreakdown[]>([]);
  const [totalContainers, setTotalContainers] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [containerUtilization, setContainerUtilization] = useState<number>(0);
  const [validVolumeAllocation, setValidVolumeAllocation] = useState<boolean>(true);

  // Calculate costs for each SKU and the total
  useEffect(() => {
    const calculateCosts = () => {
      // First, validate that volume percentages sum to 100%
      const totalVolumePercentage = containerSkus.reduce((sum, sku) => sum + sku.volumePercentage, 0);
      setValidVolumeAllocation(Math.abs(totalVolumePercentage - 100) < 0.01);
      
      if (!validVolumeAllocation) return;
      
      let totalContainersNeeded = 0;
      const skuBreakdowns: SKUCostBreakdown[] = [];

      // Calculate per SKU costs
      containerSkus.forEach(sku => {
        const carton = candidateCartons.find(c => c.id === sku.cartonId);
        if (!carton) return;

        const unitsPerCarton = carton.unitsPerCarton;
        const cartonsPerPallet = carton.cartonsPerPallet;
        
        // Calculate totals
        const totalCartons = Math.ceil(sku.quantity / unitsPerCarton);
        const totalPallets = Math.ceil(totalCartons / cartonsPerPallet);
        
        // Calculate carton and pallet related costs
        const cartonHandlingCost = totalCartons * costConfig.cartonHandlingCost;
        const cartonUnloadingCost = totalCartons * costConfig.cartonUnloadingCost;
        const palletHandlingCost = totalPallets * costConfig.palletHandlingCost;
        const storageCost = totalPallets * costConfig.palletStorageCostPerWeek * costConfig.storageWeeks;
        const transportCost = costConfig.transportMode === 'ltl' 
          ? totalPallets * costConfig.ltlCostPerPallet 
          : Math.ceil(totalPallets / costConfig.palletsPerTruck) * costConfig.ftlCostPerTruck;
        
        // Sum up costs
        const cartonCosts = cartonHandlingCost + cartonUnloadingCost;
        const palletCosts = palletHandlingCost + storageCost + transportCost;
        
        // Calculate volume allocation
        const allocatedVolume = (CONTAINER_CAPACITY * sku.volumePercentage / 100);
        const efficiencyFactor = sku.volumeEfficiency;
        const usableVolume = allocatedVolume * efficiencyFactor;
        
        // Calculate carton volume
        const cartonVolume = (carton.length * carton.width * carton.height) / 1000000; // cm³ to m³
        const cartonsPerContainer = Math.floor(usableVolume / cartonVolume);
        const unitsPerContainer = cartonsPerContainer * unitsPerCarton;
        
        // Calculate containers needed for this SKU
        const skuContainers = Math.ceil(sku.quantity / unitsPerContainer);
        totalContainersNeeded = Math.max(totalContainersNeeded, skuContainers);
        
        // Calculate container costs for this SKU (proportional to volume allocation)
        const containerCosts = totalContainersNeeded * CONTAINER_FIXED_COSTS * (sku.volumePercentage / 100);
        
        // Total costs for this SKU
        const totalCost = cartonCosts + palletCosts + containerCosts;
        
        skuBreakdowns.push({
          skuId: sku.id,
          skuName: sku.skuName,
          quantity: sku.quantity,
          totalCartons,
          totalContainers: skuContainers,
          containerCosts,
          cartonCosts,
          palletCosts,
          totalCost,
          costPerUnit: totalCost / sku.quantity,
          dimensions: `${carton.length}×${carton.width}×${carton.height} cm`,
          volumePercentage: sku.volumePercentage,
          volumeEfficiency: sku.volumeEfficiency
        });
      });

      // Calculate container utilization
      let actualVolumeUsed = 0;
      skuBreakdowns.forEach(breakdown => {
        const carton = candidateCartons.find(c => c.id === containerSkus.find(s => s.id === breakdown.skuId)?.cartonId);
        if (!carton) return;
        
        const cartonVolume = (carton.length * carton.width * carton.height) / 1000000; // cm³ to m³
        actualVolumeUsed += breakdown.totalCartons * cartonVolume;
      });
      
      const totalContainerVolume = totalContainersNeeded * CONTAINER_CAPACITY;
      const utilization = (actualVolumeUsed / totalContainerVolume) * 100;

      setTotalContainers(totalContainersNeeded);
      setCostBreakdown(skuBreakdowns);
      setTotalCost(skuBreakdowns.reduce((sum, sku) => sum + sku.totalCost, 0));
      setContainerUtilization(utilization);
      
      // Update the unitsPerContainer for each SKU based on calculations
      setContainerSkus(prevSkus => 
        prevSkus.map(sku => {
          const carton = candidateCartons.find(c => c.id === sku.cartonId);
          if (!carton) return sku;
          
          const allocatedVolume = (CONTAINER_CAPACITY * sku.volumePercentage / 100);
          const efficiencyFactor = sku.volumeEfficiency;
          const usableVolume = allocatedVolume * efficiencyFactor;
          
          const cartonVolume = (carton.length * carton.width * carton.height) / 1000000; // cm³ to m³
          const cartonsPerContainer = Math.floor(usableVolume / cartonVolume);
          const unitsPerContainer = cartonsPerContainer * carton.unitsPerCarton;
          
          return {
            ...sku,
            unitsPerContainer
          };
        })
      );
    };

    calculateCosts();
  }, [containerSkus, candidateCartons, costConfig, validVolumeAllocation]);

  // Update a specific SKU's data
  const updateSkuData = (id: string, field: keyof ContainerSKU, value: any) => {
    setContainerSkus(prevSkus => 
      prevSkus.map(sku => 
        sku.id === id ? { ...sku, [field]: value } : sku
      )
    );
  };

  // Update a SKU's carton to the optimal one based on quantity
  const setOptimalCarton = (skuId: string) => {
    const sku = containerSkus.find(s => s.id === skuId);
    if (!sku) return;
    
    const optimalCarton = getOptimalCartonForSku(skuId, sku.quantity);
    if (optimalCarton) {
      updateSkuData(skuId, 'cartonId', optimalCarton.id);
    }
  };

  // Distribute remaining percentage to reach 100%
  const distributeRemainingPercentage = () => {
    const currentTotal = containerSkus.reduce((sum, sku) => sum + sku.volumePercentage, 0);
    const difference = 100 - currentTotal;
    
    if (Math.abs(difference) < 0.01) return; // Already at 100%
    
    // Distribute evenly among all SKUs
    const distributionPerSku = difference / containerSkus.length;
    
    setContainerSkus(prevSkus => 
      prevSkus.map(sku => ({
        ...sku,
        volumePercentage: Math.max(0, Math.min(100, sku.volumePercentage + distributionPerSku))
      }))
    );
  };

  // Colors for charts
  const colors = {
    container: '#3b82f6',
    carton: '#0891b2',
    pallet: '#22c55e',
    pieColors: ['#3b82f6', '#0891b2', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  };

  // Prepare data for charts
  const prepareCostBreakdownData = () => {
    const totalContainerCost = costBreakdown.reduce((sum, sku) => sum + sku.containerCosts, 0);
    const totalCartonCost = costBreakdown.reduce((sum, sku) => sum + sku.cartonCosts, 0);
    const totalPalletCost = costBreakdown.reduce((sum, sku) => sum + sku.palletCosts, 0);

    return [
      { name: 'Container Costs', value: totalContainerCost },
      { name: 'Carton Costs', value: totalCartonCost },
      { name: 'Pallet Costs', value: totalPalletCost }
    ];
  };

  // Prepare per-SKU cost breakdown for visualization
  const prepareSkuCostChart = () => {
    return costBreakdown.map(sku => ({
      name: sku.skuName,
      cartonCosts: sku.cartonCosts,
      palletCosts: sku.palletCosts,
      containerCosts: sku.containerCosts,
      totalCost: sku.totalCost,
      costPerUnit: sku.costPerUnit
    }));
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
      <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Part 3: Container Optimization</h2>

      {/* SKU Inputs */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-700">SKU Configuration</h3>
          {!validVolumeAllocation && (
            <div className="flex items-center">
              <span className="text-amber-600 mr-2">
                Volume allocation: {containerSkus.reduce((sum, sku) => sum + sku.volumePercentage, 0).toFixed(1)}%
              </span>
              <button
                onClick={distributeRemainingPercentage}
                className="px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 transition-all text-sm"
              >
                Adjust to 100%
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">SKU Name</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Carton Configuration</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Quantity</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Volume %</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Efficiency %</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Units/Container</th>
                <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {containerSkus.map((sku) => (
                <tr key={sku.id}>
                  <td className="py-2 px-3 border">
                    <input
                      type="text"
                      className="w-full p-1 border rounded"
                      value={sku.skuName}
                      onChange={(e) => updateSkuData(sku.id, 'skuName', e.target.value)}
                    />
                  </td>
                  <td className="py-2 px-3 border">
                    <div className="flex items-center space-x-1">
                      <select 
                        className="w-full p-1 border rounded"
                        value={sku.cartonId}
                        onChange={(e) => updateSkuData(sku.id, 'cartonId', parseInt(e.target.value))}
                      >
                        {candidateCartons
                          .filter(carton => carton.skuId === sku.id)
                          .map(carton => (
                            <option key={carton.id} value={carton.id}>
                              {carton.length}×{carton.width}×{carton.height} cm ({carton.unitsPerCarton} units/carton)
                            </option>
                          ))}
                      </select>
                      <button
                        onClick={() => setOptimalCarton(sku.id)}
                        className="p-1 bg-blue-500 text-white rounded text-xs"
                        title="Set to optimal configuration from Part 2"
                      >
                        Opt
                      </button>
                    </div>
                  </td>
                  <td className="py-2 px-3 border">
                    <input
                      type="number"
                      className="w-full p-1 border rounded"
                      value={sku.quantity}
                      onChange={(e) => updateSkuData(sku.id, 'quantity', parseInt(e.target.value) || 0)}
                    />
                  </td>
                  <td className="py-2 px-3 border">
                    <input
                      type="number"
                      className={`w-full p-1 border rounded ${!validVolumeAllocation ? 'border-amber-500' : ''}`}
                      value={sku.volumePercentage}
                      min="0"
                      max="100"
                      step="0.1"
                      onChange={(e) => updateSkuData(sku.id, 'volumePercentage', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="py-2 px-3 border">
                    <input
                      type="number"
                      className="w-full p-1 border rounded"
                      value={sku.volumeEfficiency}
                      min="0.1"
                      max="1"
                      step="0.01"
                      onChange={(e) => updateSkuData(sku.id, 'volumeEfficiency', parseFloat(e.target.value) || 0.85)}
                    />
                  </td>
                  <td className="py-2 px-3 border text-center">
                    {sku.unitsPerContainer}
                  </td>
                  <td className="py-2 px-3 border text-center">
                    <button
                      className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all text-xs mr-1"
                      onClick={() => setOptimalCarton(sku.id)}
                    >
                      Optimize
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Container Costs */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Container Costs</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 md:col-span-1 bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Container Cost Breakdown</h4>
            <div className="space-y-2">
              {Object.entries(CONTAINER_COSTS).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-sm">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                  <span className="text-sm font-medium">{formatCurrency(value)}</span>
                </div>
              ))}
              <div className="border-t pt-1 font-medium flex justify-between">
                <span>Total Fixed Cost Per Container</span>
                <span>{formatCurrency(CONTAINER_FIXED_COSTS)}</span>
              </div>
            </div>
          </div>
          
          <div className="col-span-2 md:col-span-1 bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Container Utilization</h4>
            <div className="flex justify-center items-center h-40">
              <div className="relative w-40 h-40">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{Math.round(containerUtilization)}%</div>
                    <div className="text-sm text-gray-500">Utilization</div>
                  </div>
                </div>
                <svg viewBox="0 0 36 36" className="w-40 h-40">
                  {/* Background circle */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e0e0e0"
                    strokeWidth="2"
                    strokeDasharray="100, 100"
                  />
                  {/* Percentage arc */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray={`${containerUtilization}, 100`}
                  />
                </svg>
              </div>
            </div>
            <div className="text-center mt-2">
              <div className="text-sm text-gray-600">Total Containers: {totalContainers}</div>
              <div className="text-sm text-gray-600">
                Total Units: {containerSkus.reduce((sum, sku) => sum + sku.quantity, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                Volume Allocation: {validVolumeAllocation ? '100%' : 
                  `${containerSkus.reduce((sum, sku) => sum + sku.volumePercentage, 0).toFixed(1)}%`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Analysis Results */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Cost Analysis</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="col-span-1 bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Overall Cost Summary</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Total Container Costs</span>
                <span className="text-sm font-medium">{formatCurrency(costBreakdown.reduce((sum, sku) => sum + sku.containerCosts, 0))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Carton Costs</span>
                <span className="text-sm font-medium">{formatCurrency(costBreakdown.reduce((sum, sku) => sum + sku.cartonCosts, 0))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Pallet Costs</span>
                <span className="text-sm font-medium">{formatCurrency(costBreakdown.reduce((sum, sku) => sum + sku.palletCosts, 0))}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Total Cost</span>
                <span>{formatCurrency(totalCost)}</span>
              </div>
              <div className="flex justify-between text-green-700 font-medium">
                <span>Average Cost Per Unit</span>
                <span>{formatCurrency(totalCost / containerSkus.reduce((sum, sku) => sum + sku.quantity, 0))}</span>
              </div>
            </div>
          </div>
          
          <div className="col-span-1 lg:col-span-2 bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Cost Distribution</h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={prepareCostBreakdownData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {prepareCostBreakdownData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors.pieColors[index % colors.pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Per SKU Cost Breakdown */}
        <div className="overflow-x-auto">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Per SKU Breakdown</h4>
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">SKU</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Configuration</th>
                <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">Quantity</th>
                <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">Cartons</th>
                <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">Volume %</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border">Container Costs</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border">Carton Costs</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border">Pallet Costs</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border">Total Cost</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border">Cost Per Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {costBreakdown.map((skuCost) => (
                <tr key={skuCost.skuId}>
                  <td className="py-2 px-3 border">{skuCost.skuName}</td>
                  <td className="py-2 px-3 border">{skuCost.dimensions}</td>
                  <td className="py-2 px-3 text-center border">{skuCost.quantity.toLocaleString()}</td>
                  <td className="py-2 px-3 text-center border">{skuCost.totalCartons}</td>
                  <td className="py-2 px-3 text-center border">
                    {skuCost.volumePercentage.toFixed(1)}%
                    <div className="text-xs text-gray-500">
                      ({(skuCost.volumeEfficiency * 100).toFixed(0)}% eff.)
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right border">{formatCurrency(skuCost.containerCosts)}</td>
                  <td className="py-2 px-3 text-right border">{formatCurrency(skuCost.cartonCosts)}</td>
                  <td className="py-2 px-3 text-right border">{formatCurrency(skuCost.palletCosts)}</td>
                  <td className="py-2 px-3 text-right font-medium border">{formatCurrency(skuCost.totalCost)}</td>
                  <td className="py-2 px-3 text-right font-medium border">{formatCurrency(skuCost.costPerUnit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SKU Cost Visualization */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">SKU Cost Comparison</h3>
        <div className="h-80 bg-gray-50 p-4 rounded-lg">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={prepareSkuCostChart()}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Bar yAxisId="left" dataKey="totalCost" name="Total Cost" fill="#8884d8" />
              <Bar yAxisId="right" dataKey="costPerUnit" name="Cost Per Unit" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stacked Cost Breakdown */}
      <div>
        <h3 className="font-semibold text-gray-700 mb-3">Detailed Cost Components by SKU</h3>
        <div className="h-80 bg-gray-50 p-4 rounded-lg">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={prepareSkuCostChart()}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Bar dataKey="containerCosts" name="Container Costs" stackId="a" fill={colors.container} />
              <Bar dataKey="cartonCosts" name="Carton Costs" stackId="a" fill={colors.carton} />
              <Bar dataKey="palletCosts" name="Pallet Costs" stackId="a" fill={colors.pallet} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Part3ContainerOptimization;