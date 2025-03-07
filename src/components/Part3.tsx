// src/components/Part3.tsx
import { useCarton } from '../contexts/CartonContext';
import { formatCurrency } from '../utils/formatters';
import { CONTAINER_TYPES } from '../utils/calculators';
import useContainerCalculation, { CostBreakdown, ContainerSKU } from '../hooks/useContainerCalculation';

const Part3ContainerOptimization = () => {
  const { candidateCartons } = useCarton();
  
  // Use our custom hook for all container calculations
  const {
    containerType,
    setContainerType,
    totalContainers,
    setTotalContainers,
    containerCosts,
    setContainerCosts,
    containerSkus,
    updateSkuData,
    recalculateVolumePercentages,
    setOptimalCartonsForAll,
    costBreakdown,
    totalContainerCost,
    totalSupplyChainCost,
    grandTotalCost
  } = useContainerCalculation();

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
      <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Part 3: Total Supply Chain Cost</h2>

      {/* Container Configuration */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Container Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Container Type</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(CONTAINER_TYPES).map(([key, container]) => (
                <button
                  key={key}
                  className={`px-3 py-2 rounded ${containerType === key ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50'}`}
                  onClick={() => setContainerType(key as keyof typeof CONTAINER_TYPES)}
                >
                  {container.name}
                </button>
              ))}
            </div>
            
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="text-xs text-gray-500">Length</div>
                <div className="font-medium">{CONTAINER_TYPES[containerType].length} cm</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Width</div>
                <div className="font-medium">{CONTAINER_TYPES[containerType].width} cm</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Height</div>
                <div className="font-medium">{CONTAINER_TYPES[containerType].height} cm</div>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Containers</label>
              <input
                type="number"
                min="1"
                value={totalContainers}
                onChange={(e) => setTotalContainers(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Container Costs</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Freight (£)</label>
                <input
                  type="number"
                  step="1"
                  value={containerCosts.freight}
                  className="w-full p-2 border rounded"
                  onChange={(e) => setContainerCosts({...containerCosts, freight: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Terminal Handling (£)</label>
                <input
                  type="number"
                  step="1"
                  value={containerCosts.terminalHandling}
                  className="w-full p-2 border rounded"
                  onChange={(e) => setContainerCosts({...containerCosts, terminalHandling: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Port Processing (£)</label>
                <input
                  type="number"
                  step="1"
                  value={containerCosts.portProcessing}
                  className="w-full p-2 border rounded"
                  onChange={(e) => setContainerCosts({...containerCosts, portProcessing: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Haulage (£)</label>
                <input
                  type="number"
                  step="1"
                  value={containerCosts.haulage}
                  className="w-full p-2 border rounded"
                  onChange={(e) => setContainerCosts({...containerCosts, haulage: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Unloading (£)</label>
                <input
                  type="number"
                  step="1"
                  value={containerCosts.unloading}
                  className="w-full p-2 border rounded"
                  onChange={(e) => setContainerCosts({...containerCosts, unloading: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
            <div className="mt-3 pt-2 border-t flex justify-between font-medium">
              <span>Total Cost Per Container:</span>
              <span>{formatCurrency(Object.values(containerCosts).reduce((sum: number, cost: number) => sum + cost, 0))}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span>Total Container Cost ({totalContainers} containers):</span>
              <span>{formatCurrency(totalContainerCost)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SKU Input Configuration */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-700">SKU Configuration Input</h3>
          <div className="space-x-2">
            <button
              onClick={recalculateVolumePercentages}
              className="px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 transition-all text-sm"
            >
              Adjust to 100%
            </button>
            <button
              onClick={setOptimalCartonsForAll}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all text-sm"
            >
              Use Optimal Cartons
            </button>
          </div>
        </div>
        
        <div className="p-3 bg-blue-50 rounded-lg mb-4">
          <h4 className="font-medium text-blue-800">Total Supply Chain Cost Analysis</h4>
          <p className="text-sm text-blue-700 mt-1">
            This analysis combines container shipping costs with supply chain costs from Part 2A to give you a complete
            picture of all costs associated with each SKU. Container costs are attributed based on the volume percentage 
            allocated to each SKU in the container.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">SKU Name</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Carton Configuration</th>
                <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">Quantity</th>
                <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">Volume %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {containerSkus.map((sku: ContainerSKU) => {
                const skuCartons = candidateCartons.filter(c => c.skuId === sku.id);
                return (
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
                      <select
                        className="w-full p-1 border rounded"
                        value={sku.cartonId}
                        onChange={(e) => updateSkuData(sku.id, 'cartonId', parseInt(e.target.value))}
                      >
                        <option value="0">Select a carton...</option>
                        {skuCartons.map(carton => (
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
                        min="1"
                        onChange={(e) => updateSkuData(sku.id, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </td>
                    <td className="py-2 px-3 border">
                      <input
                        type="number"
                        className="w-full p-1 border rounded"
                        value={sku.volumePercentage || 0}
                        min="0"
                        max="100"
                        step="0.1"
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value) || 0;
                          updateSkuData(sku.id, 'volumePercentage', newValue);
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="py-2 px-3 font-medium border" colSpan={3}>Total Volume</td>
                <td className="py-2 px-3 text-center border font-medium">
                  {containerSkus.reduce((sum: number, sku: ContainerSKU) => sum + (sku.volumePercentage || 0), 0).toFixed(1)}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Total Supply Chain Cost Results */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Total Supply Chain Cost Results</h3>
        
        <div className="grid grid-cols-1 mb-6 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-700">Container Costs</div>
                <div className="text-xl font-bold text-blue-700">{formatCurrency(totalContainerCost)}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm text-green-700">Supply Chain Costs</div>
                <div className="text-xl font-bold text-green-700">{formatCurrency(totalSupplyChainCost)}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-sm text-purple-700">Grand Total</div>
                <div className="text-xl font-bold text-purple-700">{formatCurrency(grandTotalCost)}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">SKU</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border">Carton</th>
                <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">Quantity</th>
                <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border">Vol %</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-blue-600 uppercase tracking-wider border">Container Cost</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-green-600 uppercase tracking-wider border">Supply Chain Cost</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-purple-600 uppercase tracking-wider border">Total Cost</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-purple-600 uppercase tracking-wider border">Cost Per Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {costBreakdown.map((sku: CostBreakdown) => (
                <tr key={sku.skuId}>
                  <td className="py-2 px-3 border">{sku.skuName}</td>
                  <td className="py-2 px-3 border">{sku.dimensions}</td>
                  <td className="py-2 px-3 text-center border">{sku.quantity.toLocaleString()}</td>
                  <td className="py-2 px-3 text-center border">{sku.volumePercentage.toFixed(1)}%</td>
                  <td className="py-2 px-3 text-right border font-medium text-blue-600">
                    {formatCurrency(sku.containerCosts)}
                  </td>
                  <td className="py-2 px-3 text-right border font-medium text-green-600">
                    {formatCurrency(sku.supplyChainCost)}
                  </td>
                  <td className="py-2 px-3 text-right border font-medium text-purple-600">
                    {formatCurrency(sku.totalCost)}
                  </td>
                  <td className="py-2 px-3 text-right border font-medium text-purple-600">
                    {formatCurrency(sku.totalCostPerUnit)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="py-2 px-3 font-medium border" colSpan={4}>Totals</td>
                <td className="py-2 px-3 text-right border font-medium text-blue-600">
                  {formatCurrency(totalContainerCost)}
                </td>
                <td className="py-2 px-3 text-right border font-medium text-green-600">
                  {formatCurrency(totalSupplyChainCost)}
                </td>
                <td className="py-2 px-3 text-right border font-medium text-purple-600">
                  {formatCurrency(grandTotalCost)}
                </td>
                <td className="py-2 px-3 border"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Detailed Cost Breakdown */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Detailed Cost Breakdown Per SKU</h3>
        
        <div className="space-y-4">
          {costBreakdown.map((sku: CostBreakdown) => (
            <div key={sku.skuId} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-700">{sku.skuName} ({sku.dimensions})</h4>
                <div className="text-sm">
                  <span className="font-medium">Quantity:</span> {sku.quantity.toLocaleString()} units
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                {/* Container Costs */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex justify-between">
                    <div className="text-sm text-blue-700">Container Costs</div>
                    <div className="font-medium text-blue-700">{formatCurrency(sku.containerCosts)}</div>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Based on {sku.volumePercentage.toFixed(1)}% of container volume
                  </div>
                  <div className="text-xs text-blue-700 mt-2">
                    <div className="flex justify-between">
                      <span>Per Unit:</span>
                      <span>{formatCurrency(sku.containerCostPerUnit)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Supply Chain Costs */}
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex justify-between">
                    <div className="text-sm text-green-700">Supply Chain Costs</div>
                    <div className="font-medium text-green-700">{formatCurrency(sku.supplyChainCost)}</div>
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Carton: {formatCurrency(sku.cartonCosts)} | Pallet: {formatCurrency(sku.palletCosts)}
                  </div>
                  <div className="text-xs text-green-700 mt-2">
                    <div className="flex justify-between">
                      <span>Per Unit:</span>
                      <span>{formatCurrency(sku.supplyChainCostPerUnit)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Total Costs */}
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="flex justify-between">
                    <div className="text-sm text-purple-700">Total Costs</div>
                    <div className="font-medium text-purple-700">{formatCurrency(sku.totalCost)}</div>
                  </div>
                  <div className="text-xs text-purple-600 mt-1">
                    Container + Supply Chain Costs
                  </div>
                  <div className="text-xs text-purple-700 mt-2">
                    <div className="flex justify-between">
                      <span>Per Unit:</span>
                      <span className="font-bold">{formatCurrency(sku.totalCostPerUnit)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Cost Distribution Bar */}
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Cost Distribution</div>
                <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-blue-500" 
                    style={{width: `${(sku.containerCosts / sku.totalCost) * 100}%`}}
                  ></div>
                  <div 
                    className="h-full bg-green-500" 
                    style={{width: `${(sku.cartonCosts / sku.totalCost) * 100}%`}}
                  ></div>
                  <div 
                    className="h-full bg-emerald-500" 
                    style={{width: `${(sku.palletCosts / sku.totalCost) * 100}%`}}
                  ></div>
                </div>
                <div className="flex text-xs mt-1">
                  <div className="flex items-center mr-3">
                    <div className="w-2 h-2 bg-blue-500 mr-1"></div>
                    <span>Container ({((sku.containerCosts / sku.totalCost) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center mr-3">
                    <div className="w-2 h-2 bg-green-500 mr-1"></div>
                    <span>Carton ({((sku.cartonCosts / sku.totalCost) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 mr-1"></div>
                    <span>Pallet ({((sku.palletCosts / sku.totalCost) * 100).toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grand Total Summary */}
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <h3 className="font-semibold text-purple-800 mb-3">Total Supply Chain Cost Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-purple-700 mb-2">Cost Components</h4>
            <ul className="space-y-2">
              <li className="flex justify-between items-center">
                <span className="text-blue-700">Container Shipping Costs:</span>
                <span className="font-medium">{formatCurrency(totalContainerCost)}</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-green-700">Carton Handling Costs:</span>
                <span className="font-medium">{formatCurrency(costBreakdown.reduce((sum: number, sku: CostBreakdown) => sum + sku.cartonCosts, 0))}</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-emerald-700">Pallet & Storage Costs:</span>
                <span className="font-medium">{formatCurrency(costBreakdown.reduce((sum: number, sku: CostBreakdown) => sum + sku.palletCosts, 0))}</span>
              </li>
              <li className="flex justify-between items-center pt-2 border-t border-purple-200">
                <span className="font-medium text-purple-800">Grand Total:</span>
                <span className="font-bold text-purple-800">{formatCurrency(grandTotalCost)}</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-purple-700 mb-2">Key Metrics</h4>
            <ul className="space-y-2">
              <li className="flex justify-between items-center">
                <span>Total Units:</span>
                <span className="font-medium">{costBreakdown.reduce((sum: number, sku: CostBreakdown) => sum + sku.quantity, 0).toLocaleString()}</span>
              </li>
              <li className="flex justify-between items-center">
                <span>Total SKUs:</span>
                <span className="font-medium">{costBreakdown.length}</span>
              </li>
              <li className="flex justify-between items-center">
                <span>Total Containers:</span>
                <span className="font-medium">{totalContainers}</span>
              </li>
              <li className="flex justify-between items-center pt-2 border-t border-purple-200">
                <span className="font-medium text-purple-800">Average Cost Per Unit:</span>
                <span className="font-bold text-purple-800">
                  {formatCurrency(grandTotalCost / Math.max(1, costBreakdown.reduce((sum: number, sku: CostBreakdown) => sum + sku.quantity, 0)))}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Part3ContainerOptimization;