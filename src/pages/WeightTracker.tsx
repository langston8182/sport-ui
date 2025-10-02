import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, Minus, Scale } from 'lucide-react';
import { WeightEntry } from '../types';
import { weightsService, CreateWeightRequest, UpdateWeightRequest } from '../services/weights';
import { useToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import { WeightChart } from '../components/charts/WeightChart';

export default function WeightTracker() {
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWeight, setEditingWeight] = useState<WeightEntry | null>(null);
  const [formData, setFormData] = useState<CreateWeightRequest>({
    weight: 0,
    unit: 'kg',
    measureDate: new Date().toISOString().split('T')[0] + 'T09:00:00.000Z',
    notes: ''
  });
  const { showToast } = useToast();

  useEffect(() => {
    loadWeights();
  }, []);

  const loadWeights = async () => {
    try {
      setLoading(true);
      console.log('Loading weights...');
      const data = await weightsService.getAll();
      console.log('Received weights data:', data);
      setWeights(data.sort((a, b) => new Date(b.measureDate).getTime() - new Date(a.measureDate).getTime()));
    } catch (error) {
      showToast('Erreur lors du chargement des poids', 'error');
      console.error('Failed to load weights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.weight <= 0) {
      showToast('Le poids doit être supérieur à 0', 'error');
      return;
    }

    try {
      if (editingWeight) {
        const updateData: UpdateWeightRequest = {
          weight: formData.weight,
          unit: formData.unit,
          measureDate: formData.measureDate,
          notes: formData.notes || undefined
        };
        await weightsService.update(editingWeight._id, updateData);
        showToast('Poids modifié avec succès', 'success');
      } else {
        await weightsService.create(formData);
        showToast('Poids ajouté avec succès', 'success');
      }
      
      await loadWeights();
      handleCloseModal();
    } catch (error) {
      showToast(editingWeight ? 'Erreur lors de la modification' : 'Erreur lors de l\'ajout', 'error');
      console.error('Failed to save weight:', error);
    }
  };

  const handleEdit = (weight: WeightEntry) => {
    setEditingWeight(weight);
    setFormData({
      weight: weight.weight,
      unit: weight.unit,
      measureDate: weight.measureDate,
      notes: weight.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (weight: WeightEntry) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cette mesure de ${weight.weight} ${weight.unit} ?`)) {
      return;
    }

    try {
      await weightsService.delete(weight._id);
      showToast('Poids supprimé avec succès', 'success');
      await loadWeights();
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
      console.error('Failed to delete weight:', error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingWeight(null);
    setFormData({
      weight: 0,
      unit: 'kg',
      measureDate: new Date().toISOString().split('T')[0] + 'T09:00:00.000Z',
      notes: ''
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWeightChange = (currentWeight: number, previousWeight?: number) => {
    if (!previousWeight) return null;
    const change = currentWeight - previousWeight;
    return {
      value: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  };

  const getStats = () => {
    if (weights.length === 0) return null;

    const sortedWeights = [...weights].sort((a, b) => 
      new Date(a.measureDate).getTime() - new Date(b.measureDate).getTime()
    );

    const latest = sortedWeights[sortedWeights.length - 1];
    const oldest = sortedWeights[0];
    const min = Math.min(...weights.map(w => w.weight));
    const max = Math.max(...weights.map(w => w.weight));
    const avg = weights.reduce((sum, w) => sum + w.weight, 0) / weights.length;
    const trend = weightsService.getWeightTrend(weights);

    return {
      latest: latest?.weight || 0,
      totalChange: latest.weight - oldest.weight,
      min,
      max,
      avg,
      trend,
      count: weights.length
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Header moderne avec gradient */}
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-3">Suivi du Poids</h1>
          <p className="text-pastel-neutral-600 text-xl font-medium">Suivez votre évolution et atteignez vos objectifs</p>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pastel-green-100 to-pastel-green-200 flex items-center justify-center shadow-soft">
              <Scale className="w-6 h-6 text-pastel-green-700" />
            </div>
            <span className="text-pastel-neutral-500 font-medium">Gérer vos mesures</span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2 slide-up"
          >
            <Plus className="w-5 h-5" />
            Ajouter un poids
          </button>
        </div>

      {/* Statistiques modernes */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            <div className="card-pastel p-6 group slide-up" style={{ animationDelay: '0ms' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-pastel-neutral-500 text-sm font-semibold mb-3 uppercase tracking-wider">Poids actuel</p>
                  <p className="text-3xl font-bold text-pastel-blue-700 group-hover:text-pastel-blue-800 transition-colors">
                    {stats.latest.toFixed(1)} kg
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pastel-blue-100 to-pastel-blue-200 flex items-center justify-center shadow-soft">
                  <Scale className="w-6 h-6 text-pastel-blue-700" />
                </div>
              </div>
            </div>
            
            <div className="card-pastel p-6 group slide-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-pastel-neutral-500 text-sm font-semibold mb-3 uppercase tracking-wider">Évolution</p>
                  <div className={`text-3xl font-bold flex items-center gap-2 group-hover:scale-105 transition-transform ${
                    stats.totalChange > 0 ? 'text-pastel-orange-700' : 
                    stats.totalChange < 0 ? 'text-pastel-green-700' : 'text-pastel-neutral-700'
                  }`}>
                    {stats.totalChange > 0 ? <TrendingUp className="w-6 h-6" /> :
                     stats.totalChange < 0 ? <TrendingDown className="w-6 h-6" /> :
                     <Minus className="w-6 h-6" />}
                    {Math.abs(stats.totalChange).toFixed(1)} kg
                  </div>
                </div>
              </div>
            </div>

            <div className="card-pastel p-6 group slide-up" style={{ animationDelay: '200ms' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-pastel-neutral-500 text-sm font-semibold mb-3 uppercase tracking-wider">Minimum</p>
                  <p className="text-3xl font-bold text-pastel-green-700 group-hover:text-pastel-green-800 transition-colors">
                    {stats.min.toFixed(1)} kg
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pastel-green-100 to-pastel-green-200 flex items-center justify-center shadow-soft">
                  <TrendingDown className="w-6 h-6 text-pastel-green-700" />
                </div>
              </div>
            </div>

            <div className="card-pastel p-6 group slide-up" style={{ animationDelay: '300ms' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-pastel-neutral-500 text-sm font-semibold mb-3 uppercase tracking-wider">Maximum</p>
                  <p className="text-3xl font-bold text-pastel-rose-700 group-hover:text-pastel-rose-800 transition-colors">
                    {stats.max.toFixed(1)} kg
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pastel-rose-100 to-pastel-rose-200 flex items-center justify-center shadow-soft">
                  <TrendingUp className="w-6 h-6 text-pastel-rose-700" />
                </div>
              </div>
            </div>

            <div className="card-pastel p-6 group slide-up" style={{ animationDelay: '400ms' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-pastel-neutral-500 text-sm font-semibold mb-3 uppercase tracking-wider">Moyenne</p>
                  <p className="text-3xl font-bold text-pastel-purple-700 group-hover:text-pastel-purple-800 transition-colors">
                    {stats.avg.toFixed(1)} kg
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pastel-purple-100 to-pastel-purple-200 flex items-center justify-center shadow-soft">
                  <Scale className="w-6 h-6 text-pastel-purple-700" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Graphique d'évolution */}
        <div className="mb-8">
          <WeightChart weights={weights} />
        </div>

        {/* Liste des poids moderne */}
        <div className="card-pastel card-hover">
          <div className="p-6 border-b border-pastel-neutral-200/50">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gradient-primary">
                Historique des mesures
              </h2>
              <span className="badge-primary">
                {weights.length} mesure{weights.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {weights.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-pastel-blue-100 to-pastel-blue-200 rounded-3xl flex items-center justify-center shadow-soft">
                <Scale className="w-10 h-10 text-pastel-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-pastel-neutral-800 mb-2">Aucune mesure enregistrée</h3>
              <p className="text-pastel-neutral-500 mb-6 max-w-md mx-auto">
                Commencez à suivre votre poids pour visualiser votre évolution et atteindre vos objectifs.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary"
              >
                Ajouter votre première mesure
              </button>
            </div>
          ) : (
            <div className="divide-y divide-pastel-neutral-200/50">
              {weights.map((weight, index) => {
                const previousWeight = weights[index + 1];
                const change = getWeightChange(weight.weight, previousWeight?.weight);
                
                return (
                  <div key={weight._id} className="p-6 hover:bg-gradient-to-r hover:from-pastel-blue-50/30 hover:to-transparent transition-all duration-300 group">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="text-3xl font-bold text-pastel-neutral-800 group-hover:text-pastel-blue-700 transition-colors">
                            {weight.weight.toFixed(1)} {weight.unit}
                          </div>
                          {change && (
                            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold shadow-soft ${
                              change.direction === 'up' ? 'bg-gradient-to-r from-pastel-orange-100 to-pastel-orange-200 text-pastel-orange-700 border border-pastel-orange-200' :
                              change.direction === 'down' ? 'bg-gradient-to-r from-pastel-green-100 to-pastel-green-200 text-pastel-green-700 border border-pastel-green-200' :
                              'bg-gradient-to-r from-pastel-neutral-100 to-pastel-neutral-200 text-pastel-neutral-600 border border-pastel-neutral-200'
                            }`}>
                              {change.direction === 'up' ? <TrendingUp className="w-4 h-4" /> :
                               change.direction === 'down' ? <TrendingDown className="w-4 h-4" /> :
                               <Minus className="w-4 h-4" />}
                              {change.direction === 'up' ? '+' : change.direction === 'down' ? '-' : ''}
                              {change.value.toFixed(1)} kg
                            </div>
                          )}
                        </div>
                        
                        <div className="text-sm text-pastel-neutral-500 font-medium">
                          {formatDate(weight.measureDate)}
                        </div>
                        
                        {weight.notes && (
                          <div className="text-sm text-pastel-neutral-400 mt-2 px-3 py-2 bg-pastel-neutral-50 rounded-lg border border-pastel-neutral-200/50 italic">
                            "{weight.notes}"
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(weight)}
                          className="p-3 text-pastel-blue-600 hover:bg-pastel-blue-50 rounded-xl transition-colors shadow-soft hover:shadow-soft-lg transform hover:scale-105"
                          title="Modifier"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(weight)}
                          className="p-3 text-pastel-rose-600 hover:bg-pastel-rose-50 rounded-xl transition-colors shadow-soft hover:shadow-soft-lg transform hover:scale-105"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal d'ajout/modification */}
      <Modal 
        isOpen={showModal} 
        onClose={handleCloseModal}
        title={editingWeight ? 'Modifier le poids' : 'Ajouter un poids'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-pastel-neutral-700 mb-3 uppercase tracking-wider">
                Poids *
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="300"
                value={formData.weight || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  weight: parseFloat(e.target.value) || 0
                }))}
                className="input-pastel w-full"
                required
                placeholder="75.5"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-pastel-neutral-700 mb-3 uppercase tracking-wider">
                Unité
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  unit: e.target.value as 'kg' | 'lbs'
                }))}
                className="input-pastel w-full"
              >
                <option value="kg">Kilogrammes (kg)</option>
                <option value="lbs">Livres (lbs)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-pastel-neutral-700 mb-3 uppercase tracking-wider">
              Date et heure de la mesure *
            </label>
            <input
              type="datetime-local"
              value={formData.measureDate.slice(0, 16)}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                measureDate: e.target.value + ':00.000Z'
              }))}
              className="input-pastel w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-pastel-neutral-700 mb-3 uppercase tracking-wider">
              Notes (optionnel)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                notes: e.target.value
              }))}
              rows={4}
              className="input-pastel w-full resize-none"
              placeholder="Ajoutez une note sur cette mesure (contexte, objectif, ressenti...)..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-pastel-neutral-200/50">
            <button
              type="button"
              onClick={handleCloseModal}
              className="btn-secondary flex-1"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
            >
              {editingWeight ? 'Modifier la mesure' : 'Ajouter la mesure'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}