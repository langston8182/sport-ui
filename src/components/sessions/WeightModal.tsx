import React, { useState, useEffect } from 'react';
import { ExerciseWeight, ExerciseWeightCreate, ExerciseWeightPatch, WeightUnit } from '../../types';
import { exerciseWeightsService } from '../../services/exerciseWeights';
import { Modal } from '../ui/Modal';

interface WeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseId: string;
  sessionId: string;
  setNumber: number;
  defaultReps?: number;
  existingWeight?: ExerciseWeight;
  onWeightSaved?: (weight: ExerciseWeight) => void;
  onWeightDeleted?: (weightId: string) => void;
  exerciseName?: string;
}

export const WeightModal: React.FC<WeightModalProps> = ({
  isOpen,
  onClose,
  exerciseId,
  sessionId,
  setNumber,
  defaultReps = 10,
  existingWeight,
  onWeightSaved,
  onWeightDeleted,
  exerciseName = '',
}) => {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState(defaultReps.toString());
  const [isSaving, setIsSaving] = useState(false);
  
  const unit: WeightUnit = 'kg';
  const isEditing = !!existingWeight;

  useEffect(() => {
    if (isOpen) {
      if (existingWeight) {
        setWeight(existingWeight.weight.toString());
        setReps(existingWeight.reps.toString());
      } else {
        setWeight('');
        setReps(defaultReps.toString());
      }
    }
  }, [isOpen, existingWeight, defaultReps]);

  const handleSave = async () => {
    if (!weight || !reps) return;

    setIsSaving(true);
    try {
      const weightValue = parseFloat(weight);
      const repsValue = parseInt(reps);

      let savedWeight: ExerciseWeight;

      if (existingWeight) {
        // Mise à jour
        const updates: ExerciseWeightPatch = {
          weight: weightValue,
          reps: repsValue,
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
          reps: repsValue,
        };
        savedWeight = await exerciseWeightsService.create(newWeight);
      }

      onWeightSaved?.(savedWeight);
      onClose();
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
      onClose();
    } catch (error) {
      console.error('Erreur lors de la suppression du poids:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Modifier le poids' : 'Ajouter un poids'}>
      <div className="space-y-4">
        {/* Info exercice et série */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600">
            <div className="font-medium">{exerciseName}</div>
            <div>Série {setNumber}</div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="space-y-4">
          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
              Poids
            </label>
            <div className="relative">
              <input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0"
                className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-xl font-semibold"
                step="0.5"
                min="0"
                disabled={isSaving}
                autoFocus
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 font-medium">kg</span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="reps" className="block text-sm font-medium text-gray-700 mb-2">
              Répétitions
            </label>
            <input
              id="reps"
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="0"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-xl font-semibold"
              min="1"
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Actions */}
        <div
          className={`grid gap-3 pt-4 sm:auto-cols-fr ${
            isEditing ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
          }`}
        >
          {isEditing && (
            <button
              onClick={handleDelete}
              disabled={isSaving}
              className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Suppression...
                </div>
              ) : (
                'Supprimer'
              )}
            </button>
          )}
          
            <button
              onClick={onClose}
              disabled={isSaving}
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-medium rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            
            <button
              onClick={handleSave}
              disabled={!weight || !reps || isSaving}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isEditing ? 'Modification...' : 'Ajout...'}
                </div>
              ) : (
                isEditing ? 'Modifier' : 'Ajouter'
              )}
            </button>
        </div>
      </div>
    </Modal>
  );
};
