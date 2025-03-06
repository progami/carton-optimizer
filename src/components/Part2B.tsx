import { useState, useEffect } from 'react';
import { useCarton, useCostConfig } from '../contexts/CartonContext';
import { formatCurrency } from '../utils/formatters';
import {
  generateComparativeData,
  generateComparativeCurves
} from '../utils/calculators';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, BarChart, Bar
} from 'recharts';

interface TooltipProps {
  active?: boolean;
  payload?: Array<any>;
  label?: string | number;
}

const CostOptimization = () => {
  const { candidateCartons } = useCarton();
  const { costConfig, setCostConfig } = useCostConfig();
  const [optimized, setOptimized] = useState(false);
  
  // Add state for the active SKU
  const [activeSku, setActiveSku] = useState<string>('');
  
  // Get all unique SKUs from the carton list
  const availableSkus = [...new Set(candidateCartons.map(c => c.skuId))];
  
  // Set the initial active SKU
  useEffect(() => {
    if (availableSkus.length > 0 && !activeSku) {
      setActiveSku(availableSkus[0]);
    }
  }, [availableSkus, activeSku]);

  // Get all cartons for the active SKU
  const skuCartons = candidateCartons.filter(c => c.skuId === activeSku);

  // Generate comparative data only for the cartons of the active SKU
  const comparativeData = generateComparativeData(costConfig.totalDemand, skuCartons, costConfig);
  
  // Generate data for comparative cost curves for the active SKU
  const comparativeCurveData = generateComparativeCurves(skuCartons, costConfig);

  // Find the optimal configuration with the lowest cost per unit for this SKU
  const optimalConfig = comparativeData.reduce(
    (best, current) => current.costPerUnit < best.costPerUnit ? current : best,
    comparativeData[0] || { costPerUnit: 0, cartonId: 0 }
  );
  
  // Function to optimize quantity to fully utilize pallets
  const optimizeQuantity = () => {
    if (!optimalConfig || !optimalConfig.cartonId) return;
    
    const optimalCarton = skuCartons.find(c => c.id === optimalConfig.cartonId);
    if (!optimalCarton) return;

    const unitsPerCarton = optimalCarton.unitsPerCarton;
    const cartonsPerPallet = optimalCarton.cartonsPerPallet;
    
    // Calculate current cartons needed
    const currentCartons = Math.ceil(costConfig.totalDemand / unitsPerCarton);
    
    // Calculate current pallets needed
    const currentPallets = Math.ceil(currentCartons / cartonsPerPallet);
    
    // Calculate the carton count to exactly fill all pallets
    const optimizedCartons = currentPallets * cartonsPerPallet;
    
    // Calculate the optimized unit quantity
    const optimizedQuantity = optimizedCartons * unitsPerCarton;
    
    // Update the quantity
    setCostConfig({...costConfig, totalDemand: optimizedQuantity});
    setOptimized(true);
    
    // Reset optimized flag after 2 seconds (for feedback animation)
    setTimeout(() => setOptimized(false), 2000);
  };

  // Calculate detailed cost breakdown for any carton
  const calculateDetailedCosts = (cartonId: number) => {
    const cartonData = comparativeData.find(d => d.cartonId === cartonId);
    if (!cartonData) return null;
    
    const carton = skuCartons.find(c => c.id === cartonId);
    if (!carton) return null;
    
    // Get base data
    const totalCartons = cartonData.totalCartons;
    const totalPallets = cartonData.totalPallets;
    const totalCost = cartonData.totalCost;
    
    // Calculate specific costs
    const C1_cartonHandling = totalCartons * costConfig.cartonHandlingCost;
    const C2_cartonUnloading = totalCartons * costConfig.cartonUnloadingCost;
    const C3_palletHandling = totalPallets * costConfig.palletHandlingCost;
    const C4_storage = totalPallets * costConfig.palletStorageCostPerWeek * costConfig.storageWeeks;
    const C5_transportation = costConfig.transportMode === 'ltl' 
      ? totalPallets * costConfig.ltlCostPerPallet 
      : Math.ceil(totalPallets / costConfig.palletsPerTruck) * costConfig.ftlCostPerTruck;
    
    // Calculate cost per unit
    const C1_perUnit = C1_cartonHandling / costConfig.totalDemand;
    const C2_perUnit = C2_cartonUnloading / costConfig.totalDemand;
    const C3_perUnit = C3_palletHandling / costConfig.totalDemand;
    const C4_perUnit = C4_storage / costConfig.totalDemand;
    const C5_perUnit = C5_transportation / costConfig.totalDemand;
    
    // Calculate percentages
    const C1_percent = (C1_cartonHandling / totalCost) * 100;
    const C2_percent = (C2_cartonUnloading / totalCost) * 100;
    const C3_percent = (C3_palletHandling / totalCost) * 100;
    const C4_percent = (C4_storage / totalCost) * 100;
    const C5_percent = (C5_transportation / totalCost) * 100;
    
    return {
      // Detailed costs
      C1_cartonHandling, C2_cartonUnloading, C3_palletHandling, C4_storage, C5_transportation,
      // Per unit costs
      C1_perUnit, C2_perUnit, C3_perUnit, C4_perUnit, C5_perUnit,
      // Percentages
      C1_percent, C2_percent, C3_percent, C4_percent, C5_percent,
      // Aggregated costs
      cartonCosts: C1_cartonHandling + C2_cartonUnloading,
      palletCosts: C3_palletHandling + C4_storage + C5_transportation,
      // Base data
      totalCartons, totalPallets, totalCost,
      carton
    };
  };

  // Prepare data for detailed cost component chart
  const prepareDetailedComponentData = () => {
    const result = [];
    
    for (const data of comparativeData) {
      const costs = calculateDetailedCosts(data.cartonId);
      if (!costs) continue;
      
      result.push({
        name: data.dimensions,
        C1_handling: costs.C1_perUnit,
        C2_unloading: costs.C2_perUnit,
        C3_palletHandling: costs.C3_perUnit,
        C4_storage: costs.C4_perUnit,
        C5_transport: costs.C5_perUnit,
        isOptimal: data.cartonId === optimalConfig.cartonId
      });
    }
    
    return result;
  };

  // Get detailed costs for optimal config
  const optimalCosts = optimalConfig && optimalConfig.cartonId ? calculateDetailedCosts(optimalConfig.cartonId) : null;
  
  // Prepare data for component chart
  const detailedComponentData = prepareDetailedComponentData();

  // Custom tooltip for cost curves
  const ComparativeCurvesTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip bg-white p-2 border border-gray-200 shadow-sm rounded-md">
          <p className="font-medium text-sm mb-1">Quantity: {typeof label === 'number' ? Math.round(label).toLocaleString() : label}</p>
          {payload.map((entry: any) => {
            const cartonId = entry.dataKey.split('_')[1];
            const dimensionKey = `carton_${cartonId}_dim`;
            const dimensions = payload[0].payload[dimensionKey];

            return (
              <p key={entry.dataKey} className="text-xs flex justify-between" style={{ color: entry.color }}>
                <span>{dimensions} cm:</span>
                <span className="ml-2 font-medium">{formatCurrency(entry.value)}</span>
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Colors for charts
  const colors = {
    optimal: '#15803d',
    highCost: '#dc2626',
    mediumCost: '#f59e0b',
    C1: '#0891b2',  // Cyan - carton handling
    C2: '#06b6d4',  // Darker cyan - carton unloading
    C3: '#a7f3d0',  // Light green - pallet handling
    C4: '#22c55e',  // Medium green - storage
    C5: '#4ade80'   // Light green - transport
  };

  // Find selected carton
  const selectedOptimalCarton = skuCartons.find(c => c.id === (optimalConfig?.cartonId || 0));

  return (
    <>
      <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Part 2B: Cost Optimization</h2>

        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">Comparative Analysis</h3>
          <p className="text-sm text-gray-600 mb-4">
            This page compares carton configurations for a single SKU to find the optimal size.
            Select the SKU and quantity to optimize for your specific needs.
          </p>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* SKU Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select SKU</label>
                <select
                  className="w-full p-2 border rounded"
                  value={activeSku}
                  onChange={(e) => setActiveSku(e.target.value)}
                >
                  {availableSkus.map(sku => (
                    <option key={sku} value={sku}>{sku}</option>
                  ))}
                </select>
              </div>
              
              {/* Quantity Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Analysis Quantity</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={costConfig.totalDemand}
                    className="w-full p-2 border rounded"
                    onChange={(e) => setCostConfig({...costConfig, totalDemand: parseFloat(e.target.value) || 0})}
                  />
                  <button
                    onClick={optimizeQuantity}
                    className={`px-3 py-2 ${optimized ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'} rounded hover:bg-blue-600 transition-all text-sm`}
                    disabled={!selectedOptimalCarton}
                  >
                    {optimized ? 'Optimized!' : 'Optimize'}
                  </button>
                </div>
              </div>
              
              {/* Number of Configurations */}
              <div className="flex items-end">
                <div className="bg-blue-50 p-2 rounded w-full">
                  <span className="text-sm text-blue-700">
                    {skuCartons.length} carton configuration{skuCartons.length !== 1 ? 's' : ''} available for {activeSku}
                  </span>
                </div>
              </div>
            </div>

            {skuCartons.length === 0 ? (
              <div className="p-4 bg-amber-50 text-amber-700 rounded text-center">
                No carton configurations found for this SKU. Please add configurations in Part 1.
              </div>
            ) : (
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full bg-white border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Carton Dimensions</th>
                      <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">Units/Carton</th>
                      <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">Cartons/Pallet</th>
                      <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">Total Cartons</th>
                      <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">Total Pallets</th>
                      <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border">Total Cost</th>
                      <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border">Cost/Unit</th>
                      <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {comparativeData.map((data, index) => (
                      <tr 
                        key={index} 
                        className={data.cartonId === optimalConfig.cartonId ? 'bg-green-50' : ''}
                      >
                        <td className="py-2 px-3 text-sm border">{data.dimensions}</td>
                        <td className="py-2 px-3 text-center text-sm border">{data.unitsPerCarton}</td>
                        <td className="py-2 px-3 text-center text-sm border">{data.cartonsPerPallet}</td>
                        <td className="py-2 px-3 text-center text-sm border">{data.totalCartons}</td>
                        <td className="py-2 px-3 text-center text-sm border">{data.totalPallets}</td>
                        <td className="py-2 px-3 text-right text-sm border">{formatCurrency(data.totalCost)}</td>
                        <td className="py-2 px-3 text-right font-medium border">{formatCurrency(data.costPerUnit)}</td>
                        <td className="py-2 px-3 text-center border">
                          {data.cartonId === optimalConfig.cartonId ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Optimal
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              +{((data.costPerUnit - optimalConfig.costPerUnit) / optimalConfig.costPerUnit * 100).toFixed(1)}%
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {skuCartons.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Cost Curve Graph */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Cost Curve Comparison</h3>
              <p className="text-sm text-gray-600 mb-2">
                This graph plots the cost per unit against quantity, showing how costs change as volume increases.
              </p>
              <div className="h-72 bg-white rounded-lg p-3 border">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={comparativeCurveData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="quantity"
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <YAxis
                      label={{ value: 'Cost per Unit (£)', angle: -90, position: 'insideLeft' }}
                      tickFormatter={(value) => `£${value.toFixed(2)}`}
                    />
                    <Tooltip content={<ComparativeCurvesTooltip />} />
                    <Legend />
                    {skuCartons.map((carton) => (
                      <Line
                        key={carton.id}
                        type="monotone"
                        dataKey={`carton_${carton.id}`}
                        stroke={
                          carton.id === optimalConfig.cartonId ? colors.optimal : colors.mediumCost
                        }
                        name={`${carton.length}×${carton.width}×${carton.height} cm`}
                        activeDot={{ r: 8 }}
                        strokeWidth={carton.id === optimalConfig.cartonId ? 2 : 1}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cost Component Breakdown */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Cost Component Breakdown</h3>
              <div className="h-72 bg-white p-3 rounded-lg border flex flex-col">
                <div className="flex-grow">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={detailedComponentData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        type="number" 
                        tickFormatter={(value) => `£${value.toFixed(2)}`}
                      />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={80}
                      />
                      <Tooltip 
                        formatter={(value) => [`£${Number(value).toFixed(3)}`, 'Cost per unit']} 
                      />
                      <Legend />
                      <Bar dataKey="C1_handling" name="C₁: Carton Handling" stackId="a" fill={colors.C1} />
                      <Bar dataKey="C2_unloading" name="C₂: Carton Unloading" stackId="a" fill={colors.C2} />
                      <Bar dataKey="C3_palletHandling" name="C₃: Pallet Handling" stackId="a" fill={colors.C3} />
                      <Bar dataKey="C4_storage" name="C₄: Storage" stackId="a" fill={colors.C4} />
                      <Bar dataKey="C5_transport" name="C₅: Transportation" stackId="a" fill={colors.C5} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Optimal Solution */}
        {optimalCosts && selectedOptimalCarton && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-5">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center mr-4 shadow">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-800">Optimal Carton Configuration for {activeSku}</h3>
                <p className="text-green-600">For {costConfig.totalDemand.toLocaleString()} units</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Left Column - Configuration Details */}
              <div className="col-span-1 bg-white rounded-lg p-4 shadow">
                <h4 className="text-lg font-semibold text-gray-700 mb-3 pb-2 border-b">Configuration</h4>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-500">Carton Dimensions</div>
                    <div className="text-2xl font-bold text-gray-800">{selectedOptimalCarton?.length}×{selectedOptimalCarton?.width}×{selectedOptimalCarton?.height} <span className="text-lg font-normal">cm</span></div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">Units per Carton</div>
                    <div className="text-2xl font-bold text-gray-800">{selectedOptimalCarton?.unitsPerCarton}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Cartons per Pallet</div>
                    <div className="text-xl font-bold text-gray-800">{selectedOptimalCarton?.cartonsPerPallet}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">Total Pallets</div>
                    <div className="text-xl font-bold text-gray-800">{optimalCosts.totalPallets}</div>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t">
                  <div className="text-sm text-gray-500">Transport Mode</div>
                  <div className="text-lg font-medium text-gray-800">{costConfig.transportMode.toUpperCase()}</div>
                </div>
              </div>
              
              {/* Middle Column - Cost Breakdown */}
              <div className="col-span-1 bg-white rounded-lg p-4 shadow">
                <h4 className="text-lg font-semibold text-gray-700 mb-3 pb-2 border-b">Detailed Cost Breakdown</h4>
                
                <div className="space-y-3">
                  {/* C1: Carton Handling */}
                  <div className="flex items-center">
                    <div className="w-3 h-3 mr-2 flex-shrink-0" style={{ backgroundColor: colors.C1 }}></div>
                    <div className="flex-grow">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">C₁: Carton Handling</span>
                        <span className="text-sm">{formatCurrency(optimalCosts.C1_perUnit)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {optimalCosts.totalCartons} cartons × £{costConfig.cartonHandlingCost.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  {/* C2: Carton Unloading */}
                  <div className="flex items-center">
                    <div className="w-3 h-3 mr-2 flex-shrink-0" style={{ backgroundColor: colors.C2 }}></div>
                    <div className="flex-grow">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">C₂: Carton Unloading</span>
                        <span className="text-sm">{formatCurrency(optimalCosts.C2_perUnit)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {optimalCosts.totalCartons} cartons × £{costConfig.cartonUnloadingCost.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  {/* C3: Pallet Handling */}
                  <div className="flex items-center">
                    <div className="w-3 h-3 mr-2 flex-shrink-0" style={{ backgroundColor: colors.C3 }}></div>
                    <div className="flex-grow">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">C₃: Pallet Handling</span>
                        <span className="text-sm">{formatCurrency(optimalCosts.C3_perUnit)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {optimalCosts.totalPallets} pallets × £{costConfig.palletHandlingCost.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  {/* C4: Storage */}
                  <div className="flex items-center">
                    <div className="w-3 h-3 mr-2 flex-shrink-0" style={{ backgroundColor: colors.C4 }}></div>
                    <div className="flex-grow">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">C₄: Storage</span>
                        <span className="text-sm">{formatCurrency(optimalCosts.C4_perUnit)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {optimalCosts.totalPallets} pallets × £{costConfig.palletStorageCostPerWeek.toFixed(2)} × {costConfig.storageWeeks} weeks
                      </div>
                    </div>
                  </div>
                  
                  {/* C5: Transportation */}
                  <div className="flex items-center">
                    <div className="w-3 h-3 mr-2 flex-shrink-0" style={{ backgroundColor: colors.C5 }}></div>
                    <div className="flex-grow">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">C₅: Transportation</span>
                        <span className="text-sm">{formatCurrency(optimalCosts.C5_perUnit)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {costConfig.transportMode === 'ltl' 
                          ? `${optimalCosts.totalPallets} pallets × £${costConfig.ltlCostPerPallet.toFixed(2)}` 
                          : `${Math.ceil(optimalCosts.totalPallets / costConfig.palletsPerTruck)} trucks × £${costConfig.ftlCostPerTruck.toFixed(2)}`
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Column - Cost Totals */}
              <div className="col-span-1 bg-white rounded-lg p-4 shadow">
                <h4 className="text-lg font-semibold text-gray-700 mb-3 pb-2 border-b">Cost Summary</h4>
                
                <div className="space-y-5">
                  {/* Carton Related Costs */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Carton Related Costs (C₁+C₂)</span>
                      <span className="text-sm font-medium">{formatCurrency(optimalCosts.cartonCosts)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-cyan-500 h-1.5 rounded-full" 
                        style={{ width: `${(optimalCosts.C1_percent + optimalCosts.C2_percent)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-right text-gray-500 mt-1">
                      {(optimalCosts.C1_percent + optimalCosts.C2_percent).toFixed(1)}% of total
                    </div>
                  </div>
                  
                  {/* Pallet Related Costs */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Pallet Related Costs (C₃+C₄+C₅)</span>
                      <span className="text-sm font-medium">{formatCurrency(optimalCosts.palletCosts)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-green-500 h-1.5 rounded-full" 
                        style={{ width: `${(optimalCosts.C3_percent + optimalCosts.C4_percent + optimalCosts.C5_percent)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-right text-gray-500 mt-1">
                      {(optimalCosts.C3_percent + optimalCosts.C4_percent + optimalCosts.C5_percent).toFixed(1)}% of total
                    </div>
                  </div>
                  
                  {/* Total Cost */}
                  <div className="pt-3 mt-3 border-t">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Total Cost</div>
                        <div className="text-2xl font-bold text-green-700">{formatCurrency(optimalCosts.totalCost)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Cost per Unit</div>
                        <div className="text-2xl font-bold text-green-700">{formatCurrency(optimalConfig.costPerUnit)}</div>
                      </div>
                    </div>
                    
                    {comparativeData.length > 1 && (
                      <div className="mt-4">
                        <div className="text-xs text-gray-500">Cost Savings vs. Next Best Option</div>
                        <div className="text-lg font-semibold text-green-700">
                          {(() => {
                            const nextBest = comparativeData
                              .filter(d => d.cartonId !== optimalConfig.cartonId)
                              .reduce((min, curr) => curr.costPerUnit < min.costPerUnit ? curr : min, comparativeData[0]);
                            
                            const savings = nextBest.costPerUnit - optimalConfig.costPerUnit;
                            const savingsPercent = (savings / nextBest.costPerUnit) * 100;
                            
                            return `${formatCurrency(savings * costConfig.totalDemand)} (${savingsPercent.toFixed(1)}%)`;
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CostOptimization;