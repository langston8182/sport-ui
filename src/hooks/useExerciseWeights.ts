import { useState, useEffect, useCallback } from 'react';
import { ExerciseWeight } from '../types';
import { exerciseWeightsService } from '../services/exerciseWeights';

export const useExerciseWeights = (sessionId: string) => {
  const [weights, setWeights] = useState<Record<string, ExerciseWeight[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset les poids quand sessionId change
  useEffect(() => {
    setWeights({});
    setError(null);
  }, [sessionId]);

  const loadWeightsForSession = useCallback(async () => {
    if (!sessionId) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const sessionWeights = await exerciseWeightsService.getAll({ sessionId });
      
      // Grouper par exerciceId
      const grouped = sessionWeights.reduce((acc, weight) => {
        if (!acc[weight.exerciseId]) {
          acc[weight.exerciseId] = [];
        }
        acc[weight.exerciseId].push(weight);
        return acc;
      }, {} as Record<string, ExerciseWeight[]>);

      // Trier par setNumber pour chaque exercice
      Object.keys(grouped).forEach(exerciseId => {
        grouped[exerciseId].sort((a, b) => a.setNumber - b.setNumber);
      });

      setWeights(grouped);
    } catch (err) {
      setError('Erreur lors du chargement des poids');
      console.error('Erreur chargement poids:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const getWeightsForExercise = useCallback((exerciseId: string): ExerciseWeight[] => {
    return weights[exerciseId] || [];
  }, [weights]);

  const getWeightForSet = useCallback((exerciseId: string, setNumber: number): ExerciseWeight | undefined => {
    const exerciseWeights = weights[exerciseId] || [];
    const result = exerciseWeights.find(w => w.setNumber === setNumber);
    return result;
  }, [weights]);

  const addWeight = useCallback((weight: ExerciseWeight) => {
    setWeights(prev => ({
      ...prev,
      [weight.exerciseId]: [
        ...(prev[weight.exerciseId] || []).filter(w => w._id !== weight._id),
        weight
      ].sort((a, b) => a.setNumber - b.setNumber)
    }));
  }, []);

  const removeWeight = useCallback((exerciseId: string, weightId: string) => {
    setWeights(prev => ({
      ...prev,
      [exerciseId]: (prev[exerciseId] || []).filter(w => w._id !== weightId)
    }));
  }, []);

  const updateWeight = useCallback((updatedWeight: ExerciseWeight) => {
    setWeights(prev => ({
      ...prev,
      [updatedWeight.exerciseId]: (prev[updatedWeight.exerciseId] || []).map(w =>
        w._id === updatedWeight._id ? updatedWeight : w
      )
    }));
  }, []);

  useEffect(() => {
    if (sessionId) {
      loadWeightsForSession();
    }
  }, [sessionId, loadWeightsForSession]);

  return {
    weights,
    isLoading,
    error,
    getWeightsForExercise,
    getWeightForSet,
    addWeight,
    removeWeight,
    updateWeight,
    reload: loadWeightsForSession,
  };
};