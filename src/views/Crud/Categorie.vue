<template>
  <v-card>
    <v-card-title>
      <span class="text-h6">Catégories</span>
      <v-spacer />
      <v-btn color="primary" size="small" @click="openAddModal" prepend-icon="mdi-plus">Ajouter</v-btn>
    </v-card-title>
    <v-divider />

    <v-list density="compact" class="category-list">
      <CategoryTreeItem
        v-for="cat in categories"
        :key="cat.id"
        :category="cat"
        @edit="openEditModal"
        @delete="openDeleteModal"
        level="0"
      />
    </v-list>

    <!-- Modale édition/ajout -->
    <v-dialog v-model="showEditModal" max-width="370">
      <v-card>
        <v-card-title class="text-subtitle-1">
          {{ editCategory.id ? 'Modifier' : 'Ajouter' }} une catégorie
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="editCategory.name" label="Nom" autofocus required density="compact"/>
          <v-select
            v-if="!editCategory.id"
            v-model="editCategory.parentId"
            :items="parentOptions"
            item-title="name"
            item-value="id"
            label="Catégorie parente"
            clearable
            density="compact"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" size="small" @click="saveEditCategory">Enregistrer</v-btn>
          <v-btn text size="small" @click="closeEditModal">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modale suppression -->
    <v-dialog v-model="showDeleteModal" max-width="330">
      <v-card>
        <v-card-title class="text-subtitle-1">Confirmer la suppression</v-card-title>
        <v-card-text>
          Supprimer <b>{{ deleteCategory?.name }}</b> ?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="error" size="small" @click="confirmDelete">Supprimer</v-btn>
          <v-btn text size="small" @click="showDeleteModal = false">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed } from "vue";
import { toast } from "vue3-toastify";
import api from "../../utils/axios";
import CategoryTreeItem from "./CategoryTreeItem.vue";

const categories = ref([]);
async function fetchCategories() {
  const { data } = await api.get("/api/categories");
  categories.value = data;
}
fetchCategories();

const showEditModal = ref(false);
const editCategory = ref({ id: null, name: "", parentId: null });
function openAddModal() {
  editCategory.value = { id: null, name: "", parentId: null };
  showEditModal.value = true;
}
function openEditModal(category) {
  editCategory.value = { ...category, parentId: category.parentId || null };
  showEditModal.value = true;
}
function closeEditModal() {
  showEditModal.value = false;
}
async function saveEditCategory() {
  if (editCategory.value.id) {
    await api.put(`/api/categories/${editCategory.value.id}`, {
      name: editCategory.value.name,
      parentId: editCategory.value.parentId || null,
    });
    toast.success("Catégorie mise à jour !");
  } else {
    await api.post("/api/categories", {
      name: editCategory.value.name,
      parentId: editCategory.value.parentId || null,
    });
    toast.success("Catégorie créée !");
  }
  showEditModal.value = false;
  fetchCategories();
}
const showDeleteModal = ref(false);
const deleteCategory = ref(null);
function openDeleteModal(category) {
  deleteCategory.value = category;
  showDeleteModal.value = true;
}
async function confirmDelete() {
  await api.delete(`/api/categories/${deleteCategory.value.id}`);
  toast.success("Catégorie supprimée !");
  showDeleteModal.value = false;
  fetchCategories();
}
const parentOptions = computed(() =>
  categories.value.map((cat) => ({
    id: cat.id,
    name: cat.name,
  }))
);
</script>

<style scoped>
.category-list {
  padding-bottom: 12px;
}
</style>
