<template>
  <v-container class="orders-page">
    <v-row>
      <v-col cols="12">
        <h1 class="page-title mb-6">Mes Commandes</h1>

        <!-- Commande en cours -->
        <v-card
          v-if="currentOrder"
          class="current-order-card mb-8"
          elevation="4"
        >
          <v-card-title class="current-order-title">
            <v-icon class="mr-2" color="primary">mdi-clock-outline</v-icon>
            Commande en cours
          </v-card-title>

          <v-card-text>
            <div class="order-header mb-4">
              <span class="order-number">Commande #{{ currentOrder.id }}</span>
              <span class="order-date">{{ formatDate(currentOrder.createdAt) }}</span>
            </div>

            <!-- Barre de progression avec étapes -->
            <div class="progress-container mb-6">
              <div class="progress-steps">
                <div
                  v-for="(step, index) in progressSteps"
                  :key="step.status"
                  class="progress-step"
                  :class="{
                    'active': getStepIndex(currentOrder.status) >= index,
                    'current': getStepIndex(currentOrder.status) === index
                  }"
                >
                  <div class="step-circle">
                    <v-icon
                      :color="getStepIndex(currentOrder.status) >= index ? 'white' : 'grey-lighten-1'"
                      size="20"
                    >
                      {{ step.icon }}
                    </v-icon>
                  </div>
                  <span class="step-label">{{ step.label }}</span>
                </div>
              </div>

              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: getProgressPercentage(currentOrder.status) + '%' }"
                ></div>
              </div>
            </div>

            <!-- Détails de la commande -->
            <v-row class="order-details">
              <v-col cols="12" md="6">
                <div class="detail-item">
                  <strong>Statut:</strong>
                  <v-chip
                    :color="getStatusColor(currentOrder.status)"
                    class="ml-2"
                    size="small"
                  >
                    {{ getStatusLabel(currentOrder.status) }}
                  </v-chip>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="detail-item">
                  <strong>Total:</strong> {{ formatPrice(currentOrder.total) }}
                </div>
              </v-col>
            </v-row>

            <!-- Bouton annuler si possible -->
            <v-btn
              v-if="currentOrder.status === 'ORDERED'"
              @click="cancelOrder(currentOrder.id)"
              color="error"
              variant="outlined"
              class="mt-4"
              :loading="cancellingOrder"
            >
              <v-icon class="mr-1">mdi-cancel</v-icon>
              Annuler la commande
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- Historique des commandes -->
        <v-card class="orders-history" elevation="2">
          <v-card-title>
            <v-icon class="mr-2">mdi-history</v-icon>
            Historique des commandes
          </v-card-title>

          <v-card-text>
            <div v-if="loading" class="text-center py-8">
              <v-progress-circular
                indeterminate
                color="primary"
                size="50"
              ></v-progress-circular>
              <p class="mt-4">Chargement de vos commandes...</p>
            </div>

            <div v-else-if="pastOrders.length === 0" class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1">mdi-package-variant</v-icon>
              <p class="mt-4 text-grey">Aucune commande trouvée</p>
            </div>

            <div v-else class="orders-list">
              <v-card
                v-for="order in pastOrders"
                :key="order.id"
                class="order-card mb-4"
                variant="outlined"
                @click="showOrderDetails(order)"
              >
                <v-card-text>
                  <v-row align="center">
                    <v-col cols="12" sm="3">
                      <div class="order-info">
                        <div class="order-number">Commande #{{ order.id }}</div>
                        <div class="order-date">{{ formatDate(order.createdAt) }}</div>
                      </div>
                    </v-col>

                    <v-col cols="12" sm="3">
                      <v-chip
                        :color="getStatusColor(order.status)"
                        size="small"
                      >
                        {{ getStatusLabel(order.status) }}
                      </v-chip>
                    </v-col>

                    <v-col cols="12" sm="3">
                      <div class="order-total">
                        {{ formatPrice(order.total) }}
                      </div>
                    </v-col>

                    <v-col cols="12" sm="3" class="text-right">
                      <v-btn
                        icon="mdi-chevron-right"
                        variant="text"
                        size="small"
                      ></v-btn>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog pour les détails d'une commande -->
    <v-dialog v-model="orderDetailsDialog" max-width="600">
      <v-card v-if="selectedOrder">
        <v-card-title>
          <span>Détails de la commande #{{ selectedOrder.id }}</span>
          <v-spacer></v-spacer>
          <v-btn icon @click="orderDetailsDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="6">
              <strong>Date:</strong> {{ formatDate(selectedOrder.createdAt) }}
            </v-col>
            <v-col cols="6">
              <strong>Statut:</strong>
              <v-chip
                :color="getStatusColor(selectedOrder.status)"
                size="small"
                class="ml-2"
              >
                {{ getStatusLabel(selectedOrder.status) }}
              </v-chip>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <div v-if="selectedOrder.basketLines">
            <h4 class="mb-3">Articles commandés</h4>
            <div
              v-for="item in selectedOrder.basketLines"
              :key="item.id"
              class="order-item mb-2"
            >
              <v-row align="center">
                <v-col cols="8">
                  <span>{{ item.drink.name }}</span>
                </v-col>
                <v-col cols="2" class="text-center">
                  <span>x{{ item.quantity }}</span>
                </v-col>
                <v-col cols="2" class="text-right">
                  <span>{{ formatPrice(item.drink.price * item.quantity) }}</span>
                </v-col>
              </v-row>
            </div>

            <v-divider class="my-3"></v-divider>
          </div>

          <v-row>
            <v-col cols="12" class="text-right">
              <strong class="total-amount">Total: {{ formatPrice(selectedOrder.total) }}</strong>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>
