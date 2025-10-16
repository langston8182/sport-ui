import React, { useState, useEffect } from 'react';
import { ExerciseWeight, ExerciseWeightCreate, ExerciseWeightPatch, WeightUnit } from '../../types';
import { exerciseWeightsService } from '../../services/exerciseWeights';

interface SetWeightInputProps {
  exerciseId: string;
  sessionId: string;
  setNumber: number;
  defaultReps?: number;
  existingWeight?: ExerciseWeight;
  onWeightSaved?: (weight: ExerciseWeight) => void;
  onWeightDeleted?: (weightId: string) => void;
  disabled?: boolean;
}

export const SetWeightInput: React.FC<SetWeightInputProps> = ({
  exerciseId,
  sessionId,
  setNumber,
  defaultReps = 0,
  existingWeight,
  onWeightSaved,
  onWeightDeleted,
  disabled = false,
}) => {
  const [weight, setWeight] = useState(existingWeight?.weight.toString() || '');
  const [isEditing, setIsEditing] = useState(!existingWeight);
  const [isSaving, setIsSaving] = useState(false);
  
  // Utiliser toujours kg comme unité et les reps par défaut de l'exercice
  const unit: WeightUnit = 'kg';
  const reps = defaultReps;

  useEffect(() => {
    if (existingWeight) {
      setWeight(existingWeight.weight.toString());
      setIsEditing(false);
    }
  }, [existingWeight]);

  const handleSave = async () => {
    if (!weight) return;

    setIsSaving(true);
    try {
      const weightValue = parseFloat(weight);

      let savedWeight: ExerciseWeight;

      if (existingWeight) {
        // Mise à jour
        const updates: ExerciseWeightPatch = {
          weight: weightValue,
          reps,
          unit,
        };
        savedWeight = await exerciseWeightsService.update(existingWeight._id, updates);
      } else {
        // Création
        const newWeight: ExerciseWeightCreate = {
          exerciseId,
          sessionId,
          weight: weightValue,
          unit,
          setNumber,
          reps,
        };
        savedWeight = await exerciseWeightsService.create(newWeight);
      }

      setIsEditing(false);
      onWeightSaved?.(savedWeight);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du poids:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingWeight) return;

    setIsSaving(true);
    try {
      await exerciseWeightsService.delete(existingWeight._id);
      onWeightDeleted?.(existingWeight._id);
    } catch (error) {
      console.error('Erreur lors de la suppression du poids:', error);
    } finally {
      setIsSaving(false);
    }
  };



  if (!isEditing && existingWeight) {
    return (
      <div className="inline-flex items-center bg-green-50 border border-green-200 rounded-lg overflow-hidden shadow-sm">
        <div className="flex items-center px-3 py-2">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm font-medium text-green-800">
            {existingWeight.weight} kg
          </span>
        </div>
        
        {!disabled && (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors duration-200 border-l border-green-200"
              title="Modifier"
            >
              Modifier
            </button>
            <button
              onClick={handleDelete}
              disabled={isSaving}
              className="px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed border-l border-green-200"
              title="Supprimer"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Suppr.'
              )}
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center px-3 py-2 bg-gray-50">
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Poids"
          className="w-16 sm:w-20 text-sm font-medium text-gray-900 bg-transparent border-0 outline-none placeholder-gray-400"
          step="0.5"
          min="0"
          disabled={disabled || isSaving}
        />
        <span className="ml-1 text-sm font-medium text-gray-500">kg</span>
      </div>
      
      <button
        onClick={handleSave}
        disabled={!weight || isSaving}
        className="px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed"
      >
        {isSaving ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          'OK'
        )}
      </button>
    </div>
  );
};