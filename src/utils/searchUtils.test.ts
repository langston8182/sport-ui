// Test file to verify the search utility works correctly
import { normalizeString, matchesSearchTerm } from './searchUtils';

// Test cases
console.log('=== Tests de normalisation ===');
console.log('Développé ->', normalizeString('Développé')); // -> developpe
console.log('épaule ->', normalizeString('épaule')); // -> epaule
console.log('Crêpe ->', normalizeString('Crêpe')); // -> crepe
console.log('Naïve ->', normalizeString('Naïve')); // -> naive
console.log('Café ->', normalizeString('Café')); // -> cafe

console.log('\n=== Tests de recherche ===');
console.log('developpe trouve Développé:', matchesSearchTerm('developpe', 'Développé')); // -> true
console.log('DEVELOPPE trouve Développé:', matchesSearchTerm('DEVELOPPE', 'Développé')); // -> true
console.log('epaule trouve Épaules:', matchesSearchTerm('epaule', 'Épaules')); // -> true
console.log('crepe trouve Crêpe:', matchesSearchTerm('crepe', 'Crêpe')); // -> true
console.log('test trouve Test normal:', matchesSearchTerm('test', 'Test normal')); // -> true
console.log('xyz trouve Développé:', matchesSearchTerm('xyz', 'Développé')); // -> false