import { useState, useEffect } from 'react';
import { useCarton, useCostConfig, useProvider } from '../contexts/CartonContext';
import { useCostCalculation } from '../hooks/useCostCalculation';
import { formatCurrency } from '../utils/formatters';
import {
  generateScalingData,
  generateIntervalData
} from '../utils/calculators';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine, Pie, PieChart
} from 'recharts';

// Define types for chart data
type CostData = {
  quantity: number;
  totalCartons: number;
  totalPallets: number;
  cartonCosts: number;
  storageCosts: number;
  palletHandlingCosts: number;
  transportCosts: number;
  totalCost: number;
  costPerUnit: number;
  cartonCostPercentage: number;
  storageCostPercentage: number;
  transportCostPercentage: number;
  ltlCost: number;
  ftlCost: number;
  transportMode: string;
  [key: string]: any; // For any other properties
};

const CostAnalysis = () => {
  const { candidateCartons, getSelectedCartonId } = useCarton();
  const { updateProviderRate, handleProviderChange } = useProvider();
  const { costConfig, setCostConfig } = useCostConfig();
  const { analysisResults, selectedCartonId, setSelectedCartonId } = useCostCalculation();

  const [showDetailedRates, setShowDetailedRates] = useState(false);

  // Set the initial selected carton ID based on what's selected in Part 1
  useEffect(() => {
    const selected = getSelectedCartonId();
    if (selected) {
      setSelectedCartonId(selected);
    }
  }, [getSelectedCartonId, setSelectedCartonId]);

  // Set transportMode to LTL if set to auto
  useEffect(() => {
    if (costConfig.transportMode === 'auto') {
      setCostConfig(prev => ({...prev, transportMode: 'ltl'}));
    }
  }, [costConfig.transportMode, setCostConfig]);

  const maxQuantityToShow = Math.max(costConfig.totalDemand * 2, 20000);
  const scalingData = generateScalingData(maxQuantityToShow, selectedCartonId, selectedCartonId, candidateCartons, costConfig) as CostData[];
  
  // Set up colors that show relation between pallet-related costs
  const colors = {
    carton: '#0891b2',      // Cyan
    palletRelated: '#15803d', // Dark green for the parent category
    storage: '#22c55e',     // Medium green
    transport: '#4ade80',   // Light green
    total: '#f43f5e'        // Rose/red for total
  };

  // Create custom pie chart data to avoid duplicate legend items
  const pieChartData = [
    { name: 'Carton Costs', value: analysisResults ? analysisResults.cartonCosts : 0, fill: colors.carton },
    { name: 'Storage Costs', value: analysisResults ? analysisResults.storageCosts : 0, fill: colors.storage },
    { name: 'Transport Costs', value: analysisResults ? analysisResults.transportCosts : 0, fill: colors.transport },
  ];

  return (
    <>
      <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Part 2A: Cost Analysis</h2>

        {/* Consolidated Configuration Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-3 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Carton Configuration</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500">Quantity</label>
                <input
                  type="number"
                  value={costConfig.totalDemand}
                  className="w-full p-2 border rounded text-lg font-medium"
                  onChange={(e) => setCostConfig({...costConfig, totalDemand: parseFloat(e.target.value) || 0})}
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Carton Configuration</label>
                <select 
                  className="w-full p-2 border rounded"
                  value={selectedCartonId}
                  onChange={(e) => setSelectedCartonId(parseInt(e.target.value))}
                >
                  {candidateCartons.map(carton => (
                    <option key={carton.id} value={carton.id}>
                      {carton.length}×{carton.width}×{carton.height} cm
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="text-center bg-white p-2 rounded border">
                <div className="text-xs text-gray-500">Units/Carton</div>
                <div className="font-medium">
                  {candidateCartons.find(c => c.id === selectedCartonId)?.unitsPerCarton || '-'}
                </div>
              </div>
              
              <div className="text-center bg-white p-2 rounded border">
                <div className="text-xs text-gray-500">Cartons/Pallet</div>
                <div className="font-medium">
                  {candidateCartons.find(c => c.id === selectedCartonId)?.cartonsPerPallet || '-'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Cost Parameters</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">3PL Provider</label>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleProviderChange('fmc')}
                    className={`flex-1 py-1 px-2 rounded text-sm ${
                      costConfig.provider === 'fmc'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border hover:bg-gray-50'
                    }`}
                  >
                    FMC
                  </button>
                  <button
                    onClick={() => handleProviderChange('vglobal')}
                    className={`flex-1 py-1 px-2 rounded text-sm ${
                      costConfig.provider === 'vglobal'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border hover:bg-gray-50'
                    }`}
                  >
                    Vglobal
                  </button>
                  <button
                    onClick={() => handleProviderChange('4as')}
                    className={`flex-1 py-1 px-2 rounded text-sm ${
                      costConfig.provider === '4as'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border hover:bg-gray-50'
                    }`}
                  >
                    4as
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Transport Mode</label>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCostConfig({...costConfig, transportMode: 'ltl'})}
                    className={`flex-1 py-1 px-2 rounded text-sm ${
                      costConfig.transportMode === 'ltl'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border hover:bg-gray-50'
                    }`}
                  >
                    LTL
                  </button>
                  <button
                    onClick={() => setCostConfig({...costConfig, transportMode: 'ftl'})}
                    className={`flex-1 py-1 px-2 rounded text-sm ${
                      costConfig.transportMode === 'ftl'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border hover:bg-gray-50'
                    }`}
                  >
                    FTL
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Storage Weeks</label>
                <input
                  type="number"
                  value={costConfig.storageWeeks}
                  className="w-full p-2 border rounded"
                  onChange={(e) => setCostConfig({...costConfig, storageWeeks: parseFloat(e.target.value)})}
                />
              </div>
              
              <div className="flex items-end">
                <button 
                  className="w-full p-2 bg-indigo-50 text-indigo-600 rounded border border-indigo-200 hover:bg-indigo-100 transition"
                  onClick={() => setShowDetailedRates(!showDetailedRates)}
                >
                  {showDetailedRates ? 'Hide Detailed Rates' : 'Show Detailed Rates'}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Detailed Rates Panel (Collapsible) */}
        {showDetailedRates && (
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">Detailed Cost Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Carton Costs */}
              <div className="bg-cyan-50 p-3 rounded-lg border border-cyan-200">
                <h4 className="text-sm font-medium text-cyan-800 mb-2">Carton-Related Costs</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Carton Handling (£)</label>
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
                    <label className="block text-xs text-gray-600 mb-1">Carton Unloading (£)</label>
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
              </div>
              
              {/* Storage Costs */}
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <h4 className="text-sm font-medium text-green-800 mb-2">Storage Costs</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Storage Cost (£/week)</label>
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
                    <label className="block text-xs text-gray-600 mb-1">Pallet Handling (£)</label>
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
              </div>
              
              {/* Transport Costs */}
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <h4 className="text-sm font-medium text-green-800 mb-2">Transport Costs</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      {costConfig.transportMode === 'ltl' ? 'LTL Cost (£/pallet)' : 'FTL Cost (£/truck)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={costConfig.transportMode === 'ltl' ? costConfig.ltlCostPerPallet : costConfig.ftlCostPerTruck}
                      className="w-full p-2 border rounded"
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (costConfig.transportMode === 'ltl') {
                          setCostConfig({...costConfig, ltlCostPerPallet: value});
                          updateProviderRate(costConfig.provider, 'ltlCostPerPallet', value);
                        } else {
                          setCostConfig({...costConfig, ftlCostPerTruck: value});
                          updateProviderRate(costConfig.provider, 'ftlCostPerTruck', value);
                        }
                      }}
                    />
                  </div>
                  {costConfig.transportMode === 'ftl' && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Pallets/Truck</label>
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
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Cost Breakdown Visualization */}
        <div className="bg-white p-4 border-2 border-gray-200 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-700 mb-4">Cost Breakdown for {costConfig.totalDemand.toLocaleString()} Units</h3>
          
          {/* Cost summary */}
          <div className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3 grid grid-cols-3 gap-4">
                <div className="text-center bg-gray-50 p-2 rounded-lg shadow-sm">
                  <div className="text-sm font-medium text-gray-700 mb-1">Total Cartons</div>
                  <div className="text-xl font-medium">{analysisResults?.totalCartons ?? '-'}</div>
                </div>
                <div className="text-center bg-gray-50 p-2 rounded-lg shadow-sm">
                  <div className="text-sm font-medium text-gray-700 mb-1">Total Pallets</div>
                  <div className="text-xl font-medium">{analysisResults ? Math.ceil(analysisResults.totalPallets) : '-'}</div>
                  <div className="text-xs text-gray-500">
                    ({analysisResults ? analysisResults.totalPallets.toFixed(1) : '-'} calculated)
                  </div>
                </div>
                <div className="text-center bg-gray-50 p-2 rounded-lg shadow-sm">
                  <div className="text-sm font-medium text-gray-700 mb-1">Transport Mode</div>
                  <div className="text-xl font-medium">{analysisResults?.transportMode ?? '-'}</div>
                </div>
              </div>
              
              <div className="md:col-span-1 bg-rose-100 p-2 rounded-lg text-center flex flex-col justify-center">
                <div>
                  <div className="text-sm text-rose-800">Total Cost</div>
                  <div className="text-xl font-bold text-rose-800">
                    {analysisResults ? formatCurrency(analysisResults.totalCost) : '-'}
                  </div>
                </div>
                <div className="mt-1">
                  <div className="text-sm text-rose-800">Per Unit</div>
                  <div className="text-xl font-bold text-rose-800">
                    {analysisResults ? formatCurrency(analysisResults.costPerUnit) : '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left side: Cost breakdown with bar charts */}
            <div>
              {/* Carton Costs */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3" style={{ backgroundColor: colors.carton }}></div>
                    <span className="text-sm font-medium ml-2">C₁: Carton Costs</span>
                  </div>
                  <span className="text-sm font-medium">
                    {analysisResults ? formatCurrency(analysisResults.cartonCosts) : '-'} 
                    ({analysisResults ? `${analysisResults.cartonCostPercentage.toFixed(1)}%` : '0%'})
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="h-4 rounded-full" 
                    style={{ 
                      width: `${analysisResults ? analysisResults.cartonCostPercentage : 0}%`,
                      backgroundColor: colors.carton 
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Handling and unloading of {analysisResults ? analysisResults.totalCartons.toLocaleString() : '-'} individual cartons
                </div>
              </div>

              {/* Pallet-Related Costs (Combined) */}
              <div className="mb-1">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3" style={{ backgroundColor: colors.palletRelated }}></div>
                    <span className="text-sm font-medium ml-2">Pallet-Related Costs (C₂+C₃)</span>
                  </div>
                  <span className="text-sm font-medium">
                    {analysisResults ? formatCurrency(analysisResults.storageCosts + analysisResults.transportCosts) : '-'} 
                    ({analysisResults ? `${(analysisResults.storageCostPercentage + analysisResults.transportCostPercentage).toFixed(1)}%` : '0%'})
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="h-4 rounded-full" 
                    style={{ 
                      width: `${analysisResults ? (analysisResults.storageCostPercentage + analysisResults.transportCostPercentage) : 0}%`,
                      backgroundColor: colors.palletRelated 
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Storage and transport for {analysisResults ? Math.ceil(analysisResults.totalPallets).toLocaleString() : '-'} pallets
                </div>
              </div>

              {/* Breakdown of pallet-related costs */}
              <div className="pl-6 mt-3">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3" style={{ backgroundColor: colors.storage }}></div>
                    <span className="text-xs ml-2">C₂: Storage Costs</span>
                  </div>
                  <span className="text-xs">
                    {analysisResults ? formatCurrency(analysisResults.storageCosts) : '-'} 
                    ({analysisResults ? `${analysisResults.storageCostPercentage.toFixed(1)}%` : '0%'})
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full" 
                    style={{ 
                      width: `${analysisResults ? analysisResults.storageCostPercentage : 0}%`,
                      backgroundColor: colors.storage
                    }}
                  ></div>
                </div>

                <div className="flex justify-between items-center mt-2 mb-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3" style={{ backgroundColor: colors.transport }}></div>
                    <span className="text-xs ml-2">C₃: Transport Costs ({analysisResults?.transportMode})</span>
                  </div>
                  <span className="text-xs">
                    {analysisResults ? formatCurrency(analysisResults.transportCosts) : '-'} 
                    ({analysisResults ? `${analysisResults.transportCostPercentage.toFixed(1)}%` : '0%'})
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full" 
                    style={{ 
                      width: `${analysisResults ? analysisResults.transportCostPercentage : 0}%`,
                      backgroundColor: colors.transport
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Right side: Pie Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    label={({name, percent}) => `${name}: ${percent ? (percent * 100).toFixed(1) : '0'}%`}
                    dataKey="value"
                  >
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ border: '1px solid #ccc', borderRadius: '4px', padding: '8px' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Cost vs. Quantity Chart */}
        <div className="bg-white p-4 border-2 border-gray-200 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">Cost vs. Quantity Analysis</h3>
            
            <div className="inline-flex rounded-md shadow-sm">
              <button
                onClick={() => setCostConfig({...costConfig, showTotalCosts: false})}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                  !costConfig.showTotalCosts 
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Per Unit
              </button>
              <button
                onClick={() => setCostConfig({...costConfig, showTotalCosts: true})}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-r border-b ${
                  costConfig.showTotalCosts 
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Absolute Values
              </button>
            </div>
          </div>
          
          {/* Add a check for data and display placeholder if missing */}
          {scalingData && scalingData.length > 0 ? (
            <div className="h-72 mb-4">
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
                    formatter={(value: number, name: string) => {
                      if (typeof name === 'string') {
                        if (name.includes("Carton")) {
                          return [`£${value.toFixed(2)}`, name];
                        } else if (name.includes("Storage")) {
                          return [`£${value.toFixed(2)}`, name];
                        } else if (name.includes("Transport")) {
                          return [`£${value.toFixed(2)}`, name];
                        }
                      }
                      return [`£${value.toFixed(2)}`, name];
                    }}
                    labelFormatter={(value) => `Quantity: ${typeof value === 'number' ? value.toLocaleString() : value}`}
                    contentStyle={{ border: '1px solid #ccc', borderRadius: '4px', padding: '8px' }}
                  />
                  <Legend />

                  {costConfig.showTotalCosts ? (
                    // Total costs view
                    <>
                      <Line
                        type="monotone"
                        dataKey="totalCost"
                        stroke={colors.total}
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                        name="Total Cost"
                      />
                      <Line
                        type="monotone"
                        dataKey="cartonCosts"
                        stroke={colors.carton}
                        activeDot={{ r: 6 }}
                        name="C₁: Carton Costs"
                      />
                      <Line
                        type="monotone"
                        dataKey="storageCosts"
                        stroke={colors.storage}
                        activeDot={{ r: 6 }}
                        name="C₂: Storage Costs"
                      />
                      <Line
                        type="monotone"
                        dataKey="transportCosts"
                        stroke={colors.transport}
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
                        stroke={colors.total}
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                        name="Total Cost per Unit"
                      />
                      <Line
                        type="monotone"
                        dataKey={(data) => data.cartonCosts / data.quantity}
                        stroke={colors.carton}
                        activeDot={{ r: 6 }}
                        name="C₁: Carton Costs per Unit"
                      />
                      <Line
                        type="monotone"
                        dataKey={(data) => data.storageCosts / data.quantity}
                        stroke={colors.storage}
                        activeDot={{ r: 6 }}
                        name="C₂: Storage Costs per Unit"
                      />
                      <Line
                        type="monotone"
                        dataKey={(data) => data.transportCosts / data.quantity}
                        stroke={colors.transport}
                        activeDot={{ r: 6 }}
                        name="C₃: Transport Costs per Unit"
                      />
                    </>
                  )}
                  
                  {/* Add reference line for current quantity */}
                  <ReferenceLine
                    x={costConfig.totalDemand}
                    stroke="#f43f5e"
                    strokeDasharray="3 3"
                    label={{ value: 'Current Quantity', position: 'top', fill: '#f43f5e' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 mb-4 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center text-gray-500">
                <p className="text-lg">No data available for charting</p>
                <p className="text-sm mt-2">Try selecting a different carton configuration or adjusting parameters</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CostAnalysis;