<script>import { ref, onMounted, onUnmounted, computed } from 'vue'
import api from '../../utils/axios'

export default {
  name: 'OrdersPage',
  setup() {
    // État réactif
    const orders = ref([])
    const loading = ref(false)
    const cancellingOrder = ref(false)
    const refreshInterval = ref(null)
    const orderDetailsDialog = ref(false)
    const selectedOrder = ref(null)

    // États de progression
    const progressSteps = ref([
      { status: 'ORDERED', label: 'Commandée', icon: 'mdi-cart-check' },
      { status: 'IN_PROGRESS', label: 'En préparation', icon: 'mdi-chef-hat' },
      { status: 'COMPLETED', label: 'Terminée', icon: 'mdi-check-circle' }
    ])

    // Commandes calculées
    const currentOrder = computed(() => {
      return orders.value.find(order =>
        order.status === 'ORDERED' || order.status === 'IN_PROGRESS'
      )
    })

    const pastOrders = computed(() => {
      return orders.value
        .filter(order => order.status === 'COMPLETED' || order.status === 'CANCELLED')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    })

    // Méthodes
    const fetchOrders = async () => {
      try {
        loading.value = true
        const response = await api.get('/api/orders')
        orders.value = response.data
      } catch (error) {
        console.error('Erreur lors du chargement des commandes:', error)
      } finally {
        loading.value = false
      }
    }

    const cancelOrder = async (orderId) => {
      try {
        cancellingOrder.value = true
        await api.delete(`/api/orders/${orderId}`)
        await fetchOrders()
      } catch (error) {
        console.error('Erreur lors de l\'annulation:', error)
      } finally {
        cancellingOrder.value = false
      }
    }

    const showOrderDetails = async (order) => {
      try {
        const response = await api.get(`/api/orders/${order.id}/details`)
        selectedOrder.value = response.data
        orderDetailsDialog.value = true
      } catch (error) {
        console.error('Erreur lors du chargement des détails:', error)
      }
    }

    const getStatusLabel = (status) => {
      const statusMap = {
        'ORDERED': 'Commandée',
        'IN_PROGRESS': 'En cours de préparation',
        'COMPLETED': 'Terminée',
        'CANCELLED': 'Annulée'
      }
      return statusMap[status] || status
    }

    const getStatusColor = (status) => {
      const colorMap = {
        'ORDERED': 'orange',
        'IN_PROGRESS': 'blue',
        'COMPLETED': 'green',
        'CANCELLED': 'red'
      }
      return colorMap[status] || 'grey'
    }

    const getStepIndex = (status) => {
      const stepMap = {
        'ORDERED': 0,
        'IN_PROGRESS': 1,
        'COMPLETED': 2
      }
      return stepMap[status] ?? -1
    }

    const getProgressPercentage = (status) => {
      const percentageMap = {
        'ORDERED': 33,
        'IN_PROGRESS': 66,
        'COMPLETED': 100
      }
      return percentageMap[status] || 0
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const formatPrice = (price) => {
      if (price === null || price === undefined) return '0,00 €'
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(price)
    }

    const startRefreshInterval = () => {
      refreshInterval.value = setInterval(async () => {
        if (currentOrder.value) {
          await fetchOrders()
        }
      }, 4000)
    }

    const stopRefreshInterval = () => {
      if (refreshInterval.value) {
        clearInterval(refreshInterval.value)
        refreshInterval.value = null
      }
    }

    // Cycle de vie
    onMounted(async () => {
      await fetchOrders()
      startRefreshInterval()
    })

    onUnmounted(() => {
      stopRefreshInterval()
    })

    return {
      // État
      orders,
      loading,
      cancellingOrder,
      orderDetailsDialog,
      selectedOrder,
      progressSteps,

      // Computed
      currentOrder,
      pastOrders,

      // Méthodes
      fetchOrders,
      cancelOrder,
      showOrderDetails,
      getStatusLabel,
      getStatusColor,
      getStepIndex,
      getProgressPercentage,
      formatDate,
      formatPrice
    }
  }
}
</script>
<style scoped>
.orders-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  color: #1976d2;
  text-align: center;
}

