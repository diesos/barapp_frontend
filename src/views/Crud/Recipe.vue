<template>
  <v-container fluid class="recipes-container">
    <v-row justify="center">
      <v-col cols="12" lg="10" xl="8">

        <!-- Header -->
        <div class="d-flex justify-space-between align-center mb-6">
          <div>
            <h1 class="text-h4 font-weight-bold">Gestion des Recettes</h1>
            <p class="text-body-1 text-medium-emphasis">Créez et gérez vos recettes de cocktails</p>
          </div>
          <v-btn
            color="primary"
            @click="openDialog()"
            class="d-none d-sm-flex"
          >
            <v-icon start>mdi-plus</v-icon>
            Nouvelle Recette
          </v-btn>
        </div>

        <!-- Data Table -->
        <v-card>
          <v-data-table
            :headers="headers"
            :items="recipes"
            :loading="loading"
            item-value="id"
            class="elevation-0"
          >
            <!-- Cocktail column -->
            <template #item.cocktail="{ item }">
              {{ item?.cocktailName || 'N/A' }}
            </template>

            <!-- Ingredients count -->
            <template #item.ingredientsCount="{ item }">
              <v-chip size="small" color="primary" variant="tonal">
                {{ item.recipeIngredients?.length || 0 }} ingrédients
              </v-chip>
            </template>

            <!-- Actions column -->
            <template #item.actions="{ item }">
              <div class="d-flex ga-2">
                <v-btn
                  icon="mdi-eye"
                  size="small"
                  variant="text"
                  @click="viewRecipe(item)"
                />
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  @click="openDialog(item)"
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
        <v-dialog v-model="dialog" max-width="800" persistent>
          <v-card>
            <v-card-title>
              {{ editMode ? 'Modifier' : 'Créer' }} une recette
            </v-card-title>

            <v-card-text>
              <v-form @submit.prevent="saveItem">
                <v-row>
                  <!-- Cocktail selection -->
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="form.cocktailId"
                      :items="cocktails"
                      item-title="name"
                      item-value="id"
                      label="Cocktail"
                      variant="outlined"
                      :error-messages="errors.cocktailId"
                    />
                  </v-col>

                  <!-- Recipe name -->
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="form.name"
                      label="Nom de la recette"
                      variant="outlined"
                      :error-messages="errors.name"
                    />
                  </v-col>

                  <!-- Description -->
                  <v-col cols="12">
                    <v-textarea
                      v-model="form.description"
                      label="Instructions"
                      variant="outlined"
                      rows="3"
                      :error-messages="errors.description"
                    />
                  </v-col>
                </v-row>

                <!-- Ingredients Section -->
                <div class="ingredients-section">
                  <div class="d-flex justify-space-between align-center mb-4">
                    <h3 class="text-h6">Ingrédients</h3>
                    <v-btn
                      color="primary"
                      variant="outlined"
                      size="small"
                      @click="addIngredientLine"
                    >
                      <v-icon start>mdi-plus</v-icon>
                      Ajouter
                    </v-btn>
                  </div>

                  <!-- Ingredient Lines -->
                  <div
                    v-for="(ingredient, index) in form.ingredients"
                    :key="index"
                    class="ingredient-line mb-3"
                  >
                    <v-row align="center">
                      <v-col cols="12" sm="6">
                        <v-select
                          v-model="ingredient.ingredientId"
                          :items="availableIngredients"
                          item-title="name"
                          item-value="id"
                          label="Ingrédient"
                          variant="outlined"
                          density="compact"
                          @keydown.tab.prevent="handleTabNavigation(index, 'quantity')"
                        />
                      </v-col>

                      <v-col cols="9" sm="4">
                        <v-text-field
                          v-model.number="ingredient.quantity"
                          label="Quantité"
                          type="number"
                          variant="outlined"
                          density="compact"
                          @keydown.tab.prevent="handleTabNavigation(index, 'next')"
                          :ref="`quantity-${index}`"
                        />
                      </v-col>

                      <v-col cols="3" sm="2">
                        <v-btn
                          icon="mdi-delete"
                          size="small"
                          variant="text"
                          color="error"
                          @click="removeIngredientLine(index)"
                          :disabled="form.ingredients.length <= 1"
                        />
                      </v-col>
                    </v-row>
                  </div>
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

        <!-- View Recipe Dialog -->
        <v-dialog v-model="viewDialog" max-width="600">
          <v-card v-if="selectedRecipe">
            <v-card-title>{{ selectedRecipe.name }}</v-card-title>
            <v-card-text>
              <p><strong>Cocktail:</strong> {{ selectedRecipe.cocktail?.name }}</p>
              <p><strong>Instructions:</strong></p>
              <p class="text-body-2">{{ selectedRecipe.description }}</p>

              <h4 class="mt-4 mb-2">Ingrédients:</h4>
              <v-list density="compact">
                <v-list-item
                  v-for="ri in selectedRecipe.recipeIngredients"
                  :key="ri.id"
                >
                  <v-list-item-title>
                    {{ ri.ingredient?.name }} - {{ ri.quantity }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn variant="text" @click="viewDialog = false">Fermer</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { toast } from 'vue3-toastify'
import api from '../../utils/axios'

const loading = ref(false)
const saving = ref(false)
const dialog = ref(false)
const viewDialog = ref(false)
const editMode = ref(false)

const recipes = ref<any[]>([])
const cocktails = ref<any[]>([])
const availableIngredients = ref<any[]>([])
const selectedRecipe = ref<any>(null)

const headers = [
  { title: 'Nom', key: 'name', sortable: true },
  { title: 'Cocktail', key: 'cocktail', sortable: false },
  { title: 'Description', key: 'description', sortable: false },
  { title: 'Ingrédients', key: 'ingredientsCount', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, width: '150px' }
]

const form = reactive({
  id: null as number | null,
  cocktailId: null as number | null,
  name: '',
  description: '',
  ingredients: [{ ingredientId: null, quantity: 1 }]
})

const errors = reactive({
  cocktailId: '',
  name: '',
  description: ''
})

const fetchData = async () => {
  loading.value = true
  try {
    const [recipesRes, cocktailsRes, ingredientsRes] = await Promise.all([
      api.get('/api/recipes'),
      api.get('/api/cocktails/all'),
      api.get('/api/ingredients')
    ])

    recipes.value = recipesRes.data
    cocktails.value = cocktailsRes.data
    availableIngredients.value = ingredientsRes.data
  } catch (error) {
    toast.error('Erreur lors du chargement')
  } finally {
    loading.value = false
  }
}

const openDialog = (item?: any) => {
  if (item) {
    editMode.value = true
    form.id = item.id
    form.cocktailId = item.cocktailId
    form.name = item.name
    form.description = item.description
    form.ingredients = item.recipeIngredients?.map((ri: any) => ({
      ingredientId: ri.ingredient.id,
      quantity: ri.quantity
    })) || [{ ingredientId: null, quantity: 1 }]
  } else {
    editMode.value = false
    resetForm()
  }
  dialog.value = true
}

const closeDialog = () => {
  dialog.value = false
  resetForm()
  clearErrors()
}

const resetForm = () => {
  form.id = null
  form.cocktailId = null
  form.name = ''
  form.description = ''
  form.ingredients = [{ ingredientId: null, quantity: 1 }]
}

const clearErrors = () => {
  errors.cocktailId = ''
  errors.name = ''
  errors.description = ''
}

const addIngredientLine = () => {
  form.ingredients.push({ ingredientId: null, quantity: 1 })
}

const removeIngredientLine = (index: number) => {
  if (form.ingredients.length > 1) {
    form.ingredients.splice(index, 1)
  }
}

const handleTabNavigation = async (index: number, field: string) => {
  await nextTick()

  if (field === 'quantity') {
    // Focus sur le champ quantité de la même ligne
    const quantityInput = document.querySelector(`[ref="quantity-${index}"] input`) as HTMLElement
    if (quantityInput) quantityInput.focus()
  } else if (field === 'next') {
    // Tab sur quantité -> nouvelle ligne
    if (index === form.ingredients.length - 1) {
      addIngredientLine()
      await nextTick()
      // Focus sur le select de la nouvelle ligne
      const nextSelect = document.querySelector(`[data-ingredient-select="${index + 1}"]`) as HTMLElement
      if (nextSelect) nextSelect.focus()
    } else {
      // Focus sur le select de la ligne suivante
      const nextSelect = document.querySelector(`[data-ingredient-select="${index + 1}"]`) as HTMLElement
      if (nextSelect) nextSelect.focus()
    }
  }
}

const validateForm = () => {
  clearErrors()
  let valid = true

  if (!form.cocktailId) {
    errors.cocktailId = 'Cocktail requis'
    valid = false
  }
  if (!form.name.trim()) {
    errors.name = 'Nom requis'
    valid = false
  }
  if (!form.description.trim()) {
    errors.description = 'Instructions requises'
    valid = false
  }

  return valid
}

const saveItem = async () => {
  if (!validateForm()) return

  saving.value = true
  try {
    const payload = {
      cocktailId: form.cocktailId,
      name: form.name.trim(),
      description: form.description.trim(),
      ingredients: form.ingredients.filter(ing => ing.ingredientId && ing.quantity > 0)
    }

    if (editMode.value) {
      await api.put(`/api/recipes/${form.id}`, payload)
      toast.success('Recette modifiée')
    } else {
      await api.post('/api/recipes', payload)
      toast.success('Recette créée')
    }

    closeDialog()
    fetchData()
  } catch (error) {
    toast.error('Erreur lors de la sauvegarde')
  } finally {
    saving.value = false
  }
}

const deleteItem = async (item: any) => {
  if (!confirm(`Supprimer "${item.name}" ?`)) return

  try {
    await api.delete(`/ap/recipes/${item.id}`)
    toast.success('Recette supprimée')
    fetchData()
  } catch (error) {
    toast.error('Erreur lors de la suppression')
  }
}

const viewRecipe = (item: any) => {
  selectedRecipe.value = item
  viewDialog.value = true
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.recipes-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 24px 0;
}

.ingredients-section {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  background-color: #fafafa;
}

.ingredient-line {
  background: white;
  border-radius: 4px;
  padding: 8px;
  border: 1px solid #eee;
}
</style>
