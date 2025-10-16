import React, { useEffect, useState } from 'react';
import { ExerciseProgressionData } from '../../types';
import { exerciseWeightsService } from '../../services/exerciseWeights';

interface ExerciseProgressionProps {
  exerciseId: string;
  exerciseName: string;
}

export const ExerciseProgression: React.FC<ExerciseProgressionProps> = ({
  exerciseId,
  exerciseName,
}) => {
  const [progressionData, setProgressionData] = useState<ExerciseProgressionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProgression = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await exerciseWeightsService.getProgression(exerciseId);
        setProgressionData(data);
      } catch (err) {
        setError('Erreur lors du chargement de la progression');
        console.error('Erreur progression:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgression();
  }, [exerciseId]);

  if (isLoading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Progression - {exerciseName}</h3>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Progression - {exerciseName}</h3>
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  if (!progressionData || progressionData.progression.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Progression - {exerciseName}</h3>
        <div className="text-gray-500 text-center">
          Aucune donnée de progression disponible
        </div>
      </div>
    );
  }



  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Progression - {exerciseName}</h3>
      
      {/* Statistiques rapides */}
      <div className="mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800">Sessions totales</h3>
          <p className="text-2xl font-bold text-blue-600">{progressionData.totalSessions}</p>
        </div>
      </div>

      {/* Progression par session */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700">Progression par session</h4>
        <div className="max-h-96 overflow-y-auto space-y-4">
          {progressionData.progression
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((session) => (
            <div key={session.sessionId} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="font-medium">
                  {new Date(session.date).toLocaleDateString('fr-FR')}
                </div>
                <div className="text-sm text-gray-600">
                  {session.weights.length} série{session.weights.length > 1 ? 's' : ''}
                </div>
              </div>
              
              {/* Détail des séries */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {session.weights
                  .sort((a, b) => a.setNumber - b.setNumber)
                  .map((weight) => (
                  <div key={weight._id} className="bg-white rounded p-2 border">
                    <div className="text-xs text-gray-500">Série {weight.setNumber}</div>
                    <div className="font-semibold">
                      {weight.weight} kg × {weight.reps}
                    </div>
                  </div>
                ))}
              </div>

              {/* Statistiques de la session */}
              <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-sm">
                <span className="text-gray-600">
                  Poids max: <span className="font-medium">{session.maxWeight} kg</span>
                </span>
                <span className="text-gray-600">
                  Volume total: <span className="font-medium">
                    {session.weights.reduce((sum, w) => sum + (w.weight * w.reps), 0)} kg
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>


    </div>
  );
};