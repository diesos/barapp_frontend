<template>
  <v-container fluid class="cocktails-container">
    <v-row justify="center">
      <v-col cols="12" lg="10" xl="8">

        <!-- Header -->
        <div class="d-flex justify-space-between align-center mb-6">
          <div>
            <h1 class="text-h4 font-weight-bold">Gestion des Cocktails</h1>
            <p class="text-body-1 text-medium-emphasis">Créez et gérez votre carte de cocktails</p>
          </div>
          <v-btn
            color="primary"
            @click="openDialog()"
            class="d-none d-sm-flex"
          >
            <v-icon start>mdi-plus</v-icon>
            Nouveau Cocktail
          </v-btn>
        </div>

        <!-- Filters -->
        <v-card class="mb-4">
          <v-card-text>
            <v-row>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="filters.search"
                  label="Rechercher"
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  @input="applyFilters"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-select
                  v-model="filters.category"
                  :items="categories"
                  item-title="name"
                  item-value="id"
                  label="Catégorie"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  clearable
                  @update:model-value="applyFilters"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-select
                  v-model="filters.availability"
                  :items="availabilityOptions"
                  label="Disponibilité"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  clearable
                  @update:model-value="applyFilters"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Data Table -->
        <v-card>
          <v-data-table
            :headers="headers"
            :items="filteredCocktails"
            :loading="loading"
            item-value="id"
            class="elevation-0"
            item-key="id"
          >
            <!-- Image/Icon column -->
            <template #item.image="{ item }">
              <div
                class="cocktail-preview"
                :style="{ background: getCategoryGradient(item.category?.name) }"
              >
                <v-icon size="24" color="white">{{ getCategoryIcon(item.category?.name) }}</v-icon>
              </div>
            </template>

            <!-- Name column with category badge -->
            <template #item.name="{ item }">
              <div class="d-flex flex-column">
                <span class="font-weight-medium">{{ item.name }}</span>
                <v-chip
                  v-if="item.category"
                  size="x-small"
                  :color="getCategoryColor(item.category.name)"
                  variant="tonal"
                  class="mt-1"
                  style="width: fit-content"
                >
                  {{ item.category.name }}
                </v-chip>
              </div>
            </template>

            <!-- Price column -->
            <template #item.price="{ item }">
              <div>
                <span class="font-weight-medium">{{ (item.price / 100).toFixed(2) }}€</span>
                <span v-if="item.isDiscount" class="text-decoration-line-through ml-1 text-caption text-medium-emphasis">
                  {{ (item.discountPrice / 100).toFixed(2) }}€
                </span>
              </div>
            </template>

            <!-- Sizes column -->
            <template #item.sizes="{ item }">
              <div class="d-flex gap-1">
                <v-chip
                  v-for="size in item.sizes"
                  :key="size.id"
                  size="x-small"
                  :color="changeColorBySize(size.size)"
                  variant="flat"

                  class="text-capitalize mr-4"
                >
                 {{ size.size }} :  <strong>{{ (size.price / 100).toFixed(2) }}€</strong>
                </v-chip>
              </div>
            </template>

            <!-- Status column -->
            <template #item.status="{ item }">
              <div class="d-flex flex-column gap-1">
                <v-chip
                  size="small"
                  :color="item.isAvailable ? 'success' : 'error'"
                  variant="tonal"
                >
                  {{ item.isAvailable ? 'Disponible' : 'Indisponible' }}
                </v-chip>
                <v-chip
                  v-if="item.isDiscount"
                  size="small"
                  color="warning"
                  variant="tonal"
                >
                  Promotion
                </v-chip>
              </div>
            </template>

            <!-- Actions column -->
            <template #item.actions="{ item }">
              <div class="d-flex gap-2">
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  @click="openDialog(item)"
                />
                <v-btn
                  icon="mdi-toggle-switch"
                  size="small"
                  variant="text"
                  :color="item.isAvailable ? 'success' : 'error'"
                  @click="toggleAvailability(item)"
                  v-tooltip="item.isAvailable ? 'Marquer indisponible' : 'Marquer disponible'"
                />
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click="deleteItem(item)"
                />
              </div>
            </template>
          </v-data-table>
        </v-card>

        <!-- Mobile FAB -->
        <v-fab
          location="bottom end"
          color="primary"
          @click="openDialog()"
          class="d-flex d-sm-none"
        >
          <v-icon>mdi-plus</v-icon>
        </v-fab>

        <!-- Dialog Form -->
        <v-dialog v-model="dialog" max-width="900" persistent>
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon color="primary" class="mr-2">mdi-glass-cocktail</v-icon>
              {{ editMode ? 'Modifier' : 'Créer' }} un cocktail
            </v-card-title>

            <v-card-text>
              <v-form @submit.prevent="saveItem">
                <v-row>
                  <!-- Basic Info -->
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="form.name"
                      label="Nom du cocktail"
                      variant="outlined"
                      :error-messages="errors.name"
                      class="mb-3"
                    />

                    <v-select
                      v-model="form.categoryId"
                      :items="categories"
                      item-title="name"
                      item-value="id"
                      label="Catégorie"
                      variant="outlined"
                      :error-messages="errors.categoryId"
                      class="mb-3"
                      hint="Sélectionnez une catégorie"
                    />

                    <v-textarea
                      v-model="form.description"
                      label="Description"
                      variant="outlined"
                      rows="3"
                      :error-messages="errors.description"
                      class="mb-3"
                      hint="Description du cocktail"
                    />
                  </v-col>

                  <!-- Pricing and Availability -->
                  <v-col cols="12" md="6">
                    <!-- <v-text-field
                      v-model.number="form.price"
                      label="Prix (€)"
                      type="number"
                      step="0.01"
                      variant="outlined"
                      :error-messages="errors.price"
                      class="mb-3"
                    /> -->

                    <div class="d-flex gap-4 mb-3">
                      <v-switch
                        v-model="form.isVisible"
                        label="Visible sur la carte"
                        color="primary"
                      />
                      <v-switch
                        v-model="form.isAvailable"
                        label="Disponible"
                        color="success"
                      />
                    </div>

                    <v-switch
                      v-model="form.isDiscount"
                      label="Promotion"
                      color="warning"
                      class="mb-3"
                    />

                    <v-text-field
                      v-if="form.isDiscount"
                      v-model.number="form.discountPrice"
                      label="Prix promotionnel (€)"
                      type="number"
                      step="0.01"
                      variant="outlined"
                      :error-messages="errors.discountPrice"
                      class="mb-3"
                    />


                    <v-text-field
                      v-model="form.imageUrl"
                      label="Url de l'image du cocktail"
                      variant="outlined"
                      class="mb-3"
                    />
                  </v-col>
                </v-row>

                <!-- Sizes Section -->
                <div class="sizes-section mb-4">
                  <div class="d-flex justify-space-between align-center mb-2">
                    <h3 class="text-subtitle-1 font-weight-bold">Tailles et Prix</h3>
                    <v-btn
                      color="primary"
                      variant="outlined"
                      size="small"
                      @click="addSizeLine"
                    >
                      <v-icon start>mdi-plus</v-icon>
                      Ajouter
                    </v-btn>
                  </div>

                  <v-table density="compact">
                    <thead>
                      <tr>
                        <th>Taille</th>
                        <th>Prix (€)</th>
                        <th width="100">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(size, index) in form.sizes" :key="index">
                        <td>
                          <v-select
                            v-model="size.size"
                            :items="['S', 'M', 'L', 'XL']"
                            variant="outlined"
                            density="compact"
                            hide-details
                            class="size-select"
                            placeholder="Sélectionner une taille"
                          />
                        </td>
                        <td>
                          <v-text-field
                            v-model.number="size.price"
                            type="number"
                            step="0.01"
                            variant="outlined"
                            density="compact"
                            hide-details
                          />
                        </td>
                        <td>
                          <v-btn
                            icon="mdi-delete"
                            size="small"
                            variant="text"
                            color="error"
                            @click="removeSizeLine(index)"
                            :disabled="form.sizes.length <= 1"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </div>

                <!-- Recipe Section -->
                <div class="recipe-section">
                  <div class="d-flex justify-space-between align-center mb-2">
                    <h3 class="text-subtitle-1 font-weight-bold">Recette</h3>
                    <v-btn
                      color="primary"
                      variant="text"
                      size="small"
                      @click="createRecipe"
                      :disabled="!editMode || !form.id"
                    >
                      <v-icon start>mdi-notebook-edit</v-icon>
                      {{ hasRecipe ? 'Modifier la recette' : 'Créer une recette' }}
                    </v-btn>
                  </div>

                  <v-alert
                    v-if="!hasRecipe"
                    type="info"
                    variant="tonal"
                    density="compact"
                  >
                    <div v-if="editMode && form.id">
                      Aucune recette n'est associée à ce cocktail. Vous pourrez en créer une après avoir sauvegardé le cocktail.
                    </div>
                    <div v-else>
                      Vous pourrez créer une recette après avoir sauvegardé le cocktail.
                    </div>
                  </v-alert>

                  <v-list v-else density="compact" class="recipe-list">
                    <v-list-subheader>{{ recipe.name }}</v-list-subheader>
                    <v-list-item
                      v-for="ingredient in recipe.recipeIngredients"
                      :key="ingredient.id"
                      lines="two"
                    >
                      <v-list-item-title>{{ ingredient.ingredient.name }}</v-list-item-title>
                      <v-list-item-subtitle>Quantité: {{ ingredient.quantity }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </div>
              </v-form>
            </v-card-text>

            <v-card-actions>
              <v-spacer />
              <v-btn variant="text" @click="closeDialog">Annuler</v-btn>
              <v-btn
                color="primary"
                :loading="saving"
                @click="saveItem"
              >
                {{ editMode ? 'Modifier' : 'Créer' }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { toast } from 'vue3-toastify'
import { useRouter } from 'vue-router'
import api from '../../utils/axios'

const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const dialog = ref(false)
const editMode = ref(false)
const hasRecipe = ref(false)
const recipe = ref<any>(null)

const cocktails = ref<any[]>([])
const categories = ref<any[]>([])

const headers = [
  { title: '', key: 'image', sortable: false, width: '60px' },
  { title: 'Nom', key: 'name', sortable: true },
  { title: 'Format/Prix', key: 'sizes', sortable: false },
  { title: 'Statut', key: 'status', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, width: '150px' }
]

const availabilityOptions = [
  { title: 'Disponible', value: 'available' },
  { title: 'Indisponible', value: 'unavailable' },
  { title: 'En promotion', value: 'discount' }
]

const filters = reactive({
  search: '',
  category: null as number | null,
  availability: null as string | null
})

const form = reactive({
  id: null as number | null,
  name: '',
  description: '',
  price: 0,
  categoryId: null as number | null,
  isVisible: true,
  isAvailable: true,
  isDiscount: false,
  discountPrice: 0,
  imageUrl: null as string | null,
  sizes: [{ size: 'M', price: 0 }]
})

const errors = reactive({
  name: '',
  price: '',
  categoryId: '',
  description: '',
  discountPrice: '',
  imageUrl: ''
})

// Computed property for filtered cocktails
const filteredCocktails = computed(() => {
  let result = [...cocktails.value]

  // Apply search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    result = result.filter(c =>
      c.name.toLowerCase().includes(searchLower) ||
      (c.description && c.description.toLowerCase().includes(searchLower))
    )
  }

  // Apply category filter
  if (filters.category) {
    result = result.filter(c => c.category && c.category.id === filters.category)
  }

  // Apply availability filter
  if (filters.availability) {
    switch (filters.availability) {
      case 'available':
        result = result.filter(c => c.isAvailable)
        break
      case 'unavailable':
        result = result.filter(c => !c.isAvailable)
        break
      case 'discount':
        result = result.filter(c => c.isDiscount)
        break
    }
  }

  return result
})

