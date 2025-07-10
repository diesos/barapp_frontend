<template>
  <v-container class="orders-page">
    <v-row>
      <v-col cols="12">
        <h1 class="page-title mb-6">Mes Commandes</h1>

        <!-- Commandes en cours -->
        <div v-if="currentOrders.length > 0" class="current-orders-section mb-8">
          <h2 class="section-title mb-4">
            <v-icon class="mr-2" color="primary">mdi-clock-outline</v-icon>
            Commandes en cours ({{ currentOrders.length }})
          </h2>

          <div class="current-orders-stack">
            <v-card
              v-for="(order, index) in currentOrders"
              :key="order.id"
              class="current-order-card mb-4"
              elevation="4"
              :style="{ 'animation-delay': `${index * 0.1}s` }"
            >
              <v-card-title class="current-order-title">
                <div class="order-header">
                  <span class="order-number">Commande #{{ order.id }}</span>
                  <span class="order-date">{{ formatDate(order.createdAt) }}</span>
                </div>
              </v-card-title>

              <v-card-text>
                <!-- Barre de progression avec étapes -->
                <div class="progress-container mb-4">
                  <div class="progress-steps">
                    <div
                      v-for="(step, stepIndex) in progressSteps"
                      :key="step.status"
                      class="progress-step"
                      :class="{
                        'active': getStepIndex(order.status) >= stepIndex,
                        'current': getStepIndex(order.status) === stepIndex
                      }"
                    >
                      <div class="step-circle">
                        <v-icon
                          :color="getStepIndex(order.status) >= stepIndex ? 'white' : 'grey-lighten-1'"
                          size="18"
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
                      :style="{ width: getProgressPercentage(order.status) + '%' }"
                    ></div>
                  </div>
                </div>

                <!-- Résumé de la commande -->
                <div class="order-summary mb-4">
                  <v-row align="center">
                    <v-col cols="12" sm="4">
                      <div class="summary-item">
                        <v-icon class="mr-2" size="20">mdi-package-variant</v-icon>
                        <span>{{ order.totalItems }} article{{ order.totalItems > 1 ? 's' : '' }}</span>
                      </div>
                    </v-col>
                    <v-col cols="12" sm="4">
                      <v-chip
                        :color="getStatusColor(order.status)"
                        size="small"
                      >
                        {{ getStatusLabel(order.status) }}
                      </v-chip>
                    </v-col>
                    <v-col cols="12" sm="4" class="text-right">
                      <div class="order-total">
                        {{ formatPrice(order.totalAmount) }}
                      </div>
                    </v-col>
                  </v-row>
                </div>

                <!-- Accordéon pour les détails -->
                <v-expansion-panels class="order-details-accordion">
                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      <v-icon class="mr-2">mdi-eye</v-icon>
                      Voir les détails
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <div class="order-items">
                        <div
                          v-for="item in order.orderLines"
                          :key="item.id"
                          class="order-item-detailed"
                        >
                          <v-row align="center">
                            <v-col cols="2">
                              <v-avatar size="50" rounded="8">
                                <v-img
                                  :src="item.cocktail.imageUrl"
                                  :alt="item.cocktail.name"
                                  cover
                                >
                                  <template v-slot:placeholder>
                                    <v-icon size="30">mdi-glass-cocktail</v-icon>
                                  </template>
                                </v-img>
                              </v-avatar>
                            </v-col>
                            <v-col cols="5">
                              <div class="item-info">
                                <div class="item-name">{{ item.cocktail.name }}</div>
                                <div class="item-size">Taille: {{ item.cocktailSize.size }}</div>
                              </div>
                            </v-col>
                            <v-col cols="2" class="text-center">
                              <div class="item-quantity">
                                <v-chip size="small" variant="outlined">
                                  x{{ item.quantity }}
                                </v-chip>
                              </div>
                            </v-col>
                            <v-col cols="3" class="text-right">
                              <div class="item-price">
                                <div class="unit-price">{{ formatPrice(item.unitPrice) }}</div>
                                <div class="total-price">{{ formatPrice(item.totalSum) }}</div>
                              </div>
                            </v-col>
                          </v-row>
                        </div>
                      </div>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>

                <!-- Actions -->
                <div class="order-actions mt-4">
                  <v-btn
                    v-if="order.status === 'ORDERED'"
                    @click="openCancelDialog(order)"
                    color="error"
                    variant="outlined"
                    size="small"
                    :loading="cancellingOrder === order.id"
                  >
                    <v-icon class="mr-1">mdi-cancel</v-icon>
                    Annuler
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </div>
        </div>

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
              <p class="mt-4 text-grey">Aucune commande terminée trouvée</p>
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
                        {{ formatPrice(order.totalAmount) }}
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

        <!-- Modal d'annulation -->
    <v-dialog v-model="cancelDialog" max-width="420">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2" color="error">mdi-alert-circle</v-icon>
          Annulation de la commande #{{ cancelOrderData?.id }}
        </v-card-title>

        <v-card-text>
          <div v-if="cancelCheckLoading" class="text-center py-4">
            <v-progress-circular indeterminate color="primary" size="34"></v-progress-circular>
            <div class="mt-3">Vérification de l’état de la commande…</div>
          </div>

          <template v-else>
            <v-alert
              v-if="!cancelCheckResult?.canBeCancelled"
              type="error"
              variant="outlined"
              icon="mdi-block-helper"
              class="mb-2"
            >
              <strong>Impossible d’annuler !</strong><br>
              <span>{{ cancelCheckResult?.reason || 'La commande n\'est plus annulable.' }}</span>
            </v-alert>
            <v-alert
              v-else
              type="info"
              variant="tonal"
              icon="mdi-cancel"
              class="mb-2"
            >
              <strong>Êtes-vous sûr ?</strong> Cette action est <u>irréversible</u>.
            </v-alert>
          </template>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeCancelDialog" color="grey">Fermer</v-btn>
          <v-btn
            v-if="cancelCheckResult?.canBeCancelled"
            color="error"
            :loading="cancellingOrder === cancelOrderData?.id"
            @click="confirmCancelOrder"
          >
            <v-icon left>mdi-cancel</v-icon>
            Annuler la commande
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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

          <div v-if="selectedOrder.orderLines">
            <h4 class="mb-3">Articles commandés</h4>
            <div
              v-for="item in selectedOrder.orderLines"
              :key="item.id"
              class="order-item mb-3"
            >
              <v-row align="center">
                <v-col cols="2">
                  <v-avatar size="40" rounded="6">
                    <v-img
                      :src="item.cocktail.imageUrl"
                      :alt="item.cocktail.name"
                      cover
                    >
                      <template v-slot:placeholder>
                        <v-icon size="24">mdi-glass-cocktail</v-icon>
                      </template>
                    </v-img>
                  </v-avatar>
                </v-col>
                <v-col cols="6">
                  <div>
                    <div class="font-weight-medium">{{ item.cocktail.name }}</div>
                    <div class="text-caption text-grey">Taille: {{ item.cocktailSize.size }}</div>
                  </div>
                </v-col>
                <v-col cols="2" class="text-center">
                  <span>x{{ item.quantity }}</span>
                </v-col>
                <v-col cols="2" class="text-right">
                  <span>{{ formatPrice(item.totalSum) }}</span>
                </v-col>
              </v-row>
            </div>

            <v-divider class="my-3"></v-divider>
          </div>

          <v-row>
            <v-col cols="12" class="text-right">
              <strong class="total-amount">Total: {{ formatPrice(selectedOrder.totalAmount) }}</strong>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '../../utils/axios'
