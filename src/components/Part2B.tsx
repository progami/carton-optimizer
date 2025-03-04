// src/components/Part2B.tsx
import { useState } from 'react';
import { useCarton, useCostConfig } from '../contexts/CartonContext';
import { useCostCalculation } from '../hooks/useCostCalculation';
import { formatCurrency } from '../utils/formatters';
import {
  generateComparativeData,
  generateComparativeCurves
} from '../utils/calculators';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, BarChart, Bar
} from 'recharts';

interface CartonUtilization {
  percentage: number;
  lastPalletCartons: number;
  isFullyOptimized: boolean;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<any>;
  label?: string | number;
}

const CostOptimization = () => {
  const { candidateCartons } = useCarton();
  const { costConfig, setCostConfig } = useCostConfig();
  const [optimized, setOptimized] = useState(false);

  // Generate comparative data for all carton configurations
  const comparativeData = generateComparativeData(costConfig.totalDemand, candidateCartons, costConfig);
  
  // Generate data for comparative cost curves
  const comparativeCurveData = generateComparativeCurves(candidateCartons, costConfig);

  // Find the optimal configuration with the lowest cost per unit
  const optimalConfig = comparativeData.reduce(
    (best, current) => current.costPerUnit < best.costPerUnit ? current : best,
    comparativeData[0]
  );
  
  // Calculate utilization percentage for selected configuration
  const calculateUtilization = (cartonId: number): CartonUtilization | null => {
    const carton = candidateCartons.find(c => c.id === cartonId);
    if (!carton) return null;
    
    const unitsPerCarton = carton.unitsPerCarton;
    const cartonsPerPallet = carton.cartonsPerPallet;
    
    // Calculate current cartons needed
    const currentCartons = Math.ceil(costConfig.totalDemand / unitsPerCarton);
    
    // Calculate the utilization of the last pallet
    const cartonsInLastPallet = currentCartons % cartonsPerPallet || cartonsPerPallet;
    const utilizationPercentage = (cartonsInLastPallet / cartonsPerPallet) * 100;
    
    return {
      percentage: utilizationPercentage,
      lastPalletCartons: cartonsInLastPallet,
      isFullyOptimized: utilizationPercentage === 100
    };
  };
  
  // Function to optimize quantity to fully utilize pallets
  const optimizeQuantity = () => {
    const optimalCarton = candidateCartons.find(c => c.id === optimalConfig.cartonId);
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

  // Get utilization data for the optimal configuration
  const optimalUtilization = calculateUtilization(optimalConfig.cartonId);

  // Custom tooltip for cost curves
  const ComparativeCurvesTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip bg-white p-2 border border-gray-200 shadow-sm rounded-md">
          <p className="font-medium text-sm mb-1">Quantity: {typeof label === 'number' ? Math.round(label).toLocaleString() : label}</p>
          {payload.map((entry: any, index: number) => {
            const cartonId = entry.dataKey.split('_')[1];
            const dimensionKey = `carton_${cartonId}_dim`;
            const dimensions = payload[0].payload[dimensionKey];

            return (
              <p key={index} className="text-xs flex justify-between" style={{ color: entry.color }}>
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
    optimal: '#16a34a',
    neutral: '#94a3b8'
  };

  return (
    <>
      <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Part 2B: Cost Optimization</h2>

        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Comparative Analysis</h3>
          <p className="text-sm text-gray-600 mb-4">
            This page compares all carton configurations from Part 1 using the cost function from Part 2A.
            Select a quantity to find the optimal configuration for your shipment.
          </p>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="mb-4">
              <div className="flex flex-wrap justify-between items-end">
                <div className="w-full md:w-auto mb-4 md:mb-0">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Analysis Quantity</label>
                  <div className="flex max-w-md items-center space-x-2">
                    <input
                      type="number"
                      value={costConfig.totalDemand}
                      className="w-full md:w-48 p-2 border rounded"
                      onChange={(e) => setCostConfig({...costConfig, totalDemand: parseFloat(e.target.value) || 0})}
                    />
                    <button
                      onClick={optimizeQuantity}
                      className={`px-3 py-2 ${optimized ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'} rounded hover:bg-blue-600 transition-all text-sm`}
                      title="Adjust quantity to efficiently fill pallets with the optimal configuration"
                    >
                      {optimized ? 'Optimized!' : 'Optimize Quantity'}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Utilization indicator */}
              {optimalUtilization && !optimalUtilization.isFullyOptimized && (
                <div className="mt-2 text-xs text-amber-600">
                  Last pallet is only {Math.round(optimalUtilization.percentage)}% utilized 
                  ({optimalUtilization.lastPalletCartons} of {candidateCartons.find(c => c.id === optimalConfig.cartonId)?.cartonsPerPallet || '-'} cartons)
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carton Dimensions</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units/Carton</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cartons/Pallet</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cartons</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Pallets</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost/Unit</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {comparativeData.map((data, index) => (
                    <tr 
                      key={index} 
                      className={data.cartonId === optimalConfig.cartonId ? 'bg-green-50' : ''}
                    >
                      <td className="py-2 px-3">{data.dimensions}</td>
                      <td className="py-2 px-3">{data.unitsPerCarton}</td>
                      <td className="py-2 px-3">{data.cartonsPerPallet}</td>
                      <td className="py-2 px-3">{data.totalCartons}</td>
                      <td className="py-2 px-3">{data.totalPallets}</td>
                      <td className="py-2 px-3">{formatCurrency(data.totalCost)}</td>
                      <td className="py-2 px-3">{formatCurrency(data.costPerUnit)}</td>
                      <td className="py-2 px-3">
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
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Cost Curve Comparison</h3>
            <p className="text-sm text-gray-600 mb-2">
              This graph plots the cost per unit against quantity for each candidate configuration, 
              showing how costs change as volume increases.
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
                    label={{ value: 'Quantity', position: 'insideBottomRight', offset: -10 }}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <YAxis
                    label={{ value: 'Cost per Unit (£)', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => `£${value.toFixed(2)}`}
                  />
                  <Tooltip content={<ComparativeCurvesTooltip />} />
                  <Legend />
                  {candidateCartons.map((carton) => (
                    <Line
                      key={carton.id}
                      type="monotone"
                      dataKey={`carton_${carton.id}`}
                      stroke={
                        carton.id === optimalConfig.cartonId ? colors.optimal : colors.neutral
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

          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Optimal Solution</h3>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-green-800">Optimal Carton Configuration</h4>
                  <p className="text-sm text-green-600">For {costConfig.totalDemand.toLocaleString()} units</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white p-3 rounded">
                  <div className="text-xs text-gray-500">Carton Dimensions</div>
                  <div className="text-lg font-medium">{optimalConfig.dimensions}</div>
                </div>
                <div className="bg-white p-3 rounded">
                  <div className="text-xs text-gray-500">Units per Carton</div>
                  <div className="text-lg font-medium">{optimalConfig.unitsPerCarton}</div>
                </div>
                <div className="bg-white p-3 rounded">
                  <div className="text-xs text-gray-500">Cartons per Pallet</div>
                  <div className="text-lg font-medium">{optimalConfig.cartonsPerPallet}</div>
                </div>
                <div className="bg-white p-3 rounded">
                  <div className="text-xs text-gray-500">Total Pallets Required</div>
                  <div className="text-lg font-medium">{optimalConfig.totalPallets}</div>
                </div>
              </div>

              {/* Simultaneous Cost Component Comparison */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Cost Component Breakdown</div>
                <div className="h-40 bg-white rounded-lg p-2 border">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={comparativeData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        type="number"
                        tickFormatter={(value: number) => `£${value.toFixed(2)}`}
                      />
                      <YAxis 
                        dataKey="dimensions" 
                        type="category"
                        width={100}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`£${value.toFixed(3)}`, 'Cost per unit']}
                      />
                      <Legend />
                      <Bar 
                        name="Carton Related" 
                        dataKey="cartonCostPerUnit" 
                        stackId="a" 
                        fill="#0891b2" 
                      />
                      <Bar 
                        name="Storage" 
                        dataKey="storageCostPerUnit" 
                        stackId="a" 
                        fill="#22c55e" 
                      />
                      <Bar 
                        name="Transportation" 
                        dataKey="transportCostPerUnit" 
                        stackId="a" 
                        fill="#4ade80" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="bg-cyan-50 p-3 rounded">
                  <div className="text-xs text-cyan-800 font-medium">Carton Costs</div>
                  <div className="text-lg font-medium">{formatCurrency(optimalConfig.cartonCosts)}</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-xs text-green-800 font-medium">Storage Costs</div>
                  <div className="text-lg font-medium">{formatCurrency(optimalConfig.storageCosts)}</div>
                </div>
                <div className="bg-indigo-50 p-3 rounded">
                  <div className="text-xs text-indigo-800 font-medium">Transport Costs</div>
                  <div className="text-lg font-medium">{formatCurrency(optimalConfig.transportCosts)}</div>
                </div>
              </div>

              <div className="p-3 bg-green-100 rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-green-800 font-medium">Total Cost</div>
                    <div className="text-lg font-bold">{formatCurrency(optimalConfig.totalCost)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-green-800 font-medium">Cost per Unit</div>
                    <div className="text-lg font-bold">{formatCurrency(optimalConfig.costPerUnit)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CostOptimization;