// Fetch data
const fetchCocktails = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/api/cocktails/all')
    cocktails.value = data
  } catch (error) {
    toast.error('Erreur lors du chargement des cocktails')
  } finally {
    loading.value = false
  }
}

function flattenCategories(categories, level = 0) {
  return categories.reduce((acc, cat) => {
    acc.push({
      ...cat,
      label: `${'— '.repeat(level)}${cat.name}`
    });
    if (cat.subcategories && cat.subcategories.length) {
      acc = acc.concat(flattenCategories(cat.subcategories, level + 1));
    }
    return acc;
  }, []);
}

const fetchCategories = async () => {
  try {
    const { data } = await api.get('/api/categories')
    categories.value = flattenCategories(data);
    console.log('Catégories récupérées avec succès :', categories.value)
  } catch (error) {
    toast.error('Erreur lors du chargement des catégories')
  }
}

const changeColorBySize = (size: any) =>{
  const colors = {
    'S': 'primary',
    'M': 'warning',
    'L': 'alert',
    'XL': 'danger'
  }
  return colors[size] || 'primary'
}



const fetchRecipe = async (cocktailId: number) => {
  try {
    const { data } = await api.get(`/api/recipes/cocktail/${cocktailId}`)
    if (data && data.length > 0) {
      recipe.value = data[0]
      hasRecipe.value = true
    } else {
      hasRecipe.value = false
      recipe.value = null
    }
  } catch (error) {
    hasRecipe.value = false
    recipe.value = null
  }
}

