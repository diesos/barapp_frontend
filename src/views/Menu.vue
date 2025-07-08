<template>
  <div class="cocktail-app">
    <!-- Header avec filtres -->
    <div class="filters-section">
      <div class="container">
        <h1 class="app-title">Nos Cocktails</h1>

        <!-- Filtres par catégorie -->
        <div class="category-filters">
          <v-chip-group
            v-model="selectedCategory"
            filter
            color="primary"
            class="category-chips"
          >
            <v-chip
              value="all"
              size="large"
              variant="outlined"
              class="category-chip"
            >
              <v-icon start>mdi-all-inclusive</v-icon>
              Tous ({{ cocktails.length }})
            </v-chip>

            <v-chip
              v-for="category in availableCategories"
              :key="category.id"
              :value="category.id"
              size="large"
              variant="outlined"
              class="category-chip"
            >
              <v-icon start>{{ getCategoryIcon(category.name) }}</v-icon>
              {{ category.name }} ({{ getCategoryCount(category.id) }})
            </v-chip>
          </v-chip-group>
        </div>
      </div>
    </div>

    <!-- Grille de cocktails -->
    <div class="cocktails-grid">
      <div class="container">
        <div class="grid">
          <CocktailCard
            v-for="cocktail in filteredCocktails"
            :key="cocktail.id"
            :cocktail="cocktail"
            @add-to-cart="handleAddToCart"
            @toggle-favorite="handleToggleFavorite"
            @show-details="handleShowDetails"
            :disabled="!cocktail.isAvailable"
          />
        </div>

        <!-- Message si aucun cocktail -->
        <div v-if="filteredCocktails.length === 0" class="no-results">
          <v-icon size="64" color="grey">mdi-glass-cocktail</v-icon>
          <h3>Aucun cocktail trouvé</h3>
          <p>Essayez de sélectionner une autre catégorie</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import CocktailCard from './CocktailCard.vue'
import api from '../utils/axios'

const cocktails = ref([])
const selectedCategory = ref('all')

// Fonction pour récupérer les données
async function fetchData() {
  try {
    const { data } = await api.get('/api/cocktails')

    // Transformer les données pour correspondre au format attendu par CocktailCard
    cocktails.value = data.map(cocktail => ({
      ...cocktail,
      category: cocktail.category.name, // Extraire le nom de la catégorie
      sizes: cocktail.sizes.map(s => ({
        name: s.size,
        price: s.price / 100 // Convertir en euros
      })),
      ingredients: cocktail.ingredients || [] // Ajouter un tableau vide si pas d'ingrédients
    }))

    console.log('Données récupérées avec succès :', cocktails.value)
  } catch (error) {
    console.error('Erreur lors de la récupération des données :', error)
  }
}

// Computed pour récupérer les catégories disponibles
const availableCategories = computed(() => {
  const categories = cocktails.value.reduce((acc, cocktail) => {
    const categoryId = cocktail.category
    if (!acc.find(cat => cat.id === categoryId)) {
      acc.push({
        id: categoryId,
        name: categoryId
      })
    }
    return acc
  }, [])

  return categories.sort((a, b) => a.name.localeCompare(b.name))
})

// Computed pour filtrer les cocktails
const filteredCocktails = computed(() => {
  if (selectedCategory.value === 'all') {
    return cocktails.value
  }

  return cocktails.value.filter(cocktail =>
    cocktail.category === selectedCategory.value
  )
})

// Fonction pour compter les cocktails par catégorie
const getCategoryCount = (categoryId) => {
  return cocktails.value.filter(cocktail => cocktail.category === categoryId).length
}

// Fonction pour obtenir l'icône de catégorie
const getCategoryIcon = (categoryName) => {
  const icons = {
    'Base Rhum': 'mdi-glass-cocktail',
    'Base Whisky': 'mdi-glass-wine',
    'Base Vodka': 'mdi-glass-flute',
    'Base Gin': 'mdi-leaf',
    'Sans Alcool': 'mdi-water',
    'Tropical': 'mdi-palm-tree',
    'Classique': 'mdi-diamond-stone',
    'Signature': 'mdi-star',
    'Digestif': 'mdi-glass-wine',
    'Apéritif': 'mdi-glass-flute'
  }
  return icons[categoryName] || 'mdi-glass-cocktail'
}

// Gestionnaires d'événements
function handleAddToCart(item) {
  console.log('Ajout au panier :', item)
}

function handleToggleFavorite(data) {
  console.log('Toggle favori :', data)
}

function handleShowDetails(cocktail) {
  console.log('Voir détails :', cocktail)
}

onMounted(fetchData)
</script>

<style scoped>
.cocktail-app {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Header et filtres */
.filters-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding: 30px 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #1f2937;
  text-align: center;
  margin-bottom: 30px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.category-filters {
  display: flex;
  justify-content: center;
}

.category-chips {
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
}

.category-chip {
  margin: 4px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.category-chip:hover {
  transform: translateY(-2px);
}

/* Grille de cocktails */
.cocktails-grid {
  padding: 40px 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
}

/* Message aucun résultat */
.no-results {
  text-align: center;
  padding: 80px 20px;
  color: #6b7280;
}

.no-results h3 {
  font-size: 1.5rem;
  margin: 20px 0 10px;
  color: #374151;
}

.no-results p {
  font-size: 1rem;
  color: #6b7280;
}

/* Responsive */
@media (max-width: 768px) {
  .app-title {
    font-size: 2rem;
  }

  .filters-section {
    padding: 20px 0;
  }

  .grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .cocktails-grid {
    padding: 20px 0;
  }

  .category-chips {
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: 10px;
  }

  .category-chip {
    flex-shrink: 0;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 15px;
  }

  .app-title {
    font-size: 1.8rem;
  }
}
</style>