/* Commande en cours */
.current-order-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
}

.current-order-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #1976d2, #42a5f5);
}

.current-order-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #1976d2;
  padding: 20px 24px 16px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.order-number {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.order-date {
  color: #666;
  font-size: 0.9rem;
}

/* Barre de progression */
.progress-container {
  position: relative;
  padding: 20px 0;
}

.progress-steps {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 2;
  margin-bottom: 12px;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
}

.step-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  margin-bottom: 8px;
  border: 3px solid #e0e0e0;
}

.progress-step.active .step-circle {
  background: #1976d2;
  border-color: #1976d2;
  transform: scale(1.1);
}

.progress-step.current .step-circle {
  background: #1976d2;
  border-color: #1976d2;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(25, 118, 210, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0);
  }
}

.step-label {
  font-size: 0.85rem;
  color: #666;
  text-align: center;
  font-weight: 500;
}

.progress-step.active .step-label {
  color: #1976d2;
  font-weight: 600;
}

.progress-bar {
  position: absolute;
  top: 44px;
  left: 24px;
  right: 24px;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  z-index: 1;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1976d2, #42a5f5);
  border-radius: 2px;
  transition: width 0.5s ease;
}

/* Détails de la commande */
.order-details {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 16px;
  margin-top: 20px;
}

.detail-item {
  margin-bottom: 8px;
}

/* Historique des commandes */
.orders-history {
  border-radius: 16px;
  overflow: hidden;
}

.orders-list {
  max-height: 600px;
  overflow-y: auto;
}

.order-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.order-info {
  display: flex;
  flex-direction: column;
}

.order-info .order-number {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.order-info .order-date {
  color: #666;
  font-size: 0.85rem;
}

.order-total {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1976d2;
}

/* Dialog */
.order-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.order-item:last-child {
  border-bottom: none;
}

.total-amount {
  font-size: 1.2rem;
  color: #1976d2;
}

/* Responsive */
@media (max-width: 768px) {
  .orders-page {
    padding: 16px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .progress-steps {
    flex-direction: column;
    gap: 16px;
  }

  .progress-step {
    flex-direction: row;
    justify-content: flex-start;
    width: 100%;
  }

  .step-circle {
    margin-right: 12px;
    margin-bottom: 0;
  }

  .progress-bar {
    display: none;
  }

  .order-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

/* Animations d'entrée */
.current-order-card {
  animation: slideInFromTop 0.6s ease-out;
}

.orders-history {
  animation: slideInFromBottom 0.6s ease-out 0.2s both;
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInFromBottom {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* États de chargement */
.v-progress-circular {
  margin: 0 auto;
}

/* Transitions fluides */
.v-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.v-chip {
  transition: all 0.2s ease;
}

.v-btn {
  transition: all 0.2s ease;
}

/* Scrollbar personnalisée */
.orders-list::-webkit-scrollbar {
  width: 6px;
}

.orders-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.orders-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.orders-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
