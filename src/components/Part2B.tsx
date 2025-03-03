// src/components/Part2B.tsx
import React from 'react';
import { useCarton, useCostConfig } from '../contexts/CartonContext';
import { useCostCalculation } from '../hooks/useCostCalculation';
import { formatCurrency } from '../utils/formatters';
import {
  generateComparativeData,
  generateOptimalConfigByQuantity,
  generateComparativeCurves
} from '../utils/calculators';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ComposedChart, Bar
} from 'recharts';

const CostOptimization = () => {
  const { candidateCartons } = useCarton();
  const { costConfig, setCostConfig } = useCostConfig();
  const { analysisResults } = useCostCalculation();

  const comparativeData = generateComparativeData(costConfig.totalDemand, candidateCartons, costConfig);
  const optimalByQuantity = generateOptimalConfigByQuantity(candidateCartons, costConfig);
  const comparativeCurveData = generateComparativeCurves(candidateCartons, costConfig);

  const optimalConfig = comparativeData.reduce(
    (best, current) => current.costPerUnit < best.costPerUnit ? current : best,
    comparativeData[0]
  );

  // Custom tooltip for cost curves
  const ComparativeCurvesTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip bg-white p-2 border border-gray-200 shadow-sm rounded-md">
          <p className="font-medium text-sm mb-1">Quantity: {Math.round(label)}</p>
          {payload.map((entry, index) => {
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

  return (
    <>
      <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Part 2B: Cost Optimization</h2>

        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Comparative Analysis</h3>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Analysis Quantity</label>
              <div className="flex max-w-md">
                <input
                  type="number"
                  value={costConfig.totalDemand}
                  className="flex-1 p-2 border rounded"
                  onChange={(e) => setCostConfig({...costConfig, totalDemand: parseFloat(e.target.value) || 0})}
                />
              </div>
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
                    <tr key={index} className={data.cartonId === optimalConfig.cartonId ? 'bg-green-50' : ''}>
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
            <div className="h-64 bg-white rounded-lg p-3">
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
                        carton.id === 1 ? '#0891b2' :
                        carton.id === 2 ? '#16a34a' :
                        carton.id === 3 ? '#4f46e5' :
                        `#${Math.floor(Math.random()*16777215).toString(16)}`
                      }
                      name={`${carton.length}×${carton.width}×${carton.height} cm`}
                      activeDot={{ r: 8 }}
                      strokeWidth={carton.id === optimalConfig.cartonId ? 2 : 1}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <p>This graph overlays cost per unit curves for all carton configurations,
              clearly showing which configuration is optimal at different quantity levels.</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Optimal Solution</h3>
            <div className="p-4 bg-green-50 rounded-lg">
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="bg-cyan-50 p-3 rounded">
                  <div className="text-xs text-cyan-800 font-medium">Carton Costs (C₁)</div>
                  <div className="text-lg font-medium">{formatCurrency(optimalConfig.cartonCosts)}</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-xs text-green-800 font-medium">Storage Costs (C₂)</div>
                  <div className="text-lg font-medium">{formatCurrency(optimalConfig.storageCosts)}</div>
                </div>
                <div className="bg-indigo-50 p-3 rounded">
                  <div className="text-xs text-indigo-800 font-medium">Transport Costs (C₃)</div>
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

        {/* Optimal Configuration by Quantity */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Optimal Configuration by Quantity</h3>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-3">
              Different carton configurations become optimal at different quantity levels.
              This table shows which configuration yields the lowest cost per unit at key quantity intervals.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Optimal Carton</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Per Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {optimalByQuantity.map((data, index) => (
                    <tr key={index}>
                      <td className="py-2 px-3">{data.quantity.toLocaleString()}</td>
                      <td className="py-2 px-3">{data.dimensions} cm</td>
                      <td className="py-2 px-3">{formatCurrency(data.costPerUnit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Optimization Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-cyan-50 rounded-lg">
              <h4 className="text-sm font-medium text-cyan-800 mb-2">Cost Structure</h4>
              <p className="text-sm text-gray-700">
                The optimal configuration balances the trade-off between carton-related costs and pallet-related costs to minimize the overall cost per unit.
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="text-sm font-medium text-green-800 mb-2">Quantity Breakpoints</h4>
              <p className="text-sm text-gray-700">
                Different carton configurations become optimal at different quantity levels due to the step-function nature of pallet costs.
              </p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <h4 className="text-sm font-medium text-indigo-800 mb-2">Transport Mode Efficiency</h4>
              <p className="text-sm text-gray-700">
                The cost comparison automatically evaluates whether LTL or FTL transport is more cost-effective for each configuration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CostOptimization;
