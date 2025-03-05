import { useState, useEffect } from 'react';
import { useCarton, useCostConfig } from '../contexts/CartonContext';
import { formatCurrency } from '../utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
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

// Type definitions
interface ContainerSKU {
  id: string;
  skuName: string;
  cartonId: number;
  quantity: number;
  unitsPerContainer: number;
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
}

const Part3ContainerOptimization = () => {
  const { candidateCartons } = useCarton();
  const { costConfig } = useCostConfig();

  // State for SKUs in container
  const [skus, setSkus] = useState<ContainerSKU[]>([
    {
      id: '1',
      skuName: 'Product A',
      cartonId: candidateCartons[0]?.id || 1,
      quantity: 1000,
      unitsPerContainer: 2500
    }
  ]);

  // State for cost breakdown
  const [costBreakdown, setCostBreakdown] = useState<SKUCostBreakdown[]>([]);
  const [totalContainers, setTotalContainers] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [containerUtilization, setContainerUtilization] = useState<number>(0);

  // Generate a unique ID for new SKUs
  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  };

  // Add a new SKU
  const addSku = () => {
    const newId = generateUniqueId();
    setSkus([
      ...skus,
      {
        id: newId,
        skuName: `Product ${String.fromCharCode(65 + skus.length)}`, // A, B, C, etc.
        cartonId: candidateCartons[0]?.id || 1,
        quantity: 1000,
        unitsPerContainer: 2500
      }
    ]);
  };

  // Remove an SKU
  const removeSku = (id: string) => {
    if (skus.length > 1) {
      setSkus(skus.filter(sku => sku.id !== id));
    }
  };

  // Update SKU details
  const updateSku = (id: string, field: keyof ContainerSKU, value: any) => {
    setSkus(skus.map(sku => 
      sku.id === id ? { ...sku, [field]: value } : sku
    ));
  };

  // Calculate costs for each SKU and the total
  useEffect(() => {
    const calculateCosts = () => {
      let totalContainersNeeded = 0;
      const skuBreakdowns: SKUCostBreakdown[] = [];

      // Calculate per SKU costs
      skus.forEach(sku => {
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
        
        // Calculate containers needed
        const skuContainers = Math.ceil(sku.quantity / sku.unitsPerContainer);
        totalContainersNeeded += skuContainers;
        
        // Calculate container costs for this SKU
        const containerCosts = skuContainers * CONTAINER_FIXED_COSTS;
        
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
          dimensions: `${carton.length}×${carton.width}×${carton.height} cm`
        });
      });

      // Calculate container utilization
      const totalUnits = skus.reduce((sum, sku) => sum + sku.quantity, 0);
      const totalCapacity = totalContainersNeeded * skus[0].unitsPerContainer; // Using first SKU's unitsPerContainer as reference
      const utilization = (totalUnits / totalCapacity) * 100;

      setTotalContainers(totalContainersNeeded);
      setCostBreakdown(skuBreakdowns);
      setTotalCost(skuBreakdowns.reduce((sum, sku) => sum + sku.totalCost, 0));
      setContainerUtilization(utilization);
    };

    calculateCosts();
  }, [skus, candidateCartons, costConfig]);

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

  // Prepare container cost breakdown
  const prepareContainerCostDetails = () => {
    return [
      { name: 'Freight', value: CONTAINER_COSTS.freight * totalContainers },
      { name: 'Terminal Handling', value: CONTAINER_COSTS.terminalHandling * totalContainers },
      { name: 'Port Processing', value: CONTAINER_COSTS.portProcessing * totalContainers },
      { name: 'Documentation', value: CONTAINER_COSTS.documentation * totalContainers },
      { name: 'Inspection', value: CONTAINER_COSTS.inspection * totalContainers },
      { name: 'Customs Clearance', value: CONTAINER_COSTS.customsClearance * totalContainers },
      { name: 'Port Charges', value: CONTAINER_COSTS.portCharges * totalContainers },
      { name: 'Deferment Fee', value: CONTAINER_COSTS.deferment * totalContainers },
      { name: 'Haulage', value: CONTAINER_COSTS.haulage * totalContainers },
      { name: 'Container Unloading', value: CONTAINER_COSTS.unloading * totalContainers }
    ];
  };

  // Colors for charts
  const colors = {
    container: '#3b82f6',
    carton: '#0891b2',
    pallet: '#22c55e',
    pieColors: ['#3b82f6', '#0891b2', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
      <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Part 3: Container Optimization</h2>

      {/* SKU Inputs */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-700">SKU Configuration</h3>
          <button
            onClick={addSku}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all text-sm"
          >
            Add SKU
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">SKU Name</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Carton Configuration</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Quantity</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Units Per Container</th>
                <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {skus.map((sku) => (
                <tr key={sku.id}>
                  <td className="py-2 px-3 border">
                    <input
                      type="text"
                      className="w-full p-1 border rounded"
                      value={sku.skuName}
                      onChange={(e) => updateSku(sku.id, 'skuName', e.target.value)}
                    />
                  </td>
                  <td className="py-2 px-3 border">
                    <select 
                      className="w-full p-1 border rounded"
                      value={sku.cartonId}
                      onChange={(e) => updateSku(sku.id, 'cartonId', parseInt(e.target.value))}
                    >
                      {candidateCartons.map(carton => (
                        <option key={carton.id} value={carton.id}>
                          {carton.length}×{carton.width}×{carton.height} cm ({carton.unitsPerCarton} units/carton)
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-3 border">
                    <input
                      type="number"
                      className="w-full p-1 border rounded"
                      value={sku.quantity}
                      onChange={(e) => updateSku(sku.id, 'quantity', parseInt(e.target.value) || 0)}
                    />
                  </td>
                  <td className="py-2 px-3 border">
                    <input
                      type="number"
                      className="w-full p-1 border rounded"
                      value={sku.unitsPerContainer}
                      onChange={(e) => updateSku(sku.id, 'unitsPerContainer', parseInt(e.target.value) || 0)}
                    />
                  </td>
                  <td className="py-2 px-3 border text-center">
                    <button
                      onClick={() => removeSku(sku.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-all text-xs"
                      disabled={skus.length <= 1}
                    >
                      Remove
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
                Total Units: {skus.reduce((sum, sku) => sum + sku.quantity, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                Container Capacity: {(totalContainers * skus[0]?.unitsPerContainer || 0).toLocaleString()} units
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
                <span>{formatCurrency(totalCost / skus.reduce((sum, sku) => sum + sku.quantity, 0))}</span>
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
                  <Tooltip formatter={(value) => formatCurrency(value)} />
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
                <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">Containers</th>
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
                  <td className="py-2 px-3 text-center border">{skuCost.totalContainers}</td>
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

      {/* Detailed Container Cost Analysis */}
      <div>
        <h3 className="font-semibold text-gray-700 mb-3">Detailed Container Cost Analysis</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Container Cost Components</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={prepareContainerCostDetails()}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                <YAxis dataKey="name" type="category" />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="value" fill={colors.container} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2 text-sm text-gray-600">
            Total Container Cost: {formatCurrency(CONTAINER_FIXED_COSTS * totalContainers)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Part3ContainerOptimization;