// Form operations
const openDialog = async (item?: any) => {
  resetForm()

  if (item) {
    editMode.value = true
    form.id = item.id
    form.name = item.name
    form.description = item.description || ''
    form.price = item.price / 100
    form.categoryId = item.category?.id || null
    form.isVisible = item.isVisible
    form.isAvailable = item.isAvailable
    form.isDiscount = item.isDiscount
    form.imageUrl = item.imageUrl || null
    form.discountPrice = item.discountPrice ? item.discountPrice / 100 : 0

    // Handle sizes
    if (item.sizes && item.sizes.length > 0) {
      form.sizes = item.sizes.map((size: any) => ({
        size: size.size,
        price: size.price / 100
      }))
    }

    // Fetch recipe if exists
    await fetchRecipe(item.id)
  } else {
    editMode.value = false
    hasRecipe.value = false
    recipe.value = null
  }

  dialog.value = true
}

const closeDialog = () => {
  dialog.value = false
  resetForm()
}

const resetForm = () => {
  form.id = null
  form.name = ''
  form.description = ''
  form.price = 0
  form.categoryId = null
  form.isVisible = true
  form.isAvailable = true
  form.imageUrl = null
  form.isDiscount = false
  form.discountPrice = 0
  form.sizes = [{ size: 'S', price: 0 }, { size: 'M', price: 0 }, { size: 'L', price: 0 }, { size: 'XL', price: 0 }]
  clearErrors()
}

