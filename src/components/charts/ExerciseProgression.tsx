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
    <div className="p-3 sm:p-4 bg-white rounded-lg shadow">
      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Progression - {exerciseName}</h3>
      
      {/* Statistiques rapides */}
      <div className="mb-4 sm:mb-6">
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
          <h3 className="text-sm sm:text-lg font-semibold text-blue-800">Sessions totales</h3>
          <p className="text-xl sm:text-2xl font-bold text-blue-600">{progressionData.totalSessions}</p>
        </div>
      </div>

      {/* Progression par session */}
      <div className="space-y-3 sm:space-y-4">
        <h4 className="font-medium text-gray-700 text-sm sm:text-base">Progression par session</h4>
        <div className="max-h-80 sm:max-h-96 overflow-y-auto space-y-3 sm:space-y-4">
          {progressionData.progression
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((session) => (
            <div key={session.sessionId} className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <div className="flex justify-between items-center mb-2 sm:mb-3">
                <div className="font-medium text-sm sm:text-base">
                  {new Date(session.date).toLocaleDateString('fr-FR')}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  {session.weights.length} série{session.weights.length > 1 ? 's' : ''}
                </div>
              </div>
              
              {/* Détail des séries */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {session.weights
                  .sort((a, b) => a.setNumber - b.setNumber)
                  .map((weight) => (
                  <div key={weight._id} className="bg-white rounded p-2 border">
                    <div className="text-xs text-gray-500">Série {weight.setNumber}</div>
                    <div className="font-semibold text-sm">
                      {weight.weight} kg × {weight.reps}
                    </div>
                  </div>
                ))}
              </div>

              {/* Statistiques de la session */}
              <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-xs sm:text-sm">
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
            </div>
          ))}
        </div>
      </div>


    </div>
  );
};