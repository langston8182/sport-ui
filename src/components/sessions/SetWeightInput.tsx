import React, { useState } from 'react';
import { ExerciseWeight } from '../../types';
import { WeightModal } from './WeightModal';

interface SetWeightInputProps {
  exerciseId: string;
  sessionId: string;
  setNumber: number;
  defaultReps?: number;
  existingWeight?: ExerciseWeight;
  onWeightSaved?: (weight: ExerciseWeight) => void;
  onWeightDeleted?: (weightId: string) => void;
  disabled?: boolean;
  exerciseName?: string;
}

export const SetWeightInput: React.FC<SetWeightInputProps> = ({
  exerciseId,
  sessionId,
  setNumber,
  defaultReps = 10,
  existingWeight,
  onWeightSaved,
  onWeightDeleted,
  disabled = false,
  exerciseName = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleModalSave = (weight: ExerciseWeight) => {
    onWeightSaved?.(weight);
  };

  const handleModalDelete = (weightId: string) => {
    onWeightDeleted?.(weightId);
  };



  return (
    <>
      {existingWeight ? (
        // Affichage avec poids existant
        <div className="inline-flex items-center bg-green-50 border border-green-200 rounded-lg overflow-hidden shadow-sm">
          <div className="flex items-center px-3 py-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm font-medium text-green-800">
              {existingWeight.weight} kg
            </span>
          </div>
          
          {!disabled && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors duration-200 border-l border-green-200"
              title="Modifier"
            >
              Modifier
            </button>
          )}
        </div>
      ) : (
        // Bouton pour ajouter un poids
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={disabled}
          className="inline-flex items-center justify-center px-4 py-2 bg-white hover:bg-gray-50 disabled:bg-gray-50 border border-gray-300 hover:border-blue-300 disabled:border-gray-200 rounded-lg transition-all duration-200 disabled:cursor-not-allowed shadow-sm hover:shadow-md min-w-[100px]"
        >
          <span className="text-blue-600 mr-2 text-lg font-medium">+</span>
          <span className="text-sm font-medium text-gray-700 disabled:text-gray-400">
            Poids
          </span>
        </button>
      )}

      {/* Modal pour ajouter/modifier le poids */}
      <WeightModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        exerciseId={exerciseId}
        sessionId={sessionId}
        setNumber={setNumber}
        defaultReps={defaultReps}
        existingWeight={existingWeight}
        onWeightSaved={handleModalSave}
        onWeightDeleted={handleModalDelete}
        exerciseName={exerciseName}
      />
    </>
  );
};