const clearErrors = () => {
  errors.name = ''
  errors.price = ''
  errors.categoryId = ''
  errors.description = ''
  errors.discountPrice = ''
}

const validateForm = () => {
  clearErrors()
  let valid = true

  if (!form.name.trim()) {
    errors.name = 'Nom requis'
    valid = false
  }

  // if (form.price <= 0) {
  //   errors.price = 'Prix doit être positif'
  //   valid = false
  // }

  if (form.isDiscount && (!form.discountPrice || form.discountPrice >= form.price)) {
    errors.discountPrice = 'Prix promotion doit être inférieur au prix normal'
    valid = false
  }

  return valid
}

const addSizeLine = () => {
  const sizes = ['S', 'M', 'L']
  const usedSizes = form.sizes.map(s => s.size)
  const availableSizes = sizes.filter(s => !usedSizes.includes(s))

  if (availableSizes.length > 0) {
    form.sizes.push({
      size: availableSizes[0],
      price: form.price // Default to main price
    })
  }
}

const removeSizeLine = (index: number) => {
  if (form.sizes.length > 1) {
    form.sizes.splice(index, 1)
  }
}

// API operations
const saveItem = async () => {
  if (!validateForm()) return

  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      categoryId: form.categoryId,
      isVisible: form.isVisible,
      isAvailable: form.isAvailable,
      isDiscount: form.isDiscount,
      imageUrl: form.imageUrl || null,
      discountPrice: form.isDiscount ? Math.round(form.discountPrice * 100) : null,
      sizes: form.sizes.map(size => ({
        size: size.size,
        price: Math.round(size.price * 100)
      }))
    }

    if (editMode.value) {
      await api.put(`/api/cocktails/${form.id}`, payload)
      toast.success('Cocktail modifié avec succès')
    } else {
      await api.post('/api/cocktails', payload)
      toast.success('Cocktail créé avec succès')
    }

    closeDialog()
    fetchCocktails()
  } catch (error) {
    toast.error('Erreur lors de la sauvegarde')
  } finally {
    saving.value = false
  }
}

