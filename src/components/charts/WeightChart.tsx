import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { WeightEntry } from '../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface WeightChartProps {
  weights: WeightEntry[];
}

export const WeightChart: React.FC<WeightChartProps> = ({ weights }) => {
  // Trier les poids par date
  const sortedWeights = [...weights].sort((a, b) => 
    new Date(a.measureDate).getTime() - new Date(b.measureDate).getTime()
  );

  // Préparer les données pour le graphique
  const labels = sortedWeights.map(weight => {
    const date = new Date(weight.measureDate);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'short',
      year: '2-digit'
    });
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'Poids (kg)',
        data: sortedWeights.map(weight => weight.weight),
        borderColor: 'rgb(59, 130, 246)', // blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: 'rgb(37, 99, 235)', // blue-600
        pointHoverBorderColor: 'white',
        pointHoverBorderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Évolution de votre poids',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
        color: 'rgb(31, 41, 55)', // gray-800
        padding: {
          bottom: 30,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            const index = context[0].dataIndex;
            const weight = sortedWeights[index];
            return new Date(weight.measureDate).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });
          },
          label: (context: any) => {
            return `Poids: ${context.parsed.y} kg`;
          },
          afterLabel: (context: any) => {
            const index = context.dataIndex;
            if (index > 0) {
              const currentWeight = sortedWeights[index].weight;
              const previousWeight = sortedWeights[index - 1].weight;
              const difference = currentWeight - previousWeight;
              const sign = difference > 0 ? '+' : '';
              return `Évolution: ${sign}${difference.toFixed(1)} kg`;
            }
            return '';
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(156, 163, 175, 0.2)', // gray-400 with opacity
          drawBorder: false,
        },
        ticks: {
          color: 'rgb(107, 114, 128)', // gray-500
          font: {
            size: 12,
          },
          callback: function(value: any) {
            return value + ' kg';
          },
        },
        // Ajuster automatiquement les limites avec une marge
        suggestedMin: Math.max(0, Math.min(...sortedWeights.map(w => w.weight)) - 2),
        suggestedMax: Math.max(...sortedWeights.map(w => w.weight)) + 2,
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgb(107, 114, 128)', // gray-500
          font: {
            size: 12,
          },
          maxRotation: 45,
          minRotation: 0,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    elements: {
      point: {
        hoverRadius: 8,
      },
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart' as const,
    },
  };

  if (weights.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune donnée</h3>
          <p className="text-gray-500">Ajoutez votre premier poids pour voir le graphique d'évolution</p>
        </div>
      </div>
    );
  }

  if (weights.length === 1) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Premier enregistrement</h3>
          <p className="text-gray-500 mb-4">Ajoutez au moins 2 mesures pour voir l'évolution</p>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-2xl font-bold text-blue-600">{weights[0].weight} kg</p>
            <p className="text-sm text-blue-600 mt-1">
              {new Date(weights[0].measureDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="h-80 sm:h-96">
        <Line data={data} options={options} />
      </div>
      
      {/* Statistiques rapides */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {Math.min(...sortedWeights.map(w => w.weight))} kg
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Minimum</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {Math.max(...sortedWeights.map(w => w.weight))} kg
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Maximum</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {(sortedWeights.reduce((sum, w) => sum + w.weight, 0) / sortedWeights.length).toFixed(1)} kg
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Moyenne</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {sortedWeights.length > 1 
                ? `${sortedWeights[sortedWeights.length - 1].weight - sortedWeights[0].weight > 0 ? '+' : ''}${(sortedWeights[sortedWeights.length - 1].weight - sortedWeights[0].weight).toFixed(1)} kg`
                : '0 kg'
              }
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Évolution</p>
          </div>
        </div>
      </div>
    </div>
  );
};