import { toast } from 'vue3-toastify'

interface OrderLine {
  id: number
  cocktail: { imageUrl: string; name: string }
  cocktailSize: { size: string }
  quantity: number
  unitPrice: number
  totalSum: number
}

interface Order {
  id: number
  createdAt: string
  status: string
  totalItems: number
  totalAmount: number
  orderLines: OrderLine[]
}

interface CancelCheckResult {
  canBeCancelled: boolean
  reason?: string
}

// --- States ---
const orders = ref<Order[]>([])
const loading = ref(false)
const cancellingOrder = ref<number | null>(null)
const refreshInterval = ref<any>(null)

const orderDetailsDialog = ref(false)
const selectedOrder = ref<Order | null>(null)

const progressSteps = [
  { status: 'ORDERED', label: 'Commandée', icon: 'mdi-cart-check' },
  { status: 'IN_PROGRESS', label: 'En préparation', icon: 'mdi-chef-hat' },
  { status: 'COMPLETED', label: 'Terminée', icon: 'mdi-check-circle' }
]

// --- Cancel modal states ---
const cancelDialog = ref(false)
const cancelOrderData = ref<Order | null>(null)
const cancelCheckLoading = ref(false)
const cancelCheckResult = ref<CancelCheckResult | null>(null)

// --- Computed ---
const currentOrders = computed(() =>
  orders.value
    .filter(order =>
      order.status === 'ORDERED' || order.status === 'IN_PROGRESS'
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
)

const pastOrders = computed(() =>
  orders.value
    .filter(order => order.status === 'COMPLETED' || order.status === 'CANCELLED')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
)

// --- Methods ---
async function fetchOrders() {
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

function showOrderDetails(order: Order) {
  api.get(`/api/orders/${order.id}/details`)
    .then(response => {
      selectedOrder.value = response.data
      orderDetailsDialog.value = true
    })
    .catch(error => {
      console.error('Erreur lors du chargement des détails:', error)
    })
}

function getStatusLabel(status: string) {
  const statusMap: Record<string, string> = {
    'ORDERED': 'Commandée',
    'IN_PROGRESS': 'En cours de préparation',
    'COMPLETED': 'Terminée',
    'CANCELLED': 'Annulée'
  }
  return statusMap[status] || status
}

function getStatusColor(status: string) {
  const colorMap: Record<string, string> = {
    'ORDERED': 'orange',
    'IN_PROGRESS': 'blue',
    'COMPLETED': 'green',
    'CANCELLED': 'red'
  }
  return colorMap[status] || 'grey'
}

function getStepIndex(status: string) {
  const stepMap: Record<string, number> = {
    'ORDERED': 0,
    'IN_PROGRESS': 1,
    'COMPLETED': 2
  }
  return stepMap[status] ?? -1
}

function getProgressPercentage(status: string) {
  const percentageMap: Record<string, number> = {
    'ORDERED': 33,
    'IN_PROGRESS': 66,
    'COMPLETED': 100
  }
  return percentageMap[status] || 0
}

function formatDate(dateString: string) {
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

function formatPrice(price: number | null | undefined) {
  if (price === null || price === undefined) return '0,00 €'
  price = price / 100;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}

function startRefreshInterval() {
  refreshInterval.value = setInterval(async () => {
    if (currentOrders.value.length > 0) {
      await fetchOrders()
    }
  }, 4000)
}

function stopRefreshInterval() {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

// --- Cancel modal logic ---
async function openCancelDialog(order: Order) {
  cancelDialog.value = true
  cancelOrderData.value = order
  cancelCheckLoading.value = true
  cancelCheckResult.value = null

  // UX : fake loading + check backend avec le status le + fiable
  setTimeout(async () => {
    try {
      // Utilisation du endpoint backend pour status à jour
      const res = await api.get('/api/orders/status/ORDERED')
      const found = res.data.find((o: Order) => o.id === order.id)
      if (found) {
        cancelCheckResult.value = { canBeCancelled: true }
      } else {
        cancelCheckResult.value = { canBeCancelled: false, reason: "La commande n'est plus annulable (déjà en cours ou terminée)." }
      }
    } catch (e) {
      cancelCheckResult.value = { canBeCancelled: false, reason: "Erreur lors du check d'annulabilité." }
    } finally {
      cancelCheckLoading.value = false
    }
  }, 1200)
}

function closeCancelDialog() {
  cancelDialog.value = false
  cancelOrderData.value = null
  cancelCheckResult.value = null
  cancelCheckLoading.value = false
}

async function confirmCancelOrder() {
  if (!cancelOrderData.value) return
  cancellingOrder.value = cancelOrderData.value.id
  try {
    await api.delete(`/api/orders/${cancelOrderData.value.id}`)
    await fetchOrders()
    closeCancelDialog()
  } catch (err) {
    cancelCheckResult.value = { canBeCancelled: false, reason: "Erreur lors de l'annulation." }
  } finally {
    toast.success("Commande annulée avec succès !", {
        position: "top-center"
        })
    cancellingOrder.value = null
  }
}

// --- Lifecycle ---
onMounted(async () => {
  await fetchOrders()
  startRefreshInterval()
})

onUnmounted(() => {
  stopRefreshInterval()
})
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

/* Commandes en cours */
.current-orders-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1976d2;
  display: flex;
  align-items: center;
}

.current-orders-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.current-order-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  animation: slideInFromTop 0.6s ease-out both;
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
  font-size: 1.1rem;
  font-weight: 600;
  color: #1976d2;
  padding: 16px 24px 8px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.order-number {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.order-date {
  color: #666;
  font-size: 0.85rem;
}

/* Résumé de commande */
.order-summary {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 16px;
}

.summary-item {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: #666;
}

.order-total {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1976d2;
}

/* Accordéon détails */
.order-details-accordion {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  overflow: hidden;
}

.order-items {
  padding: 8px 0;
}

.order-item-detailed {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.order-item-detailed:last-child {
  border-bottom: none;
}

.item-info {
  display: flex;
  flex-direction: column;
}

.item-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.item-size {
  color: #666;
  font-size: 0.8rem;
}

.item-quantity {
  text-align: center;
}

.item-price {
  text-align: right;
}

.unit-price {
  font-size: 0.8rem;
  color: #666;
}

.total-price {
  font-weight: 600;
  color: #1976d2;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
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
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  margin-bottom: 6px;
  border: 2px solid #e0e0e0;
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
  top: 38px;
  left: 20px;
  right: 20px;
  height: 3px;
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

/* Dialog */
.order-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.order-item:last-child {
  border-bottom: none;
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
.current-orders-section {
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