const toggleAvailability = async (item: any) => {
  try {
    await api.patch(`/api/cocktails/${item.id}/toggle-availability`)
    toast.success(`Cocktail ${item.isAvailable ? 'désactivé' : 'activé'}`)
    fetchCocktails()
  } catch (error) {
    toast.error('Erreur lors de la modification')
  }
}

const deleteItem = async (item: any) => {
  if (!confirm(`Supprimer "${item.name}" ?`)) return

  try {
    await api.delete(`/api/cocktails/${item.id}`)
    toast.success('Cocktail supprimé')
    fetchCocktails()
  } catch (error) {
    toast.error('Erreur lors de la suppression')
  }
}

const createRecipe = () => {
  if (form.id) {
    router.push(`/recipe-management?cocktailId=${form.id}`)
  }
}

// Utility functions
const applyFilters = () => {
  // This function exists to handle debouncing if needed
  // Currently filters are applied automatically via the computed property
}

const getCategoryGradient = (category: string | undefined) => {
  const gradients: Record<string, string> = {
    'Classique': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    'Tropical': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    'Signature': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    'Sans Alcool': 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    'Digestif': 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    'Apéritif': 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    'default': 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
  }
  return gradients[category || ''] || gradients.default
}

const getCategoryIcon = (category: string | undefined) => {
  const icons: Record<string, string> = {
    'Classique': 'mdi-glass-cocktail',
    'Tropical': 'mdi-palm-tree',
    'Signature': 'mdi-diamond-stone',
    'Sans Alcool': 'mdi-leaf',
    'Digestif': 'mdi-glass-wine',
    'Apéritif': 'mdi-glass-flute',
    'default': 'mdi-glass-cocktail'
  }
  return icons[category || ''] || icons.default
}

const getCategoryColor = (category: string | undefined) => {
  const colors: Record<string, string> = {
    'Classique': 'amber',
    'Tropical': 'green',
    'Signature': 'purple',
    'Sans Alcool': 'cyan',
    'Digestif': 'red',
    'Apéritif': 'pink',
    'default': 'grey'
  }
  return colors[category || ''] || colors.default
}

// Lifecycle hooks
onMounted(() => {
  fetchCocktails()
  fetchCategories()
})
</script>

<style scoped>
.cocktails-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 24px 0;
}

.cocktail-preview {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sizes-section, .recipe-section {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  background-color: #fafafa;
}

.recipe-list {
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.size-select {
  min-width: 80px;
}

@media (max-width: 600px) {
  .v-table :deep(th), .v-table :deep(td) {
    padding: 0 8px;
  }
}
</style>
