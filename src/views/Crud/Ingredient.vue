<template>
  <v-container fluid class="ingredients-container">
    <v-row justify="center">
      <v-col cols="12" lg="10" xl="8">

        <!-- Header -->
        <div class="d-flex justify-space-between align-center mb-6">
          <div>
            <h1 class="text-h4 font-weight-bold">Gestion des Ingrédients</h1>
            <p class="text-body-1 text-medium-emphasis">Gérez vos ingrédients et leur disponibilité</p>
          </div>
          <v-btn
            color="primary"
            @click="openDialog()"
            class="d-none d-sm-flex"
          >
            <v-icon start>mdi-plus</v-icon>
            Ajouter
          </v-btn>
        </div>

        <!-- Data Table -->
        <v-card>
          <v-data-table
            :headers="headers"
            :items="ingredients"
            :loading="loading"
            item-value="id"
            class="elevation-0"
          >
            <!-- Price column -->
            <template #item.price="{ item }">
              {{ (item.price / 100).toFixed(2) }}€
            </template>

            <!-- Available column -->
            <template #item.isAvailable="{ item }">
              <v-chip
                :color="item.isAvailable ? 'success' : 'error'"
                size="small"
                variant="tonal"
              >
                {{ item.isAvailable ? 'Disponible' : 'Indisponible' }}
              </v-chip>
            </template>

            <!-- Actions column -->
            <template #item.actions="{ item }">
              <div class="d-flex ga-2">
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
        <v-dialog v-model="dialog" max-width="500">
          <v-card>
            <v-card-title>
              {{ editMode ? 'Modifier' : 'Ajouter' }} un ingrédient
            </v-card-title>

            <v-card-text>
              <v-form @submit.prevent="saveItem">
                <v-text-field
                  v-model="form.name"
                  label="Nom"
                  variant="outlined"
                  :error-messages="errors.name"
                  class="mb-3"
                />

                <v-text-field
                  v-model.number="form.price"
                  label="Prix (€)"
                  type="number"
                  step="0.01"
                  variant="outlined"
                  :error-messages="errors.price"
                  class="mb-3"
                />

                <v-switch
                  v-model="form.isAvailable"
                  label="Disponible"
                  color="primary"
                />
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
                {{ editMode ? 'Modifier' : 'Ajouter' }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { toast } from 'vue3-toastify'
import api from '../../utils/axios'

const loading = ref(false)
const saving = ref(false)
const dialog = ref(false)
const editMode = ref(false)
const ingredients = ref<any[]>([])

const headers = [
  { title: 'Nom', key: 'name', sortable: true },
  { title: 'Prix', key: 'price', sortable: true },
  { title: 'Disponibilité', key: 'isAvailable', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, width: '120px' }
]

const form = reactive({
  id: null as number | null,
  name: '',
  price: 0,
  isAvailable: true
})

const errors = reactive({
  name: '',
  price: ''
})

const fetchIngredients = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/api/ingredients')
    ingredients.value = data
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
    form.name = item.name
    form.price = item.price / 100
    form.isAvailable = item.isAvailable
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
  form.name = ''
  form.price = 0
  form.isAvailable = true
}

const clearErrors = () => {
  errors.name = ''
  errors.price = ''
}

const validateForm = () => {
  clearErrors()
  let valid = true

  if (!form.name.trim()) {
    errors.name = 'Nom requis'
    valid = false
  }
  if (form.price <= 0) {
    errors.price = 'Prix doit être positif'
    valid = false
  }

  return valid
}

const saveItem = async () => {
  if (!validateForm()) return

  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      price: Math.round(form.price * 100), // Convert to cents
      isAvailable: form.isAvailable
    }

    if (editMode.value) {
      await api.put(`/api/ingredients/${form.id}`, payload)
      toast.success('Ingrédient modifié')
    } else {
      await api.post('/api/ingredients', payload)
      toast.success('Ingrédient ajouté')
    }

    closeDialog()
    fetchIngredients()
  } catch (error) {
    toast.error('Erreur lors de la sauvegarde')
  } finally {
    saving.value = false
  }
}

const deleteItem = async (item: any) => {
  if (!confirm(`Supprimer "${item.name}" ?`)) return

  try {
    await api.delete(`/api/ingredients/${item.id}`)
    toast.success('Ingrédient supprimé')
    fetchIngredients()
  } catch (error) {
    toast.error('Erreur lors de la suppression')
  }
}

onMounted(() => {
  fetchIngredients()
})
</script>

<style scoped>
.ingredients-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 24px 0;
}
</style>
