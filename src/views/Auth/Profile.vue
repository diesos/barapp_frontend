<template>
  <v-container fluid class="profile-container">
    <v-row justify="center">
      <v-col cols="12" lg="10" xl="8">

        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-h4 font-weight-bold">Mon Profil</h1>
          <p class="text-body-1 text-medium-emphasis">Gérez vos informations et consultez vos commandes</p>
        </div>

        <v-row>
          <!-- User Info Card -->
          <v-col cols="12" md="6">
            <v-card class="h-100">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2" color="primary">mdi-account-circle</v-icon>
                Informations personnelles
              </v-card-title>

              <v-card-text>
                <v-list lines="two">
                  <v-list-item>
                    <v-list-item-title>Email</v-list-item-title>
                    <v-list-item-subtitle>{{ userEmail || 'Non défini' }}</v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-title>Rôle</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-chip
                        :color="getRoleColor(userRole)"
                        size="small"
                        variant="tonal"
                      >
                        {{ getRoleLabel(userRole) }}
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-title>Membre depuis</v-list-item-title>
                    <v-list-item-subtitle>{{ formatDate(new Date()) }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>

                <v-btn
                  color="error"
                  variant="outlined"
                  block
                  class="mt-4"
                  @click="logout"
                >
                  <v-icon start>mdi-logout</v-icon>
                  Déconnexion
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Orders Card -->
          <v-col cols="12" md="6">
            <v-card class="h-100">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2" color="primary">mdi-clipboard-list</v-icon>
                Mes Commandes
              </v-card-title>

              <v-card-text>
                <div v-if="loading" class="text-center py-4">
                  <v-progress-circular indeterminate color="primary" />
                </div>

                <div v-else-if="orders.length === 0" class="text-center py-4">
                  <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-package-variant</v-icon>
                  <p class="text-body-2 text-medium-emphasis">Aucune commande pour le moment</p>
                </div>

                <v-list v-else lines="three">
                  <v-list-item
                    v-for="order in orders"
                    :key="order.id"
                    class="mb-2"
                  >
                    <template #prepend>
                      <v-icon :color="getStatusColor(order.status)">
                        {{ getStatusIcon(order.status) }}
                      </v-icon>
                    </template>

                    <v-list-item-title>Commande #{{ order.id }}</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ formatDate(order.createdAt) }}
                    </v-list-item-subtitle>
                    <v-list-item-subtitle>
                      <v-chip
                        :color="getStatusColor(order.status)"
                        size="x-small"
                        variant="tonal"
                      >
                        {{ getStatusLabel(order.status) }}
                      </v-chip>
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>

                <v-btn
                  v-if="orders.length > 0"
                  variant="outlined"
                  block
                  class="mt-4"
                  @click="$router.push('/orders')"
                >
                  Voir toutes mes commandes
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../../store/auth'
import { useRouter } from 'vue-router'
import api from '../../utils/axios'

const authStore = useAuthStore()
const router = useRouter()

const loading = ref(false)
const orders = ref<any[]>([])

// Computed from store
const userEmail = computed(() => authStore.userEmail)
const userRole = computed(() => authStore.userRole)

const fetchOrders = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/api/orders')
    orders.value = data.slice(0, 3) // Dernières 3 commandes
  } catch (error) {
    console.error('Erreur récupération commandes:', error)
  } finally {
    loading.value = false
  }
}

const logout = () => {
  authStore.logout()
}

const getRoleColor = (role: string | null) => {
  switch (role) {
    case 'ROLE_ADMIN': return 'error'
    case 'ROLE_BARMAKER': return 'warning'
    case 'ROLE_USER': return 'primary'
    default: return 'grey'
  }
}

const getRoleLabel = (role: string | null) => {
  switch (role) {
    case 'ROLE_ADMIN': return 'Administrateur'
    case 'ROLE_BARMAKER': return 'Barmaker'
    case 'ROLE_USER': return 'Client'
    default: return 'Inconnu'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ORDERED': return 'info'
    case 'IN_PROGRESS': return 'warning'
    case 'COMPLETED': return 'success'
    default: return 'grey'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'ORDERED': return 'mdi-clock-outline'
    case 'IN_PROGRESS': return 'mdi-progress-clock'
    case 'COMPLETED': return 'mdi-check-circle'
    default: return 'mdi-help-circle'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'ORDERED': return 'Commandée'
    case 'IN_PROGRESS': return 'En cours'
    case 'COMPLETED': return 'Terminée'
    default: return 'Inconnu'
  }
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 24px 0;
}
</style>
