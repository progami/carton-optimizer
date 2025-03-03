import React, { useState } from 'react';
import { useCarton, useCostConfig, useProvider } from '../contexts/CartonContext';
import { useCostCalculation } from '../hooks/useCostCalculation';
import { formatCurrency } from '../utils/formatters';
import {
  generateScalingData,
  generateIntervalData,
  generateCostComponentsData
} from '../utils/calculators';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine, ComposedChart,
  Bar, Area, AreaChart, Pie
} from 'recharts';

const CostAnalysis = () => {
  const { candidateCartons } = useCarton();
  const { providerRates, updateProviderRate, handleProviderChange } = useProvider();
  const { costConfig, setCostConfig } = useCostConfig();
  const { analysisResults, selectedCartonId, setSelectedCartonId } = useCostCalculation();

  const [showDetailedTable, setShowDetailedTable] = useState(false);

  // Custom tooltip for cost components chart
  const CostComponentsTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip bg-white p-2 border border-gray-200 shadow-sm rounded-md">
          <p className="font-medium text-sm mb-1">Quantity: {Math.round(label)}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
          <p className="text-xs font-medium mt-1">
            Total: {formatCurrency(payload.reduce((sum, entry) => sum + entry.value, 0))}
          </p>
        </div>
      );
    }
    return null;
  };

  const maxQuantityToShow = Math.max(costConfig.totalDemand * 2, 20000);
  const scalingData = generateScalingData(maxQuantityToShow, selectedCartonId, selectedCartonId, candidateCartons, costConfig);
  const intervalData = generateIntervalData(selectedCartonId, selectedCartonId, candidateCartons, costConfig);
  const costComponentsData = generateCostComponentsData(scalingData);

  return (
    <>
      <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Part 2A: Cost Analysis</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* 3PL Selection */}
          <div className="col-span-1 md:col-span-3 bg-indigo-50 p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-indigo-800 mb-3">3PL Provider Selection</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex space-x-1">
                <button
                  onClick={() => handleProviderChange('fmc')}
                  className={`flex-1 py-2 px-4 rounded ${
                    costConfig.provider === 'fmc'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border hover:bg-gray-50'
                  }`}
                >
                  FMC
                </button>
                <button
                  onClick={() => handleProviderChange('vglobal')}
                  className={`flex-1 py-2 px-4 rounded ${
                    costConfig.provider === 'vglobal'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border hover:bg-gray-50'
                  }`}
                >
                  Vglobal
                </button>
                <button
                  onClick={() => handleProviderChange('4as')}
                  className={`flex-1 py-2 px-4 rounded ${
                    costConfig.provider === '4as'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border hover:bg-gray-50'
                  }`}
                >
                  4as
                </button>
              </div>

              {costConfig.provider && (
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 bg-white p-3 rounded">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Carton Handling</div>
                    <div className="text-sm font-medium">£{costConfig.cartonHandlingCost.toFixed(2)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Carton Unloading</div>
                    <div className="text-sm font-medium">£{costConfig.cartonUnloadingCost.toFixed(2)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Pallet Storage/Week</div>
                    <div className="text-sm font-medium">£{costConfig.palletStorageCostPerWeek.toFixed(2)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Pallet Handling</div>
                    <div className="text-sm font-medium">£{costConfig.palletHandlingCost.toFixed(2)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Carton-Related Costs (C₁) */}
          <div className="bg-cyan-50 p-4 rounded-lg">
            <h3 className="font-semibold text-cyan-800 mb-3">Carton-Related Costs (C₁)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carton Handling (£)</label>
                <input
                  type="number"
                  step="0.01"
                  value={costConfig.cartonHandlingCost}
                  className="w-full p-2 border rounded"
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setCostConfig({...costConfig, cartonHandlingCost: value});
                    updateProviderRate(costConfig.provider, 'cartonHandlingCost', value);
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carton Unloading (£)</label>
                <input
                  type="number"
                  step="0.01"
                  value={costConfig.cartonUnloadingCost}
                  className="w-full p-2 border rounded"
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setCostConfig({...costConfig, cartonUnloadingCost: value});
                    updateProviderRate(costConfig.provider, 'cartonUnloadingCost', value);
                  }}
                />
              </div>
            </div>
            <div className="mt-3 p-2 bg-white rounded">
              <div className="text-xs text-gray-500">Formula:</div>
              <div className="text-sm font-mono">C₁ = Total_cartons × (£{costConfig.cartonHandlingCost.toFixed(2)} + £{costConfig.cartonUnloadingCost.toFixed(2)})</div>
              <div className="text-xs text-gray-500 mt-1">Carton-related costs are calculated per carton and scale linearly with total cartons.</div>
            </div>
          </div>

          {/* Pallet-Related Storage Costs (C₂) */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-3">Pallet-Related Storage (C₂)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Storage Cost (£/week)</label>
                <input
                  type="number"
                  step="0.01"
                  value={costConfig.palletStorageCostPerWeek}
                  className="w-full p-2 border rounded"
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setCostConfig({...costConfig, palletStorageCostPerWeek: value});
                    updateProviderRate(costConfig.provider, 'palletStorageCostPerWeek', value);
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Storage Weeks</label>
                <input
                  type="number"
                  value={costConfig.storageWeeks}
                  className="w-full p-2 border rounded"
                  onChange={(e) => setCostConfig({...costConfig, storageWeeks: parseFloat(e.target.value)})}
                />
              </div>
            </div>
            <div className="mt-3 p-2 bg-white rounded">
              <div className="text-xs text-gray-500">Formula:</div>
              <div className="text-sm font-mono">C₂ = N_pallets × £{costConfig.palletStorageCostPerWeek.toFixed(2)} × {costConfig.storageWeeks} weeks</div>
              <div className="text-xs text-gray-500 mt-1">Storage costs depend on the number of pallets and storage duration.</div>
            </div>
          </div>

          {/* Pallet-Related Transport Costs (C₃) */}
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="font-semibold text-indigo-800 mb-3">Transport Costs (C₃)</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LTL Cost (£/pallet)</label>
                <input
                  type="number"
                  step="0.01"
                  value={costConfig.ltlCostPerPallet}
                  className="w-full p-2 border rounded"
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setCostConfig({...costConfig, ltlCostPerPallet: value});
                    updateProviderRate(costConfig.provider, 'ltlCostPerPallet', value);
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">FTL Cost (£/truck)</label>
                <input
                  type="number"
                  step="0.01"
                  value={costConfig.ftlCostPerTruck}
                  className="w-full p-2 border rounded"
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setCostConfig({...costConfig, ftlCostPerTruck: value});
                    updateProviderRate(costConfig.provider, 'ftlCostPerTruck', value);
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pallets/Truck</label>
                <input
                  type="number"
                  value={costConfig.palletsPerTruck}
                  className="w-full p-2 border rounded"
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setCostConfig({...costConfig, palletsPerTruck: value});
                    updateProviderRate(costConfig.provider, 'palletsPerTruck', value);
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pallet Handling (£)</label>
                <input
                  type="number"
                  step="0.01"
                  value={costConfig.palletHandlingCost}
                  className="w-full p-2 border rounded"
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setCostConfig({...costConfig, palletHandlingCost: value});
                    updateProviderRate(costConfig.provider, 'palletHandlingCost', value);
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transport Mode</label>
              <div className="flex space-x-1">
                <button
                  onClick={() => setCostConfig({...costConfig, transportMode: 'auto'})}
                  className={`flex-1 py-2 px-4 rounded ${
                    costConfig.transportMode === 'auto'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border hover:bg-gray-50'
                  }`}
                >
                  Auto (Min Cost)
                </button>
                <button
                  onClick={() => setCostConfig({...costConfig, transportMode: 'ltl'})}
                  className={`flex-1 py-2 px-4 rounded ${
                    costConfig.transportMode === 'ltl'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border hover:bg-gray-50'
                  }`}
                >
                  LTL Only
                </button>
                <button
                  onClick={() => setCostConfig({...costConfig, transportMode: 'ftl'})}
                  className={`flex-1 py-2 px-4 rounded ${
                    costConfig.transportMode === 'ftl'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border hover:bg-gray-50'
                  }`}
                >
                  FTL Only
                </button>
              </div>
            </div>

            <div className="p-2 bg-white rounded">
              <div className="text-xs text-gray-500">LTL Formula:</div>
              <div className="text-sm font-mono">LTL = N_pallets × £{costConfig.ltlCostPerPallet.toFixed(2)} + (N_pallets × £{costConfig.palletHandlingCost.toFixed(2)})</div>
              <div className="text-xs text-gray-500 mt-1">FTL Formula:</div>
              <div className="text-sm font-mono">FTL = ⌈N_pallets ÷ {costConfig.palletsPerTruck}⌉ × £{costConfig.ftlCostPerTruck.toFixed(2)} + (N_pallets × £{costConfig.palletHandlingCost.toFixed(2)})</div>
              <div className="text-xs text-gray-500 mt-1">
                {costConfig.transportMode === 'auto' ?
                  "The system automatically selects the minimum cost option." :
                  `The system uses ${costConfig.transportMode === 'ltl' ? 'LTL' : 'FTL'} for all calculations.`}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Configuration and Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-rose-50 p-4 rounded-lg">
            <h3 className="font-semibold text-rose-800 mb-3">Selected Configuration</h3>
            {candidateCartons.find(c => c.id === selectedCartonId) && (
              <div className="p-3 bg-white rounded-lg mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Carton: {candidateCartons.find(c => c.id === selectedCartonId).length}×
                  {candidateCartons.find(c => c.id === selectedCartonId).width}×
                  {candidateCartons.find(c => c.id === selectedCartonId).height} cm
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-xs text-gray-500">Units/Carton</div>
                  <div className="text-sm font-medium text-right">
                    {candidateCartons.find(c => c.id === selectedCartonId).unitsPerCarton}
                  </div>
                  <div className="text-xs text-gray-500">Cartons/Pallet</div>
                  <div className="text-sm font-medium text-right">
                    {candidateCartons.find(c => c.id === selectedCartonId).cartonsPerPallet}
                  </div>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Quantity</label>
              <div className="flex">
                <input
                  type="number"
                  value={costConfig.totalDemand}
                  className="flex-1 p-2 border rounded"
                  onChange={(e) => setCostConfig({...costConfig, totalDemand: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>

          {/* Cost Analysis Results */}
          {analysisResults && (
            <>
              <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Cost Analysis Results</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-xs text-gray-500">Total Cartons</div>
                    <div className="text-xl font-medium">{analysisResults.totalCartons}</div>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-xs text-gray-500">Total Pallets</div>
                    <div className="text-xl font-medium">{analysisResults.totalPallets}</div>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-xs text-gray-500">Best Transport</div>
                    <div className="text-xl font-medium">{analysisResults.transportMode}</div>
                    <div className="text-xs text-gray-500">{formatCurrency(analysisResults.ltlCost)} vs {formatCurrency(analysisResults.ftlCost)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div className="bg-cyan-50 p-3 rounded">
                    <div className="text-xs text-cyan-800 font-medium">C₁: Carton Costs</div>
                    <div className="text-lg font-medium">{formatCurrency(analysisResults.cartonCosts)}</div>
                    <div className="text-xs text-cyan-600">
                      {analysisResults.totalCartons} cartons × £{(costConfig.cartonHandlingCost + costConfig.cartonUnloadingCost).toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-xs text-green-800 font-medium">C₂: Storage Costs</div>
                    <div className="text-lg font-medium">{formatCurrency(analysisResults.storageCosts)}</div>
                    <div className="text-xs text-green-600">
                      {analysisResults.totalPallets} pallets × £{costConfig.palletStorageCostPerWeek.toFixed(2)} × {costConfig.storageWeeks} weeks
                    </div>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded">
                    <div className="text-xs text-indigo-800 font-medium">C₃: Transport Costs</div>
                    <div className="text-lg font-medium">{formatCurrency(analysisResults.transportCosts)}</div>
                    <div className="text-xs text-indigo-600">
                      {analysisResults.transportMode} transport with handling (£{analysisResults.palletHandlingCosts.toFixed(2)})
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-rose-100 rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-rose-800 font-medium">Total Cost</div>
                      <div className="text-xs text-rose-600">For {costConfig.totalDemand.toLocaleString()} units</div>
                    </div>
                    <div className="text-xl font-bold text-rose-800">{formatCurrency(analysisResults.totalCost)}</div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-rose-200 flex justify-between items-center">
                    <div className="text-sm text-rose-800 font-medium">Cost per Unit</div>
                    <div className="text-lg font-bold text-rose-800">{formatCurrency(analysisResults.costPerUnit)}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Cost vs. Quantity Chart */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Cost vs. Quantity Analysis</h3>
          <div className="h-64 bg-white rounded-lg p-3 mb-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={scalingData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="quantity"
                  label={{ value: 'Quantity', position: 'insideBottomRight', offset: -10 }}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <YAxis
                  label={{ value: costConfig.showTotalCosts ? 'Total Cost (£)' : 'Cost per Unit (£)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => `£${value.toFixed(2)}`}
                />
                <Tooltip
                  formatter={(value) => [`£${value.toFixed(2)}`, '']}
                  labelFormatter={(value) => `Quantity: ${value.toLocaleString()}`}
                />
                <Legend />

                {costConfig.showTotalCosts ? (
                  // Total costs view
                  <>
                    <Line
                      type="monotone"
                      dataKey="totalCost"
                      stroke="#000000"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                      name="Total Cost"
                    />
                    <Line
                      type="monotone"
                      dataKey="cartonCosts"
                      stroke="#0891b2"
                      activeDot={{ r: 6 }}
                      name="C₁: Carton Costs"
                    />
                    <Line
                      type="monotone"
                      dataKey="storageCosts"
                      stroke="#16a34a"
                      activeDot={{ r: 6 }}
                      name="C₂: Storage Costs"
                    />
                    <Line
                      type="monotone"
                      dataKey="transportCosts"
                      stroke="#4f46e5"
                      activeDot={{ r: 6 }}
                      name="C₃: Transport Costs"
                    />
                  </>
                ) : (
                  // Per-unit costs view
                  <>
                    <Line
                      type="monotone"
                      dataKey="costPerUnit"
                      stroke="#000000"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                      name="Total Cost per Unit"
                    />
                    <Line
                      type="monotone"
                      dataKey={(data) => data.cartonCosts / data.quantity}
                      stroke="#0891b2"
                      activeDot={{ r: 6 }}
                      name="C₁: Carton Costs per Unit"
                    />
                    <Line
                      type="monotone"
                      dataKey={(data) => data.storageCosts / data.quantity}
                      stroke="#16a34a"
                      activeDot={{ r: 6 }}
                      name="C₂: Storage Costs per Unit"
                    />
                    <Line
                      type="monotone"
                      dataKey={(data) => data.transportCosts / data.quantity}
                      stroke="#4f46e5"
                      activeDot={{ r: 6 }}
                      name="C₃: Transport Costs per Unit"
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-gray-600">
              This chart shows how costs change as quantity increases.
            </p>
            <button
              onClick={() => setCostConfig({...costConfig, showTotalCosts: !costConfig.showTotalCosts})}
              className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all"
            >
              Show {costConfig.showTotalCosts ? 'Cost per Unit' : 'Total Costs'}
            </button>
          </div>
        </div>

        {/* Component Cost Breakdown with Pie Chart */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Cost Component Breakdown</h3>

          {/* Single product quantity input with clear label */}
          <div className="mb-4 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">Units Quantity</label>
            <input
              type="number"
              value={costConfig.totalDemand}
              className="w-full p-2 border rounded"
              onChange={(e) => setCostConfig({...costConfig, totalDemand: parseFloat(e.target.value) || 0})}
            />
          </div>

          <div className="flex flex-wrap">
            {/* Pie Chart */}
            <div className="w-full md:w-1/2 h-64 bg-white rounded-lg p-3 mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={[{
                    name: 'Cost Components',
                    cartonCosts: analysisResults ? analysisResults.cartonCostPercentage : 0,
                    storageCosts: analysisResults ? analysisResults.storageCostPercentage : 0,
                    transportCosts: analysisResults ? analysisResults.transportCostPercentage : 0,
                  }]}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <Tooltip formatter={(value) => [`${value.toFixed(2)}%`, '']} />
                  <Legend />
                  <Pie
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label={({cx, cy, midAngle, innerRadius, outerRadius, percent, name}) => {
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                      const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="white"
                          textAnchor="middle"
                          dominantBaseline="central"
                        >
                          {`${(percent * 100).toFixed(1)}%`}
                        </text>
                      );
                    }}
                    data={[
                      { name: 'C₁: Carton Costs', value: analysisResults ? analysisResults.cartonCostPercentage : 0, fill: '#0891b2' },
                      { name: 'C₂: Storage Costs', value: analysisResults ? analysisResults.storageCostPercentage : 0, fill: '#16a34a' },
                      { name: 'C₃: Transport Costs', value: analysisResults ? analysisResults.transportCostPercentage : 0, fill: '#4f46e5' },
                    ]}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart and Details */}
            <div className="w-full md:w-1/2">
              <div className="h-64 bg-white rounded-lg p-3 mb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={[analysisResults].filter(Boolean)}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `£${value.toFixed(2)}`} />
                    <YAxis type="category" dataKey="name" width={120} />
                    <Tooltip formatter={(value) => [`£${value.toFixed(2)}`, '']} />
                    <Legend />
                    <Bar dataKey="cartonCosts" name="C₁: Carton" stackId="a" fill="#0891b2" barSize={30} />
                    <Bar dataKey="storageCosts" name="C₂: Storage" stackId="a" fill="#16a34a" barSize={30} />
                    <Bar dataKey="transportCosts" name="C₃: Transport" stackId="a" fill="#4f46e5" barSize={30} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cost Breakdown Summary Table */}
            <div className="w-full bg-white p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Cost Breakdown at {costConfig.totalDemand.toLocaleString()} units</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <table className="min-w-full">
                  <tbody>
                    <tr>
                      <td className="py-1">
                        <span className="inline-block w-3 h-3 bg-cyan-500 mr-2"></span>
                        C₁: Carton Costs
                      </td>
                      <td className="py-1 text-right">{analysisResults ? formatCurrency(analysisResults.cartonCosts) : '£0.00'}</td>
                      <td className="py-1 text-right">{analysisResults ? analysisResults.cartonCostPercentage.toFixed(2) : 0}%</td>
                    </tr>
                    <tr>
                      <td className="py-1">
                        <span className="inline-block w-3 h-3 bg-green-500 mr-2"></span>
                        C₂: Storage Costs
                      </td>
                      <td className="py-1 text-right">{analysisResults ? formatCurrency(analysisResults.storageCosts) : '£0.00'}</td>
                      <td className="py-1 text-right">{analysisResults ? analysisResults.storageCostPercentage.toFixed(2) : 0}%</td>
                    </tr>
                    <tr>
                      <td className="py-1">
                        <span className="inline-block w-3 h-3 bg-indigo-500 mr-2"></span>
                        C₃: Transport Costs
                      </td>
                      <td className="py-1 text-right">{analysisResults ? formatCurrency(analysisResults.transportCosts) : '£0.00'}</td>
                      <td className="py-1 text-right">{analysisResults ? analysisResults.transportCostPercentage.toFixed(2) : 0}%</td>
                    </tr>
                    <tr className="border-t">
                      <td className="py-1 font-medium">Total Cost</td>
                      <td className="py-1 text-right font-medium">{analysisResults ? formatCurrency(analysisResults.totalCost) : '£0.00'}</td>
                      <td className="py-1 text-right">100%</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">Cost per Unit</td>
                      <td className="py-1 text-right font-medium" colSpan="2">{analysisResults ? formatCurrency(analysisResults.costPerUnit) : '£0.00'}</td>
                    </tr>
                  </tbody>
                </table>

                <div>
                  <div className="mb-2">
                    <span className="font-medium">Total Cartons:</span> {analysisResults ? analysisResults.totalCartons.toLocaleString() : '0'}
                  </div>
                  <div className="mb-2">
                    <span className="font-medium">Total Pallets:</span> {analysisResults ? analysisResults.totalPallets.toFixed(2) : '0'}
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transport Mode</label>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setCostConfig({...costConfig, transportMode: 'auto'})}
                        className={`flex-1 py-2 px-4 rounded ${
                          costConfig.transportMode === 'auto'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border hover:bg-gray-50'
                        }`}
                      >
                        Auto (Min Cost)
                      </button>
                      <button
                        onClick={() => setCostConfig({...costConfig, transportMode: 'ltl'})}
                        className={`flex-1 py-2 px-4 rounded ${
                          costConfig.transportMode === 'ltl'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border hover:bg-gray-50'
                        }`}
                      >
                        LTL Only
                      </button>
                      <button
                        onClick={() => setCostConfig({...costConfig, transportMode: 'ftl'})}
                        className={`flex-1 py-2 px-4 rounded ${
                          costConfig.transportMode === 'ftl'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border hover:bg-gray-50'
                        }`}
                      >
                        FTL Only
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Optional Detailed Cost Table */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-700">Cost Calculations at Key Quantity Intervals</h3>
            <button
              onClick={() => setShowDetailedTable(!showDetailedTable)}
              className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
            >
              {showDetailedTable ? 'Hide Table' : 'Show Table'}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showDetailedTable ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </button>
          </div>

          {showDetailedTable && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cartons</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pallets</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">C₁: Carton Costs</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">C₂: Storage Costs</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">C₃: Transport</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost/Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {intervalData.map((data, index) => (
                    <tr key={index}>
                      <td className="py-2 px-3">{data.quantity.toLocaleString()}</td>
                      <td className="py-2 px-3">{data.totalCartons}</td>
                      <td className="py-2 px-3">{data.totalPallets}</td>
                      <td className="py-2 px-3">{formatCurrency(data.cartonCosts)}</td>
                      <td className="py-2 px-3">{formatCurrency(data.storageCosts)}</td>
                      <td className="py-2 px-3">{formatCurrency(data.transportCosts)}</td>
                      <td className="py-2 px-3">{formatCurrency(data.totalCost)}</td>
                      <td className="py-2 px-3">{formatCurrency(data.costPerUnit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!showDetailedTable && (
            <p className="text-sm text-gray-600">
              This table shows cost breakdowns at key quantity intervals (1,000, 5,000, 10,000, etc.).
              It provides the exact numerical values that are visualized in the graphs above.
            </p>
          )}
        </div>

        {/* Total Cost Formula */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Total Cost Formula</h3>
          <div className="p-3 bg-white rounded">
            <div className="text-sm mb-2">The total cost is calculated using the following formula:</div>
            <div className="p-2 bg-gray-50 rounded font-mono text-sm mb-3">
              TC = C₁ + C₂ + C₃
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-2 bg-cyan-50 rounded">
                <div className="text-xs font-medium text-cyan-800 mb-1">C₁: Carton-Related Costs</div>
                <div className="text-xs font-mono">Total_cartons × (Carton_handling_cost + Carton_unloading_cost)</div>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <div className="text-xs font-medium text-green-800 mb-1">C₂: Pallet-Related Storage Costs</div>
                <div className="text-xs font-mono">N_pallets × Weekly_storage_cost × Storage_duration_weeks</div>
              </div>
              <div className="p-2 bg-indigo-50 rounded">
                <div className="text-xs font-medium text-indigo-800 mb-1">C₃: Pallet-Related Transport Costs</div>
                <div className="text-xs font-mono">min(LTL_cost, FTL_cost)</div>
                <div className="text-xs mt-1">Where:</div>
                <div className="text-xs font-mono pl-2">LTL_cost = N_pallets × Cost_per_pallet_LTL + (N_pallets × Pallet_handling_cost)</div>
                <div className="text-xs font-mono pl-2">FTL_cost = ⌈N_pallets ÷ Pallets_per_trailer⌉ × Cost_per_trailer + (N_pallets × Pallet_handling_cost)</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-600">
              <p>Where:</p>
              <ul className="list-disc pl-5 mt-1">
                <li>Total_cartons = ⌈Total_units ÷ Units_per_carton⌉</li>
                <li>N_pallets = ⌈Total_cartons ÷ Cartons_per_pallet⌉</li>
                <li>Cost per unit = TC ÷ Total_units</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all"
          >
            Next: Cost Optimization →
          </button>
        </div>
      </div>
    </>
  );
};

export default CostAnalysis;
