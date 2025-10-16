import { useState, useEffect } from 'react';
import { Exercise } from '../types';
import { exercisesService } from '../services/exercises';
import { exerciseWeightsService } from '../services/exerciseWeights';
import { ExerciseProgression } from '../components/charts/ExerciseProgression';
import { Loader } from '../components/ui/Loader';

export default function ExerciseProgressionPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exercisesWithData, setExercisesWithData] = useState<Set<string>>(new Set());
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadExercises = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const exercisesList = await exercisesService.getAll();
        setExercises(exercisesList);

        // Récupérer les exercices qui ont des données de poids
        const exercisesWithWeightData = new Set<string>();
        for (const exercise of exercisesList) {
          try {
            const progressionData = await exerciseWeightsService.getProgression(exercise.id);
            if (progressionData.totalSessions > 0) {
              exercisesWithWeightData.add(exercise.id);
            }
          } catch (err) {
            // Ignorer les erreurs pour les exercices sans données
            console.log(`Pas de données pour l'exercice ${exercise.name}`);
          }
        }
        setExercisesWithData(exercisesWithWeightData);
      } catch (err) {
        setError('Erreur lors du chargement des exercices');
        console.error('Erreur chargement exercices:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadExercises();
  }, []);

  const filteredExercises = exercises
    .filter(exercise =>
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aHasData = exercisesWithData.has(a.id);
      const bHasData = exercisesWithData.has(b.id);
      
      // Les exercices avec données en premier
      if (aHasData && !bHasData) return -1;
      if (!aHasData && bHasData) return 1;
      
      // Puis tri alphabétique
      return a.name.localeCompare(b.name);
    });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Progression des Exercices</h1>
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Progression des Exercices</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Progression des Exercices</h1>
        {selectedExercise && (
          <button
            onClick={() => setSelectedExercise(null)}
            className="lg:hidden bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg text-sm font-medium"
          >
            ← Retour
          </button>
        )}
      </div>
      
      <div className="lg:grid lg:grid-cols-3 lg:gap-6">
        {/* Liste des exercices */}
        <div className={`lg:col-span-1 ${selectedExercise ? 'hidden lg:block' : ''}`}>
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Sélectionner un exercice</h2>
            
            {/* Barre de recherche */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Rechercher un exercice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Liste des exercices */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredExercises.length === 0 ? (
                <div className="text-gray-500 text-center py-4">
                  {searchTerm ? 'Aucun exercice trouvé' : 'Aucun exercice disponible'}
                </div>
              ) : (
                <>
                  {/* Exercices avec données */}
                  {filteredExercises.filter(ex => exercisesWithData.has(ex.id)).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Avec données de progression</h4>
                      <div className="space-y-2">
                        {filteredExercises
                          .filter(ex => exercisesWithData.has(ex.id))
                          .map((exercise) => (
                            <button
                              key={exercise.id}
                              onClick={() => setSelectedExercise(exercise)}
                              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex justify-between items-start">
                                <div className="font-medium">{exercise.name}</div>
                                <div className="flex-shrink-0 ml-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    📊
                                  </span>
                                </div>
                              </div>
                              <div className="text-sm text-gray-500">
                                Mode: {exercise.mode === 'reps' ? 'Répétitions' : 'Temps'}
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Exercices sans données */}
                  {filteredExercises.filter(ex => !exercisesWithData.has(ex.id)).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Autres exercices</h4>
                      <div className="space-y-2">
                        {filteredExercises
                          .filter(ex => !exercisesWithData.has(ex.id))
                          .map((exercise) => (
                            <button
                              key={exercise.id}
                              onClick={() => setSelectedExercise(exercise)}
                              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                              <div className="font-medium">{exercise.name}</div>
                              <div className="text-sm text-gray-500">
                                Mode: {exercise.mode === 'reps' ? 'Répétitions' : 'Temps'}
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Affichage de la progression */}
        <div className={`lg:col-span-2 ${!selectedExercise ? 'hidden lg:block' : ''}`}>
          {selectedExercise ? (
            <ExerciseProgression
              exerciseId={selectedExercise.id}
              exerciseName={selectedExercise.name}
            />
          ) : (
            <div className="bg-white rounded-lg shadow p-8">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">📈</div>
                <h3 className="text-lg font-medium mb-2">Visualisez votre progression</h3>
                <p className="text-sm">
                  Sélectionnez un exercice dans la liste pour voir votre évolution au fil du temps
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}