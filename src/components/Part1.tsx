// src/components/Part1.tsx
import { useState, useRef, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarton } from '../contexts/CartonContext';

// Define the type for candidate inputs
interface CandidateInput {
  skuId: string;
  length: number | string;
  width: number | string;
  height: number | string;
  unitsPerCarton: number | string;
  cartonsPerPallet: number | string;
}

const CandidateConfigurations = () => {
  const navigate = useNavigate();
  const {
    candidateCartons,
    toggleCandidateSelection,
    handleAddCandidate,
    handleEditCandidate,
    handleDeleteCandidate
  } = useCarton();

  const [newCandidate, setNewCandidate] = useState<CandidateInput>({
    skuId: '',
    length: 0,
    width: 0,
    height: 0,
    unitsPerCarton: 0,
    cartonsPerPallet: 0
  });

  const [editMode, setEditMode] = useState(false);
  const [editCandidateId, setEditCandidateId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cancelEdit = () => {
    setEditMode(false);
    setEditCandidateId(null);
    setNewCandidate({
      skuId: '',
      length: 0,
      width: 0,
      height: 0,
      unitsPerCarton: 0,
      cartonsPerPallet: 0
    });
  };

  const handleEdit = (id: number) => {
    const candidateData = handleEditCandidate(id);
    if (candidateData) {
      // If skuId is not in the returned data, use an empty string
      setNewCandidate({
        ...candidateData,
        skuId: candidateData.skuId || ''
      });
      setEditMode(true);
      setEditCandidateId(id);
    }
  };

  const submitCandidate = () => {
    if (!newCandidate.skuId.trim()) {
      alert('Please enter an SKU ID');
      return;
    }
    
    handleAddCandidate(newCandidate, editMode, editCandidateId);
    cancelEdit();
  };

  // Function to handle navigation to Cost Analysis
  const handleNavigateToAnalysis = () => {
    navigate('/part2a');
  };

  // Function to handle CSV import
  const handleCsvImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      // Split the content by lines and remove empty lines
      const lines = content.split('\n').filter(line => line.trim() !== '');
      
      // Get the header row (first line)
      const header = lines[0].split(',').map(col => col.trim().toLowerCase());
      
      // Required columns in CSV
      const requiredColumns = ['skuid', 'length', 'width', 'height', 'unitspercarton', 'cartonsperpallete'];
      
      // Check if all required columns exist in the header
      const hasAllRequiredColumns = requiredColumns.every(col => 
        header.includes(col) || 
        // Check alternative spellings/names
        (col === 'cartonsperpallete' && (header.includes('cartonsperpallett') || header.includes('cartonsperpal')))
      );

      if (!hasAllRequiredColumns) {
        alert('CSV must include columns: SKU ID, Length, Width, Height, Units Per Carton, Cartons Per Pallet');
        return;
      }

      // Map column indices
      const colIndices = {
        skuId: header.indexOf('skuid'),
        length: header.indexOf('length'),
        width: header.indexOf('width'),
        height: header.indexOf('height'),
        unitsPerCarton: header.indexOf('unitspercarton'),
        cartonsPerPallet: Math.max(
          header.indexOf('cartonsperpallete'), 
          header.indexOf('cartonsperpallett'), 
          header.indexOf('cartonsperpal')
        )
      };

      // Process data rows
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(val => val.trim());
        
        // Skip if not enough values
        if (values.length < Object.values(colIndices).filter(idx => idx >= 0).length) continue;

        const candidateData: CandidateInput = {
          skuId: values[colIndices.skuId] || 'Unknown',
          length: parseFloat(values[colIndices.length]) || 0,
          width: parseFloat(values[colIndices.width]) || 0,
          height: parseFloat(values[colIndices.height]) || 0,
          unitsPerCarton: parseInt(values[colIndices.unitsPerCarton]) || 0,
          cartonsPerPallet: parseInt(values[colIndices.cartonsPerPallet]) || 0
        };

        // Convert string | number types to numbers for comparison
        const lengthNum = typeof candidateData.length === 'string' ? parseFloat(candidateData.length) : candidateData.length;
        const widthNum = typeof candidateData.width === 'string' ? parseFloat(candidateData.width) : candidateData.width;
        const heightNum = typeof candidateData.height === 'string' ? parseFloat(candidateData.height) : candidateData.height;
        const unitsPerCartonNum = typeof candidateData.unitsPerCarton === 'string' ? 
          parseInt(candidateData.unitsPerCarton) : candidateData.unitsPerCarton;
        const cartonsPerPalletNum = typeof candidateData.cartonsPerPallet === 'string' ? 
          parseInt(candidateData.cartonsPerPallet) : candidateData.cartonsPerPallet;

        // Only add if we have valid dimensions and quantities
        if (
          lengthNum > 0 && 
          widthNum > 0 && 
          heightNum > 0 && 
          unitsPerCartonNum > 0 && 
          cartonsPerPalletNum > 0
        ) {
          handleAddCandidate(candidateData, false, null);
        }
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
  };

  // Helper function to check if form is valid
  const isFormValid = (): boolean => {
    // Convert string values to numbers for comparison
    const lengthNum = typeof newCandidate.length === 'string' ? 
      parseFloat(newCandidate.length) : newCandidate.length;
    const widthNum = typeof newCandidate.width === 'string' ? 
      parseFloat(newCandidate.width) : newCandidate.width;
    const heightNum = typeof newCandidate.height === 'string' ? 
      parseFloat(newCandidate.height) : newCandidate.height;
    const unitsPerCartonNum = typeof newCandidate.unitsPerCarton === 'string' ? 
      parseInt(newCandidate.unitsPerCarton) : newCandidate.unitsPerCarton;
    const cartonsPerPalletNum = typeof newCandidate.cartonsPerPallet === 'string' ? 
      parseInt(newCandidate.cartonsPerPallet) : newCandidate.cartonsPerPallet;
    
    return Boolean(
      newCandidate.skuId && 
      lengthNum > 0 && 
      widthNum > 0 && 
      heightNum > 0 && 
      unitsPerCartonNum > 0 && 
      cartonsPerPalletNum > 0
    );
  };

  return (
    <>
      <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Part 1: Candidate Configurations</h2>
        <p className="text-sm text-gray-600 mb-4">
          Enter or import candidate carton configurations generated from CubeMaster analysis. These configurations will be used for cost function analysis.
        </p>
        <div className="mb-6">
          {/* Add/Edit Candidate */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-blue-800 mb-3">
              {editMode ? "Edit CubeMaster Configuration" : "Add CubeMaster Configuration"}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU ID</label>
                <input
                  type="text"
                  value={newCandidate.skuId}
                  onChange={(e) => setNewCandidate({...newCandidate, skuId: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="Enter SKU ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Length (cm)</label>
                <input
                  type="number"
                  value={newCandidate.length}
                  onChange={(e) => setNewCandidate({...newCandidate, length: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Width (cm)</label>
                <input
                  type="number"
                  value={newCandidate.width}
                  onChange={(e) => setNewCandidate({...newCandidate, width: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={newCandidate.height}
                  onChange={(e) => setNewCandidate({...newCandidate, height: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Units/Carton</label>
                <input
                  type="number"
                  value={newCandidate.unitsPerCarton}
                  onChange={(e) => setNewCandidate({...newCandidate, unitsPerCarton: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cartons/Pallet</label>
                <input
                  type="number"
                  value={newCandidate.cartonsPerPallet}
                  onChange={(e) => setNewCandidate({...newCandidate, cartonsPerPallet: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              {editMode && (
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={submitCandidate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                disabled={!isFormValid()}
              >
                {editMode ? "Update Configuration" : "Add Configuration"}
              </button>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">CubeMaster Candidate Configurations</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU ID</th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dimensions (L×W×H)</th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units/Carton</th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cartons/Pallet</th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units/Pallet</th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {candidateCartons.map(carton => {
                  const unitsPerPallet = carton.unitsPerCarton * carton.cartonsPerPallet;
                  const isValid = carton.length <= 63.5 && carton.width <= 63.5 && carton.height <= 63.5;
                  return (
                    <tr key={carton.id} className={carton.isSelected ? 'bg-blue-50' : ''}>
                      <td className="py-2 px-3">
                        <input
                          type="radio"
                          checked={carton.isSelected}
                          onChange={() => toggleCandidateSelection(carton.id)}
                          className="h-4 w-4 text-blue-600"
                        />
                      </td>
                      <td className="py-2 px-3">{carton.skuId || 'N/A'}</td>
                      <td className="py-2 px-3">{carton.length} × {carton.width} × {carton.height} cm</td>
                      <td className="py-2 px-3">{carton.unitsPerCarton}</td>
                      <td className="py-2 px-3">{carton.cartonsPerPallet}</td>
                      <td className="py-2 px-3">{unitsPerPallet}</td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isValid ? 'Valid' : 'Invalid'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(carton.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCandidate(carton.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {candidateCartons.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-gray-500">
                      No configurations added yet. Add your first configuration above or import from CSV.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleCsvImport}
              accept=".csv"
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all cursor-pointer"
            >
              Import from CSV
            </label>
            <span className="ml-3 text-sm text-gray-500">
              CSV must include: SKU ID, Length, Width, Height, Units Per Carton, Cartons Per Pallet
            </span>
          </div>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all"
            onClick={handleNavigateToAnalysis}
          >
            Next: Singular Cost Analysis →
          </button>
        </div>
      </div>
    </>
  );
};

export default CandidateConfigurations;