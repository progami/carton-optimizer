// src/components/Part2.tsx
import React, { useState, useEffect } from 'react';
import { useCarton, useCostConfig, useProvider } from '../contexts/CartonContext';
import { formatCurrency } from '../utils/formatters';
import {
  calculateAllCostAnalyses,
  groupResultsBySKU,
  groupResultsBySKUAndProvider,
  findOptimalCartonsPerSKU,
  CostAnalysisResult,
  findLCM
} from '../utils/calculators';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const CostFunctionAnalysis = () => {
  const { candidateCartons } = useCarton();
  const { costConfig, setCostConfig } = useCostConfig();
  const { providerRates, handleProviderChange } = useProvider();

  // State for analysis results
  const [results, setResults] = useState<CostAnalysisResult[]>([]);
  
  // State for active views
  const [activeSku, setActiveSku] = useState<string>('');
  const [activeProvider, setActiveProvider] = useState<string>(costConfig.provider);
  const [viewType, setViewType] = useState<'all' | 'optimal'>('all');
  
  // State for UI controls
  const [showDetailedRates, setShowDetailedRates] = useState(false);
  const [showCostDistribution, setShowCostDistribution] = useState(false);

  // Get all unique SKUs
  const skuIds = [...new Set(candidateCartons.map(carton => carton.skuId))];
  
  // Set FTL as default transport mode
  useEffect(() => {
    if (costConfig.transportMode !== 'ftl') {
      setCostConfig({
        ...costConfig,
        transportMode: 'ftl'
      });
    }
  }, []);
  
  // Calculate cost analyses when dependencies change
  useEffect(() => {
    if (skuIds.length === 0) return;
    
    const allResults = calculateAllCostAnalyses(
      candidateCartons,
      providerRates,
      costConfig.storageWeeks,
      costConfig.transportMode,
      costConfig.palletsPerTruck
    );
    
    setResults(allResults);
    
    // Set initial active SKU if not already set
    if (!activeSku && skuIds.length > 0) {
      setActiveSku(skuIds[0]);
    }
  }, [
    candidateCartons, 
    providerRates, 
    costConfig.storageWeeks, 
    costConfig.transportMode, 
    costConfig.palletsPerTruck,
    costConfig.provider,
    skuIds, 
    activeSku
  ]);

  // Set active provider when costConfig.provider changes
  useEffect(() => {
    setActiveProvider(costConfig.provider);
  }, [costConfig.provider]);

  // Group results for easier display
  const skuResults = groupResultsBySKU(results);
  const skuProviderResults = groupResultsBySKUAndProvider(results);
  const optimalResults = findOptimalCartonsPerSKU(results);
  
  // Get results for the active SKU and provider
  const activeSkuResults = results.filter(r => 
    r.skuId === activeSku && (r.provider === activeProvider || activeProvider === 'all')
  );
  
  // Get the optimal configuration for the active SKU
  const activeSkuOptimal = optimalResults.find(r => r.skuId === activeSku);

  // Update provider selection and cost config
  const setProvider = (provider: 'fmc' | 'vglobal' | '4as') => {
    handleProviderChange(provider);
    setActiveProvider(provider);
  };

  // Colors for visualization
  const colors = {
    cartonCosts: '#3b82f6',  // Blue for carton costs
    palletCosts: '#22c55e',  // Green for pallet costs
    fmc: '#3b82f6',          // Blue for FMC
    vglobal: '#8b5cf6',      // Purple for Vglobal
    '4as': '#ec4899',        // Pink for 4as
  };

  // Prepare data for cost distribution visualization
  const prepareCostDistributionData = (result: CostAnalysisResult) => {
    return [
      { name: 'Carton Costs (g1)', value: result.cartonCostsPerUnit, fill: colors.cartonCosts },
      { name: 'Pallet Costs (g2)', value: result.palletCostsPerUnit, fill: colors.palletCosts }
    ];
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-xl font-semibold text-gray-700 border-b pb-3 mb-6">
        Part 2: Cost Function Analysis
      </h2>
      
      {/* Control Panel - Improved Spacing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* SKU Selection */}
        <div className="bg-gray-50 p-5 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-3">SKU Selection</h3>
          <select
            className="w-full p-3 border rounded-md shadow-sm"
            value={activeSku}
            onChange={(e) => setActiveSku(e.target.value)}
          >
            {skuIds.map(skuId => (
              <option key={skuId} value={skuId}>{skuId}</option>
            ))}
          </select>
          
          <div className="mt-2 text-sm text-gray-500">
            {skuResults[activeSku]?.length || 0} configurations available
          </div>
        </div>
        
        {/* 3PL Provider Selection */}
        <div className="bg-gray-50 p-5 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-3">3PL Provider Selection</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <button
              onClick={() => setActiveProvider('all')}
              className={`py-3 px-2 rounded-md text-sm font-medium ${
                activeProvider === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Providers
            </button>
            <button
              onClick={() => setProvider('fmc')}
              className={`py-3 px-2 rounded-md text-sm font-medium ${
                activeProvider === 'fmc'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              FMC
            </button>
            <button
              onClick={() => setProvider('vglobal')}
              className={`py-3 px-2 rounded-md text-sm font-medium ${
                activeProvider === 'vglobal'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Vglobal
            </button>
            <button
              onClick={() => setProvider('4as')}
              className={`py-3 px-2 rounded-md text-sm font-medium ${
                activeProvider === '4as'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-300 hover:bg-gray-50'
              }`}
            >
              4as
            </button>
          </div>
        </div>
        
        {/* Transport Configuration */}
        <div className="bg-gray-50 p-5 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Transport Configuration</h3>
          
          {/* Transport Mode Selection */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">Transport Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCostConfig({...costConfig, transportMode: 'ltl'})}
                className={`py-3 px-4 rounded-md text-sm font-medium ${
                  costConfig.transportMode === 'ltl'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                LTL
              </button>
              <button
                onClick={() => setCostConfig({...costConfig, transportMode: 'ftl'})}
                className={`py-3 px-4 rounded-md text-sm font-medium ${
                  costConfig.transportMode === 'ftl'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                FTL
              </button>
            </div>
          </div>
          
          {/* FTL-specific configuration */}
          {costConfig.transportMode === 'ftl' && (
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">Pallets per Truck</label>
              <input
                type="number"
                className="w-full p-3 border rounded-md shadow-sm"
                value={costConfig.palletsPerTruck}
                min="1"
                onChange={(e) => setCostConfig({
                  ...costConfig,
                  palletsPerTruck: parseInt(e.target.value) || costConfig.palletsPerTruck
                })}
              />
            </div>
          )}
          
          {/* Storage Duration */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">Storage Weeks</label>
            <input
              type="number"
              className="w-full p-3 border rounded-md shadow-sm"
              value={costConfig.storageWeeks}
              min="1"
              onChange={(e) => setCostConfig({
                ...costConfig,
                storageWeeks: parseInt(e.target.value) || costConfig.storageWeeks
              })}
            />
          </div>
        </div>
      </div>
      
      {/* View Controls - Improved UI */}
      <div className="flex flex-wrap justify-between items-center mb-6 bg-gray-50 p-4 rounded-lg">
        <div className="flex space-x-3">
          <button
            onClick={() => setViewType('all')}
            className={`px-4 py-2 rounded-md ${
              viewType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Configurations
          </button>
          <button
            onClick={() => setViewType('optimal')}
            className={`px-4 py-2 rounded-md ${
              viewType === 'optimal'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Optimal Only
          </button>
        </div>
        
        <div className="flex space-x-3 mt-3 sm:mt-0">
          <button
            onClick={() => setShowDetailedRates(!showDetailedRates)}
            className={`px-4 py-2 rounded-md ${
              showDetailedRates
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {showDetailedRates ? 'Hide Rates' : 'Show Rates'}
          </button>
          <button
            onClick={() => setShowCostDistribution(!showCostDistribution)}
            className={`px-4 py-2 rounded-md ${
              showCostDistribution
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {showCostDistribution ? 'Hide Distribution' : 'Show Distribution'}
          </button>
        </div>
      </div>
      
      {/* Detailed Rates Panel (Collapsible) */}
      {showDetailedRates && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4 text-lg">3PL Cost Rates</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left border font-medium">Cost Category</th>
                  <th className="py-3 px-4 text-left border font-medium">Item</th>
                  <th className="py-3 px-4 text-right border font-medium">FMC</th>
                  <th className="py-3 px-4 text-right border font-medium">Vglobal</th>
                  <th className="py-3 px-4 text-right border font-medium">4as</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 px-4 border font-medium" rowSpan={2}>Carton-Related</td>
                  <td className="py-3 px-4 border">Carton handling (cost_1)</td>
                  <td className="py-3 px-4 text-right border">{formatCurrency(providerRates.fmc.cartonHandlingCost)}</td>
                  <td className="py-3 px-4 text-right border">{formatCurrency(providerRates.vglobal.cartonHandlingCost)}</td>
                  <td className="py-3 px-4 text-right border">{formatCurrency(providerRates['4as'].cartonHandlingCost)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 border">Carton unloading (cost_2)</td>
                  <td className="py-3 px-4 text-right border">{formatCurrency(providerRates.fmc.cartonUnloadingCost)}</td>
                  <td className="py-3 px-4 text-right border">{formatCurrency(providerRates.vglobal.cartonUnloadingCost)}</td>
                  <td className="py-3 px-4 text-right border">{formatCurrency(providerRates['4as'].cartonUnloadingCost)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 border font-medium" rowSpan={4}>Pallet-Related</td>
                  <td className="py-3 px-4 border">Storage (cost_4)</td>
                  <td className="py-3 px-4 text-right border">{formatCurrency(providerRates.fmc.palletStorageCostPerWeek)} per week</td>
                  <td className="py-3 px-4 text-right border">{formatCurrency(providerRates.vglobal.palletStorageCostPerWeek)} per week</td>
                  <td className="py-3 px-4 text-right border">{formatCurrency(providerRates['4as'].palletStorageCostPerWeek)} per week</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 border">Pallet handling</td>
                  <td className="py-3 px-4 text-right border">{formatCurrency(providerRates.fmc.palletHandlingCost)}</td>
                  <td className="py-3 px-4 text-right border">{formatCurrency(providerRates.vglobal.palletHandlingCost)}</td>
                  <td className="py-3 px-4 text-right border">{formatCurrency(providerRates['4as'].palletHandlingCost)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 border">LTL transport</td>
                  <td className="py-3 px-4 text-right border">{formatCurrency(providerRates.fmc.ltlCostPerPallet)} per pallet</td>
                  <td className="py-3 px-4 text-right border">{formatCurrency(providerRates.vglobal.ltlCostPerPallet)} per pallet</td>
                  <td className="py-3 px-4 text-right border">{formatCurrency(providerRates['4as'].ltlCostPerPallet)} per pallet</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 border">FTL transport</td>
                  <td className="py-3 px-4 text-right border">{formatCurrency(providerRates.fmc.ftlCostPerTruck)} per truck</td>
                  <td className="py-3 px-4 text-right border">{formatCurrency(providerRates.vglobal.ftlCostPerTruck)} per truck</td>
                  <td className="py-3 px-4 text-right border">{formatCurrency(providerRates['4as'].ftlCostPerTruck)} per truck</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Cost Distribution Visualization (Collapsible) */}
      {showCostDistribution && activeSkuOptimal && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4 text-lg">Cost Distribution for Optimal Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-center mb-3 font-medium">Cost Component Distribution</div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={prepareCostDistributionData(activeSkuOptimal)}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {prepareCostDistributionData(activeSkuOptimal).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div>
              <div className="text-center mb-3 font-medium">Cost Breakdown</div>
              <div className="bg-gray-50 p-5 rounded-lg">
                <div className="grid grid-cols-2 gap-5">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4" style={{ backgroundColor: colors.cartonCosts }}></div>
                    <div>
                      <div className="text-sm font-medium">Carton Costs (g1)</div>
                      <div className="font-bold text-lg">{formatCurrency(activeSkuOptimal.cartonCostsPerUnit)}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4" style={{ backgroundColor: colors.palletCosts }}></div>
                    <div>
                      <div className="text-sm font-medium">Pallet Costs (g2)</div>
                      <div className="font-bold text-lg">{formatCurrency(activeSkuOptimal.palletCostsPerUnit)}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">Total Cost per Unit (g)</div>
                    <div className="font-bold text-xl text-green-700">{formatCurrency(activeSkuOptimal.totalCostPerUnit)}</div>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">g = g1 + g2</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Cost Analysis Table */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-700 mb-4 text-lg">
          {viewType === 'all' 
            ? `Cost Function Analysis for ${activeSku} (${activeProvider === 'all' ? 'All Providers' : activeProvider})`
            : 'Optimal Configuration(s)'
          }
        </h3>
        
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">SKU (a)</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Carton Size (b)</th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">Units/Carton (c)</th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">Cartons/Pallet (d)</th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">Units/Pallet (e=c×d)</th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">3PL (k)</th>
                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">LCM Qty (f)</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-blue-600 uppercase tracking-wider border">Carton Costs/Unit (g1)</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-green-600 uppercase tracking-wider border">Pallet Costs/Unit (g2)</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-purple-600 uppercase tracking-wider border">Cost/Unit (g=g1+g2)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {viewType === 'all' ? (
                // Display all results for selected SKU and provider
                activeSkuResults.map((result, index) => (
                  <tr key={index} className={result.isOptimal ? 'bg-green-50' : ''}>
                    <td className="py-3 px-4 border">{result.skuId}</td>
                    <td className="py-3 px-4 border">{result.dimensions}</td>
                    <td className="py-3 px-4 text-center border">{result.unitsPerCarton}</td>
                    <td className="py-3 px-4 text-center border">{result.cartonsPerPallet}</td>
                    <td className="py-3 px-4 text-center border">{result.unitsPerCarton * result.cartonsPerPallet}</td>
                    <td className="py-3 px-4 text-center border">{result.provider}</td>
                    <td className="py-3 px-4 text-center border">{result.lcmQuantity.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right border font-medium text-blue-600">
                      {formatCurrency(result.cartonCostsPerUnit)}
                    </td>
                    <td className="py-3 px-4 text-right border font-medium text-green-600">
                      {formatCurrency(result.palletCostsPerUnit)}
                    </td>
                    <td className="py-3 px-4 text-right border font-medium text-purple-600">
                      {formatCurrency(result.totalCostPerUnit)}
                    </td>
                  </tr>
                ))
              ) : (
                // Display only optimal configurations for each SKU
                optimalResults.map((result, index) => (
                  <tr key={index} className="bg-green-50">
                    <td className="py-3 px-4 border">{result.skuId}</td>
                    <td className="py-3 px-4 border">{result.dimensions}</td>
                    <td className="py-3 px-4 text-center border">{result.unitsPerCarton}</td>
                    <td className="py-3 px-4 text-center border">{result.cartonsPerPallet}</td>
                    <td className="py-3 px-4 text-center border">{result.unitsPerCarton * result.cartonsPerPallet}</td>
                    <td className="py-3 px-4 text-center border">{result.provider}</td>
                    <td className="py-3 px-4 text-center border">{result.lcmQuantity.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right border font-medium text-blue-600">
                      {formatCurrency(result.cartonCostsPerUnit)}
                    </td>
                    <td className="py-3 px-4 text-right border font-medium text-green-600">
                      {formatCurrency(result.palletCostsPerUnit)}
                    </td>
                    <td className="py-3 px-4 text-right border font-medium text-purple-600">
                      {formatCurrency(result.totalCostPerUnit)}
                    </td>
                  </tr>
                ))
              )}
              {(viewType === 'all' && activeSkuResults.length === 0) || (viewType === 'optimal' && optimalResults.length === 0) ? (
                <tr>
                  <td colSpan={10} className="py-5 text-center text-gray-500">
                    No data available. Please select different criteria.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Detailed Optimal Configuration Summary */}
      {activeSkuOptimal && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 shadow-md">
          <div className="flex items-center mb-5">
            <div className="w-14 h-14 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center mr-5 shadow">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-green-800">Optimal Carton Configuration</h3>
              <p className="text-green-600 text-lg">Lowest Cost/Unit for {activeSku}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Configuration Details */}
            <div className="col-span-1 bg-white rounded-lg p-5 shadow">
              <h4 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b">Configuration</h4>
              
              <div className="grid grid-cols-2 gap-5 mb-5">
                <div>
                  <div className="text-sm text-gray-500">SKU (a)</div>
                  <div className="text-xl font-bold text-gray-800">{activeSkuOptimal.skuId}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Carton Dimensions (b)</div>
                  <div className="text-xl font-bold text-gray-800">{activeSkuOptimal.dimensions}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-5">
                <div>
                  <div className="text-sm text-gray-500">Units/Carton (c)</div>
                  <div className="text-xl font-bold text-gray-800">{activeSkuOptimal.unitsPerCarton}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Cartons/Pallet (d)</div>
                  <div className="text-xl font-bold text-gray-800">{activeSkuOptimal.cartonsPerPallet}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Units/Pallet (e)</div>
                  <div className="text-xl font-bold text-gray-800">{activeSkuOptimal.unitsPerCarton * activeSkuOptimal.cartonsPerPallet}</div>
                </div>
              </div>
              
              <div className="mt-5 pt-4 border-t">
                <div className="text-sm text-gray-500">Optimal Provider (k)</div>
                <div className="text-xl font-bold text-gray-800">{activeSkuOptimal.provider.toUpperCase()}</div>
              </div>
            </div>
            
            {/* Cost Breakdown */}
            <div className="col-span-1 bg-white rounded-lg p-5 shadow">
              <h4 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b">Cost Breakdown</h4>
              
              <div className="space-y-4">
                {/* Carton Costs (g1) */}
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-3 flex-shrink-0" style={{ backgroundColor: colors.cartonCosts }}></div>
                  <div className="flex-grow">
                    <div className="flex justify-between">
                      <span className="text-base font-medium">Carton Costs (g1)</span>
                      <span className="text-base font-medium">{formatCurrency(activeSkuOptimal.cartonCostsPerUnit)}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Carton handling + Carton unloading
                    </div>
                  </div>
                </div>
                
                {/* Pallet Costs (g2) */}
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-3 flex-shrink-0" style={{ backgroundColor: colors.palletCosts }}></div>
                  <div className="flex-grow">
                    <div className="flex justify-between">
                      <span className="text-base font-medium">Pallet Costs (g2)</span>
                      <span className="text-base font-medium">{formatCurrency(activeSkuOptimal.palletCostsPerUnit)}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Pallet handling + Storage + Transportation
                    </div>
                  </div>
                </div>
                
                {/* Total Cost */}
                <div className="pt-3 mt-3 border-t">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold">Total Cost per Unit (g)</span>
                    <span className="text-lg font-bold">{formatCurrency(activeSkuOptimal.totalCostPerUnit)}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    g = g1 + g2
                  </div>
                </div>
              </div>
            </div>
            
            {/* Cost Distribution */}
            <div className="col-span-1 bg-white rounded-lg p-5 shadow">
              <h4 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b">Cost Distribution</h4>
              
              <div className="mt-3">
                <div className="text-sm text-gray-500 mb-2">Distribution of Costs</div>
                <div className="w-full bg-gray-200 h-8 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full flex items-center justify-center text-sm text-white font-medium" 
                    style={{
                      backgroundColor: colors.cartonCosts,
                      width: `${(activeSkuOptimal.cartonCostsPerUnit / activeSkuOptimal.totalCostPerUnit) * 100}%`
                    }}
                  >
                    {((activeSkuOptimal.cartonCostsPerUnit / activeSkuOptimal.totalCostPerUnit) * 100).toFixed(0)}%
                  </div>
                  <div 
                    className="h-full flex items-center justify-center text-sm text-white font-medium" 
                    style={{
                      backgroundColor: colors.palletCosts,
                      width: `${(activeSkuOptimal.palletCostsPerUnit / activeSkuOptimal.totalCostPerUnit) * 100}%`
                    }}
                  >
                    {((activeSkuOptimal.palletCostsPerUnit / activeSkuOptimal.totalCostPerUnit) * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 mr-1" style={{ backgroundColor: colors.cartonCosts }}></div>
                    <span>Carton Costs (g1)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 mr-1" style={{ backgroundColor: colors.palletCosts }}></div>
                    <span>Pallet Costs (g2)</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 pt-4 border-t">
                <div className="text-sm text-gray-500">LCM Quantity (f)</div>
                <div className="text-xl font-bold text-gray-800">{activeSkuOptimal.lcmQuantity.toLocaleString()} units</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostFunctionAnalysis;