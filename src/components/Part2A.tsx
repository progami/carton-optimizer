import { useState, useEffect } from 'react';
import { useCarton, useCostConfig, useProvider } from '../contexts/CartonContext';
import { useCostCalculation } from '../hooks/useCostCalculation';
import { formatCurrency } from '../utils/formatters';
import {
  generateScalingData,
  generateIntervalData
} from '../utils/calculators';

// Define types for chart data
type CostData = {
  quantity: number;
  totalCartons: number;
  totalPallets: number;
  physicalPallets: number;  // Added for physical (whole) pallets
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
  
  // Add these fields for per-unit cost calculations
  cartonCostPerUnit: number;
  storageCostPerUnit: number;
  transportCostPerUnit: number;
  
  [key: string]: any; // For any other properties
};

const CostAnalysis = () => {
  const { candidateCartons, getSelectedCartonId } = useCarton();
  const { updateProviderRate, handleProviderChange } = useProvider();
  const { costConfig, setCostConfig } = useCostConfig();
  const { analysisResults, selectedCartonId, setSelectedCartonId } = useCostCalculation();

  const [showDetailedRates, setShowDetailedRates] = useState(false);
  const [showCostFunction, setShowCostFunction] = useState(false);
  const [optimized, setOptimized] = useState(false);
  const [showAbsoluteValues, setShowAbsoluteValues] = useState(false); // For bar charts

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

  // Function to optimize quantity to fully utilize pallets
  const optimizeQuantity = () => {
    const selectedCarton = candidateCartons.find(c => c.id === selectedCartonId);
    if (!selectedCarton) return;

    const unitsPerCarton = selectedCarton.unitsPerCarton;
    const cartonsPerPallet = selectedCarton.cartonsPerPallet;
    
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

  // Calculate utilization percentage
  const calculateUtilization = () => {
    if (!analysisResults) return null;
    
    const selectedCarton = candidateCartons.find(c => c.id === selectedCartonId);
    if (!selectedCarton) return null;
    
    const unitsPerCarton = selectedCarton.unitsPerCarton;
    const cartonsPerPallet = selectedCarton.cartonsPerPallet;
    
    // Calculate current cartons needed
    const currentCartons = Math.ceil(costConfig.totalDemand / unitsPerCarton);
    
    // Calculate the utilization of the last pallet
    const cartonsInLastPallet = currentCartons % cartonsPerPallet || cartonsPerPallet;
    const utilizationPercentage = (cartonsInLastPallet / cartonsPerPallet) * 100;
    
    return utilizationPercentage;
  };
  
  // Set up colors for cost components
  const colors = {
    cartonHandling: '#0891b2',      // Cyan
    cartonUnloading: '#06b6d4',     // Darker cyan
    palletHandling: '#a7f3d0',      // Light green
    storage: '#22c55e',             // Medium green
    transport: '#4ade80',           // Light green
    total: '#f43f5e'                // Rose/red for total
  };

  // Get the selected carton for the cost function
  const selectedCarton = candidateCartons.find(c => c.id === selectedCartonId);
  
  // Calculate carton count for display
  const displayCartonCount = selectedCarton && analysisResults 
    ? analysisResults.totalCartons 
    : 0;

  // Calculate utilization for display
  const utilization = calculateUtilization();
  const isFullyOptimized = utilization === 100;

  // Calculate detailed cost breakdowns
  const getDetailedCosts = () => {
    if (!analysisResults) return null;
    
    // C1: Carton handling costs
    const C1_cartonHandling = displayCartonCount * costConfig.cartonHandlingCost;
    
    // C2: Carton unloading costs
    const C2_cartonUnloading = displayCartonCount * costConfig.cartonUnloadingCost;
    
    // C3: Pallet handling costs
    const C3_palletHandling = analysisResults.physicalPallets * costConfig.palletHandlingCost;
    
    // C4: Storage costs
    const C4_storage = analysisResults.physicalPallets * costConfig.palletStorageCostPerWeek * costConfig.storageWeeks;
    
    // C5: Transportation costs (LTL/FTL)
    const C5_transportation = costConfig.transportMode === 'ltl' 
      ? analysisResults.physicalPallets * costConfig.ltlCostPerPallet 
      : Math.ceil(analysisResults.physicalPallets / costConfig.palletsPerTruck) * costConfig.ftlCostPerTruck;
    
    // Aggregate costs
    const Cost_carton = C1_cartonHandling + C2_cartonUnloading;
    const Cost_pallet = C3_palletHandling + C4_storage + C5_transportation;
    
    // Calculate percentages and per unit costs
    const totalCost = analysisResults.totalCost;
    
    return {
      // C1: Carton Handling
      C1_cartonHandling,
      C1_cartonHandlingPercentage: (C1_cartonHandling / totalCost) * 100,
      C1_cartonHandlingPerUnit: C1_cartonHandling / costConfig.totalDemand,
      
      // C2: Carton Unloading
      C2_cartonUnloading,
      C2_cartonUnloadingPercentage: (C2_cartonUnloading / totalCost) * 100,
      C2_cartonUnloadingPerUnit: C2_cartonUnloading / costConfig.totalDemand,
      
      // C3: Pallet Handling
      C3_palletHandling,
      C3_palletHandlingPercentage: (C3_palletHandling / totalCost) * 100,
      C3_palletHandlingPerUnit: C3_palletHandling / costConfig.totalDemand,
      
      // C4: Storage
      C4_storage,
      C4_storagePercentage: (C4_storage / totalCost) * 100,
      C4_storagePerUnit: C4_storage / costConfig.totalDemand,
      
      // C5: Transportation (LTL/FTL)
      C5_transportation,
      C5_transportationPercentage: (C5_transportation / totalCost) * 100,
      C5_transportationPerUnit: C5_transportation / costConfig.totalDemand,
      
      // Aggregated costs
      Cost_carton,
      Cost_cartonPercentage: (Cost_carton / totalCost) * 100,
      Cost_cartonPerUnit: Cost_carton / costConfig.totalDemand,
      
      Cost_pallet,
      Cost_palletPercentage: (Cost_pallet / totalCost) * 100,
      Cost_palletPerUnit: Cost_pallet / costConfig.totalDemand,
    };
  };

  const detailedCosts = getDetailedCosts();

  return (
    <>
      <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Part 2A: Cost Analysis</h2>

        {/* Consolidated Configuration Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-3 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Order Configuration</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500">Quantity (Units)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={costConfig.totalDemand}
                    min="1"
                    className="w-full p-2 border rounded text-lg font-medium"
                    onChange={(e) => setCostConfig({...costConfig, totalDemand: parseFloat(e.target.value) || 0})}
                  />
                  <button
                    onClick={optimizeQuantity}
                    className={`px-2 py-2 ${optimized ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'} rounded hover:bg-blue-600 transition-all flex-shrink-0 text-xs shadow`}
                    title="Adjust quantity to efficiently fill pallets"
                  >
                    {optimized ? 'Optimized!' : 'Optimize'}
                  </button>
                </div>
                {utilization !== null && utilization !== 100 && (
                  <div className="mt-1 text-xs text-amber-600">
                    Last pallet is only {Math.round(utilization)}% utilized.
                  </div>
                )}
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
                  {selectedCarton?.unitsPerCarton || '-'}
                </div>
              </div>
              
              <div className="text-center bg-white p-2 rounded border">
                <div className="text-xs text-gray-500">Cartons/Pallet</div>
                <div className="font-medium">
                  {selectedCarton?.cartonsPerPallet || '-'}
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
              
              <div className="flex items-end space-x-2">
                <button 
                  className="flex-1 p-2 bg-indigo-50 text-indigo-600 rounded border border-indigo-200 hover:bg-indigo-100 transition"
                  onClick={() => setShowDetailedRates(!showDetailedRates)}
                >
                  {showDetailedRates ? 'Hide Rates' : 'Show Rates'}
                </button>
                <button 
                  className="flex-1 p-2 bg-purple-50 text-purple-600 rounded border border-purple-200 hover:bg-purple-100 transition"
                  onClick={() => setShowCostFunction(!showCostFunction)}
                >
                  {showCostFunction ? 'Hide Formula' : 'Show Formula'}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Cost Function Display (Collapsible) */}
        {showCostFunction && (
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-purple-800 mb-3">Cost Function Formula</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white p-3 rounded-lg border border-purple-200">
                <div className="text-sm font-medium text-gray-800 mb-2">Total Cost = Cost_carton + Cost_pallet</div>
                <div className="pl-4 text-sm text-gray-700">
                  <p className="mb-2"><strong>Where:</strong></p>
                  <p className="mb-1">Cost_carton = C₁ + C₂</p>
                  <p className="mb-1">C₁ (Carton Handling) = ceiling(Q/UPC) × CHF</p>
                  <p className="mb-1">C₂ (Carton Unloading) = ceiling(Q/UPC) × CUF</p>
                  
                  <p className="mt-2 mb-1">Cost_pallet = C₃ + C₄ + C₅</p>
                  <p className="mb-1">C₃ (Pallet Handling) = ceiling(ceiling(Q/UPC)/CPP) × PHF</p>
                  <p className="mb-1">C₄ (Storage) = ceiling(ceiling(Q/UPC)/CPP) × PSF × SW</p>
                  <p className="mb-1">C₅ (Transportation) = LTL or FTL cost</p>
                  <p className="pl-4 mb-1">LTL = ceiling(ceiling(Q/UPC)/CPP) × LTLC</p>
                  <p className="pl-4 mb-1">FTL = ceiling(ceiling(ceiling(Q/UPC)/CPP)/PPT) × FTLC</p>
                  
                  <p className="mt-3"><strong>Variables:</strong></p>
                  <ul className="list-disc pl-5 space-y-1 mb-2">
                    <li>Q = Quantity ({costConfig.totalDemand} units)</li>
                    <li>UPC = Units per Carton ({selectedCarton?.unitsPerCarton || '-'})</li>
                    <li>CPP = Cartons per Pallet ({selectedCarton?.cartonsPerPallet || '-'})</li>
                    <li>CHF = Carton Handling Fee (£{costConfig.cartonHandlingCost.toFixed(2)})</li>
                    <li>CUF = Carton Unloading Fee (£{costConfig.cartonUnloadingCost.toFixed(2)})</li>
                    <li>PHF = Pallet Handling Fee (£{costConfig.palletHandlingCost.toFixed(2)})</li>
                    <li>PSF = Pallet Storage Fee (£{costConfig.palletStorageCostPerWeek.toFixed(2)}/week)</li>
                    <li>SW = Storage Weeks ({costConfig.storageWeeks})</li>
                    <li>LTLC = LTL Cost per Pallet (£{costConfig.ltlCostPerPallet.toFixed(2)})</li>
                    <li>FTLC = FTL Cost per Truck (£{costConfig.ftlCostPerTruck.toFixed(2)})</li>
                    <li>PPT = Pallets per Truck ({costConfig.palletsPerTruck})</li>
                  </ul>
                </div>
              </div>
              
              {analysisResults && (
                <div className="bg-white p-3 rounded-lg border border-purple-200">
                  <div className="text-sm font-medium text-gray-800 mb-2">Calculated Values</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <div className="text-xs text-gray-500">Total Units</div>
                      <div className="font-medium">{costConfig.totalDemand.toLocaleString()} units</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Total Cartons</div>
                      <div className="font-medium">{displayCartonCount.toLocaleString()} cartons</div>
                      <div className="text-xs text-gray-500 mt-1">= ceiling({costConfig.totalDemand}/{selectedCarton?.unitsPerCarton || '-'})</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Physical Pallets</div>
                      <div className="font-medium">{analysisResults.physicalPallets} pallets</div>
                      <div className="text-xs text-gray-500 mt-1">= ceiling({displayCartonCount}/{selectedCarton?.cartonsPerPallet || '-'})</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
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
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-700">
              Cost Breakdown for {costConfig.totalDemand.toLocaleString()} Units ({displayCartonCount} Cartons)
            </h3>
            
            <div className="inline-flex rounded-md shadow-sm">
              <button
                onClick={() => setShowAbsoluteValues(false)}
                className={`px-3 py-1 text-sm font-medium rounded-l-lg border ${
                  !showAbsoluteValues 
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Per Unit
              </button>
              <button
                onClick={() => setShowAbsoluteValues(true)}
                className={`px-3 py-1 text-sm font-medium rounded-r-lg border-t border-r border-b ${
                  showAbsoluteValues 
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Absolute Values
              </button>
            </div>
          </div>
          
          {/* Utilization indicator */}
          {utilization !== null && utilization !== 100 && (
            <div className="mb-4 p-2 rounded-md bg-amber-50 border border-amber-200">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-sm ml-2 font-medium">
                  Last pallet utilization: {Math.round(utilization)}% ({displayCartonCount % (selectedCarton?.cartonsPerPallet || 1)} of {selectedCarton?.cartonsPerPallet || '-'} cartons)
                </span>
                <button
                  onClick={optimizeQuantity}
                  className="ml-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all text-xs"
                >
                  Optimize
                </button>
              </div>
            </div>
          )}
          
          {/* Cost summary */}
          <div className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3 grid grid-cols-3 gap-4">
                <div className="text-center bg-gray-50 p-2 rounded-lg shadow-sm">
                  <div className="text-sm font-medium text-gray-700 mb-1">Carton Count</div>
                  <div className="text-xl font-medium">{displayCartonCount}</div>
                </div>
                <div className="text-center bg-gray-50 p-2 rounded-lg shadow-sm">
                  <div className="text-sm font-medium text-gray-700 mb-1">Total Pallets</div>
                  <div className="text-xl font-medium">{analysisResults ? analysisResults.physicalPallets : '-'}</div>
                </div>
                <div className="text-center bg-gray-50 p-2 rounded-lg shadow-sm">
                  <div className="text-sm font-medium text-gray-700 mb-1">Transport Mode</div>
                  <div className="text-xl font-medium">{analysisResults?.transportMode ?? '-'}</div>
                </div>
              </div>
              
              <div className="md:col-span-1 bg-rose-100 p-2 rounded-lg text-center flex flex-col justify-center">
                <div className="text-sm text-rose-800">
                  {showAbsoluteValues ? 'Total Cost' : 'Cost Per Unit'}
                </div>
                <div className="text-xl font-bold text-rose-800">
                  {analysisResults 
                    ? (showAbsoluteValues 
                        ? formatCurrency(analysisResults.totalCost) 
                        : formatCurrency(analysisResults.costPerUnit))
                    : '-'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Cost Breakdown with Individual Components */}
          {analysisResults && detailedCosts && (
            <div className="mb-6">
              {/* Cost Category Headers - Side by Side */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <h4 className="font-medium text-cyan-800">Carton Related Costs</h4>
                  <span className="text-sm font-medium ml-2">
                    {showAbsoluteValues 
                      ? formatCurrency(detailedCosts.Cost_carton)
                      : formatCurrency(detailedCosts.Cost_cartonPerUnit)} 
                    ({detailedCosts.Cost_cartonPercentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              
              {/* Carton Related Costs Bar */}
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-md h-8">
                  <div 
                    className="h-8 rounded-md flex"
                    style={{ 
                      width: `${detailedCosts.Cost_cartonPercentage}%`,
                      backgroundColor: colors.cartonHandling 
                    }}
                  >
                    {/* C1: Carton Handling - sub-bar */}
                    <div 
                      className="h-full" 
                      style={{ 
                        width: `${(detailedCosts.C1_cartonHandlingPercentage / detailedCosts.Cost_cartonPercentage) * 100}%`,
                        backgroundColor: colors.cartonHandling 
                      }}
                    ></div>
                    {/* C2: Carton Unloading - sub-bar */}
                    <div 
                      className="h-full" 
                      style={{ 
                        width: `${(detailedCosts.C2_cartonUnloadingPercentage / detailedCosts.Cost_cartonPercentage) * 100}%`,
                        backgroundColor: colors.cartonUnloading 
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* C1: Carton Handling - details */}
                <div className="pl-4 mt-2 mb-2">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <div className="w-3 h-3" style={{ backgroundColor: colors.cartonHandling }}></div>
                      <span className="text-sm font-medium ml-2">C₁: Carton Handling</span>
                    </div>
                    <span className="text-sm font-medium">
                      {showAbsoluteValues 
                        ? formatCurrency(detailedCosts.C1_cartonHandling)
                        : formatCurrency(detailedCosts.C1_cartonHandlingPerUnit)} 
                      ({detailedCosts.C1_cartonHandlingPercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 ml-6">
                    {displayCartonCount} cartons × £{costConfig.cartonHandlingCost.toFixed(2)}
                  </div>
                </div>
                
                {/* C2: Carton Unloading - details */}
                <div className="pl-4">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <div className="w-3 h-3" style={{ backgroundColor: colors.cartonUnloading }}></div>
                      <span className="text-sm font-medium ml-2">C₂: Carton Unloading</span>
                    </div>
                    <span className="text-sm font-medium">
                      {showAbsoluteValues 
                        ? formatCurrency(detailedCosts.C2_cartonUnloading)
                        : formatCurrency(detailedCosts.C2_cartonUnloadingPerUnit)} 
                      ({detailedCosts.C2_cartonUnloadingPercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 ml-6">
                    {displayCartonCount} cartons × £{costConfig.cartonUnloadingCost.toFixed(2)}
                  </div>
                </div>
              </div>
              
              {/* Pallet Related Costs Header */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <h4 className="font-medium text-green-800">Pallet Related Costs</h4>
                  <span className="text-sm font-medium ml-2">
                    {showAbsoluteValues 
                      ? formatCurrency(detailedCosts.Cost_pallet)
                      : formatCurrency(detailedCosts.Cost_palletPerUnit)} 
                    ({detailedCosts.Cost_palletPercentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              
              {/* Pallet Related Costs Bar */}
              <div>
                <div className="w-full bg-gray-200 rounded-md h-8">
                  <div 
                    className="h-8 rounded-md flex"
                    style={{ 
                      width: `${detailedCosts.Cost_palletPercentage}%`,
                      backgroundColor: colors.palletHandling 
                    }}
                  >
                    {/* C3: Pallet Handling - sub-bar */}
                    <div 
                      className="h-full" 
                      style={{ 
                        width: `${(detailedCosts.C3_palletHandlingPercentage / detailedCosts.Cost_palletPercentage) * 100}%`,
                        backgroundColor: colors.palletHandling 
                      }}
                    ></div>
                    {/* C4: Storage - sub-bar */}
                    <div 
                      className="h-full" 
                      style={{ 
                        width: `${(detailedCosts.C4_storagePercentage / detailedCosts.Cost_palletPercentage) * 100}%`,
                        backgroundColor: colors.storage 
                      }}
                    ></div>
                    {/* C5: Transportation - sub-bar */}
                    <div 
                      className="h-full" 
                      style={{ 
                        width: `${(detailedCosts.C5_transportationPercentage / detailedCosts.Cost_palletPercentage) * 100}%`,
                        backgroundColor: colors.transport 
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* C3: Pallet Handling - details */}
                <div className="pl-4 mt-2 mb-2">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <div className="w-3 h-3" style={{ backgroundColor: colors.palletHandling }}></div>
                      <span className="text-sm font-medium ml-2">C₃: Pallet Handling</span>
                    </div>
                    <span className="text-sm font-medium">
                      {showAbsoluteValues 
                        ? formatCurrency(detailedCosts.C3_palletHandling)
                        : formatCurrency(detailedCosts.C3_palletHandlingPerUnit)} 
                      ({detailedCosts.C3_palletHandlingPercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 ml-6">
                    {analysisResults.physicalPallets} pallets × £{costConfig.palletHandlingCost.toFixed(2)}
                  </div>
                </div>
                
                {/* C4: Storage - details */}
                <div className="pl-4 mb-2">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <div className="w-3 h-3" style={{ backgroundColor: colors.storage }}></div>
                      <span className="text-sm font-medium ml-2">C₄: Storage</span>
                    </div>
                    <span className="text-sm font-medium">
                      {showAbsoluteValues 
                        ? formatCurrency(detailedCosts.C4_storage)
                        : formatCurrency(detailedCosts.C4_storagePerUnit)} 
                      ({detailedCosts.C4_storagePercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 ml-6">
                    {analysisResults.physicalPallets} pallets × £{costConfig.palletStorageCostPerWeek.toFixed(2)}/week × {costConfig.storageWeeks} weeks
                  </div>
                </div>
                
                {/* C5: Transportation - details */}
                <div className="pl-4">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <div className="w-3 h-3" style={{ backgroundColor: colors.transport }}></div>
                      <span className="text-sm font-medium ml-2">C₅: Transportation ({analysisResults.transportMode})</span>
                    </div>
                    <span className="text-sm font-medium">
                      {showAbsoluteValues 
                        ? formatCurrency(detailedCosts.C5_transportation)
                        : formatCurrency(detailedCosts.C5_transportationPerUnit)} 
                      ({detailedCosts.C5_transportationPercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 ml-6">
                    {costConfig.transportMode === 'ltl' 
                      ? `${analysisResults.physicalPallets} pallets × £${costConfig.ltlCostPerPallet.toFixed(2)}`
                      : `${Math.ceil(analysisResults.physicalPallets / costConfig.palletsPerTruck)} trucks × £${costConfig.ftlCostPerTruck.toFixed(2)}`}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CostAnalysis;