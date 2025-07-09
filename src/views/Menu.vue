<template>
  <div class="cocktail-app">
    <!-- Header avec filtres -->
    <div class="filters-section">
      <div class="container">
        <h1 class="app-title">Nos Cocktails</h1>

        <!-- Filtres par catégorie -->
        <div class="category-filters">
          <v-chip-group
            v-model="selectedCategoryId"
            filter
            color="primary"
            class="category-chips"
          >
            <!-- Chip "Tous" -->
            <v-chip
              value="all"
              size="large"
              variant="outlined"
              class="category-chip"
            >
              <v-icon start>mdi-all-inclusive</v-icon>
              Tous ({{ cocktails.length }})
            </v-chip>

            <!-- NOUVEAU: Itération sur la liste aplatie des catégories -->
            <v-chip
              v-for="category in flattenedCategories"
              :key="category.id"
              :value="category.id"
              size="large"
              variant="outlined"
              class="category-chip"
              :class="{ 'parent-category': category.isParent }"
            >
              <v-icon start>{{ getCategoryIcon(category.name) }}</v-icon>
              {{ category.name }} ({{ getCategoryCount(category) }})
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
import CocktailCard from './CocktailCard.vue' // Assure-toi que ce composant existe
import api from '../utils/axios'
import { toast } from 'vue3-toastify'
import { useBasketStore } from '../store/basket'


const basketStore = useBasketStore()


const cocktails = ref([])
const categories = ref([]) // NOUVEAU: Pour stocker la hiérarchie des catégories
const selectedCategoryId = ref('all') // NOUVEAU: On utilise l'ID pour la sélection



// Fonction pour récupérer toutes les données nécessaires
async function fetchData() {
  try {
    // On utilise Promise.all pour lancer les requêtes en parallèle
    const [cocktailsResponse, categoriesResponse] = await Promise.all([
      api.get('/api/cocktails'),
      api.get('/api/categories') // NOUVEAU: Appel à l'API des catégories
    ]);

    // Traitement des cocktails
    cocktails.value = cocktailsResponse.data.map(cocktail => ({
      ...cocktail,
      // On garde l'objet catégorie entier, c'est plus robuste
      category: cocktail.category || { id: null, name: 'Sans catégorie' },
      sizes: cocktail.sizes.map(s => ({
        id: s.id,
        name: s.size,
        price: s.price / 100
      })),
      ingredients: cocktail.ingredients || []
    }));

    // NOUVEAU: Stockage des catégories
    categories.value = categoriesResponse.data;

    console.log('Cocktails récupérés:', cocktails.value);
    console.log('Catégories récupérées:', categories.value);
  } catch (error) {
    console.error('Erreur lors de la récupération des données :', error);
  }
}

// NOUVEAU: Computed pour aplatir la liste des catégories pour les chips
const flattenedCategories = computed(() => {
  const flatList = [];
  categories.value.forEach(parent => {
    // Ajoute la catégorie parente
    flatList.push({
      id: parent.id,
      name: parent.name,
      isParent: true,
      childIds: parent.subcategories.map(sub => sub.id)
    });
    // Ajoute ses sous-catégories
    parent.subcategories.forEach(sub => {
      flatList.push({
        id: sub.id,
        name: sub.name,
        isParent: false
      });
    });
  });
  return flatList;
});

// NOUVEAU: Logique de filtrage améliorée
const filteredCocktails = computed(() => {
  if (selectedCategoryId.value === 'all' || !selectedCategoryId.value) {
    return cocktails.value;
  }

  // Trouve la catégorie sélectionnée dans notre liste aplatie
 const selectedCategory = flattenedCategories.value.find(
    c => String(c.id) === String(selectedCategoryId.value)
  );

  if (!selectedCategory) {
    return cocktails.value; // Sécurité si la catégorie n'est pas trouvée
  }
  if (selectedCategory.isParent && selectedCategory.childIds?.length > 0) {
 return cocktails.value.filter(cocktail =>
    cocktail.category.id === selectedCategory.id ||
    selectedCategory.childIds.includes(cocktail.category.id)
  );
  }
  // Si c'est une feuille (catégorie sans enfants ou sous-catégorie)
  return cocktails.value.filter(cocktail =>
    cocktail.category.id === selectedCategory.id
  );
});

const getCategoryCount = (category) => {
  if (category.isParent && category.childIds?.length > 0) {
    // On compte tous les cocktails dont la catégorie est dans childIds
    return cocktails.value.filter(c =>
    c.category.id === category.id ||
    category.childIds.includes(c.category.id)
  ).length;
  } else {
    // Sinon, on compte ceux qui ont exactement cette catégorie
    return cocktails.value.filter(c => c.category.id === category.id).length;
  }
};

// Fonction pour obtenir l'icône de catégorie (inchangée)
const getCategoryIcon = (categoryName) => {
  const icons = {
    'Base Rhum': 'mdi-glass-cocktail', 'Cocktails Classiques': 'mdi-diamond-stone',
    'Base Whisky': 'mdi-glass-wine', 'Cocktails Modernes': 'mdi-creation',
    'Base Vodka': 'mdi-glass-flute', 'Cocktails Fruités': 'mdi-fruit-cherries',
    'Base Gin': 'mdi-leaf', 'Cocktails Épicés': 'mdi-fire',
    'Sans Alcool': 'mdi-water', 'Shots': 'mdi-glass-stange',
  };
  return icons[categoryName] || 'mdi-glass-cocktail';
};

// Gestionnaires d'événements (inchangés)
async function handleAddToCart(item) {
  try{
    await basketStore.addToBasket(item.cocktailId, item.cocktailSizeId, item.quantity);
  }
  catch (error) {
    console.error('Erreur lors de l\'ajout au panier :', error);
    toast.error('Erreur lors de l\'ajout au panier', {
      position: 'top-right',
      autoClose: 2000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined
    });
    return;
  } finally {
  toast.success('Cocktail ajouté avec succès', {
    autoClose: 1000

  })}
  await fetchCart()
  }


async function fetchCart() {
  const { data } = await api.get('/api/basket')
  basket.value = data
  cartItems.value = data.basketLines
  cartTotal.value = data.totalAmount // adapte selon ton modèle
  cartCount.value = cartItems.value.reduce((acc, curr) => acc + curr.quantity, 0)
}

function handleToggleFavorite(data) {
  console.log('Toggle favori :', data);
}
function handleShowDetails(cocktail) {
  console.log('Voir détails :', cocktail);
}

onMounted(fetchData);
</script>

<!-- Le style est inchangé, comme demandé -->
<style scoped>
/* Ajout d'un style pour mieux voir les catégories parentes (optionnel) */
.parent-category {
  font-weight: 700 !important;
  border-style: dashed !important;
}

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
