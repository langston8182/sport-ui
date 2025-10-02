// Test de la recherche insensible aux accents dans la console
// Execute dans le navigateur (Console DevTools)

console.log('%c=== Test de recherche sans accents ===', 'color: blue; font-weight: bold');

// Simule des noms d'exercices avec accents
const exercices = [
  { name: 'Développé couché', notes: 'Exercice pour les pectoraux' },
  { name: 'Élévations latérales', notes: 'Travail des épaules' },
  { name: 'Crunchs abdominaux', notes: 'Renforcement des abdos' },
  { name: 'Squats', notes: 'Exercice pour les cuisses' },
  { name: 'Curls biceps', notes: 'Isolation des biceps' },
  { name: 'Créatine supplementation', notes: 'Pré-workout' }
];

// Fonction de normalisation (copie de searchUtils.ts)
function normalizeString(str) {
  return str
    .toLowerCase()
    .normalize("NFD") // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, "") // Supprime les marques diacritiques
    .trim();
}

function matchesSearchTerm(searchTerm, text) {
  if (!searchTerm.trim()) return true;
  
  const normalizedSearch = normalizeString(searchTerm);
  const normalizedText = normalizeString(text);
  
  return normalizedText.includes(normalizedSearch);
}

// Tests
const termes = ['developpe', 'elevation', 'creatin', 'epaule', 'bicep'];

console.log('%cTests de recherche:', 'color: green; font-weight: bold');

termes.forEach(terme => {
  console.log(`\n🔍 Recherche pour "${terme}":`);
  
  const resultats = exercices.filter(ex => 
    matchesSearchTerm(terme, ex.name) || 
    (ex.notes && matchesSearchTerm(terme, ex.notes))
  );
  
  if (resultats.length > 0) {
    resultats.forEach(ex => {
      console.log(`  ✅ ${ex.name} (${ex.notes})`);
    });
  } else {
    console.log(`  ❌ Aucun résultat`);
  }
});

console.log('\n%c✨ Tests terminés !', 'color: purple; font-weight: bold');