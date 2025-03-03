import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarton } from '../contexts/CartonContext';

// Define the type for candidate inputs
interface CandidateInput {
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
    length: 0,
    width: 0,
    height: 0,
    unitsPerCarton: 0,
    cartonsPerPallet: 0
  });

  const [editMode, setEditMode] = useState(false);
  const [editCandidateId, setEditCandidateId] = useState<number | null>(null);

  const cancelEdit = () => {
    setEditMode(false);
    setEditCandidateId(null);
    setNewCandidate({
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
      setNewCandidate(candidateData);
      setEditMode(true);
      setEditCandidateId(id);
    }
  };

  const submitCandidate = () => {
    handleAddCandidate(newCandidate, editMode, editCandidateId);
    cancelEdit();
  };

  // Function to handle navigation to Cost Analysis
  const handleNavigateToAnalysis = () => {
    navigate('/part2a');
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
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
                disabled={!newCandidate.length || !newCandidate.width || !newCandidate.height || !newCandidate.unitsPerCarton || !newCandidate.cartonsPerPallet}
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
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all">
            Import from CSV
          </button>
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