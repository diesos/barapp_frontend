<template>
  <v-container class="order-board" :class="{ fullscreen: isFullscreen }">
    <div class="order-board-header">
      <h1 class="order-board-title mb-4">🍹 Gestion des Commandes</h1>
      <v-btn class="fullscreen-btn" icon color="primary" @click="toggleFullscreen">
        <v-icon v-if="!isFullscreen">mdi-arrow-expand-all</v-icon>
        <v-icon v-else>mdi-arrow-collapse-all</v-icon>
      </v-btn>
    </div>

    <div class="status-columns-flex">
      <div
        v-for="status in STATUSES"
        :key="status.key"
        class="status-column-flex"
      >
        <v-card class="status-card" :class="status.key" elevation="8">
          <div class="status-header">
            <v-icon :class="['status-icon', status.key, { pulse: status.pulse }]" size="42">
              {{ status.icon }}
            </v-icon>
            <div class="status-info">
              <span class="status-title">{{ status.label }}</span>
              <v-chip
                size="small"
                :color="status.color"
                variant="tonal"
                class="count-chip"
              >
                {{ status.orders.length }}
              </v-chip>
            </div>
          </div>
          <v-divider class="mb-3"></v-divider>

          <div class="order-list">
            <template v-if="status.orders.length > 0">
              <transition-group name="order-list" tag="div">
                <div
                  v-for="order in status.orders"
                  :key="order.id"
                  class="mcdo-order-card"
                  :class="{ 'can-progress': canProgressStatus(order.status) }"
                  @click="handleOrderClick(order)"
                >
                  <!-- Header avec numéro et montant -->
                  <div class="order-header">
                    <div class="order-number-badge">
                      <v-icon size="16" class="mr-1">mdi-receipt</v-icon>
                      #{{ order.id }}
                    </div>
                    <div class="order-amount">{{ formatPrice(order.totalAmount) }}</div>
                  </div>

                  <!-- Liste des items -->
                  <div class="order-items">
                    <div
                      v-for="(item, index) in order.orderLines"
                      :key="item.id"
                      class="order-item"
                    >
                      <div class="item-info">
                        <span class="item-name">{{ item.cocktail?.name }}</span>
                        <span class="item-size">{{ item.cocktailSize?.size }}</span>
                      </div>
                      <div class="item-quantity">x{{ item.quantity }}</div>
                    </div>
                  </div>

                  <!-- Footer avec heure et action -->
                  <div class="order-footer">
                    <div class="order-time">
                      <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
                      {{ formatTime(order.createdAt) }}
                    </div>
                    <v-btn
                      v-if="canProgressStatus(order.status)"
                      :color="getNextStatusColor(order.status)"
                      size="small"
                      variant="flat"
                      class="action-btn"
                      @click.stop="quickProgressStatus(order)"
                    >
                      <v-icon size="16" class="mr-1">{{ getNextStatusIcon(order.status) }}</v-icon>
                      {{ getNextStatusAction(order.status) }}
                    </v-btn>
                    <v-chip
                      v-else
                      size="small"
                      color="success"
                      variant="tonal"
                    >
                      <v-icon size="14" class="mr-1">mdi-check</v-icon>
                      Terminé
                    </v-chip>
                  </div>

                  <!-- Indicateur de progression -->
                  <div class="progress-indicator" :class="status.key"></div>
                </div>
              </transition-group>
            </template>
            <template v-else>
              <div class="empty-state">
                <v-icon size="64" color="grey-lighten-2" class="mb-3">{{ status.emptyIcon }}</v-icon>
                <div class="empty-text">{{ status.emptyText }}</div>
              </div>
            </template>
          </div>
        </v-card>
      </div>
    </div>

    <!-- Modal de confirmation pour terminer -->
<v-dialog v-model="confirmDialog" width="400" persistent>
  <v-card class="confirm-card">
    <v-card-title class="text-center pa-6">
      <v-icon size="48" color="success" class="mb-3">mdi-check-circle</v-icon>
      <div class="confirm-title">Confirmer la préparation</div>
    </v-card-title>
    <v-card-text class="text-center pb-2">
      <div class="confirm-text">
        Êtes-vous sûr que la commande <strong>#{{ selectedOrder?.id }}</strong> est prête ?
      </div>
      <div class="confirm-items mt-3">
        <v-chip
          v-for="item in selectedOrder?.orderLines || []"
          :key="item.id"
          size="small"
          variant="outlined"
          class="ma-1"
        >
          {{ item.cocktail?.name }} ({{ item.cocktailSize?.size }}) x{{ item.quantity }}
        </v-chip>
      </div>
    </v-card-text>
    <v-card-actions class="pa-4 justify-center gap-4 flex-column">
      <v-btn
        color="success"
        variant="flat"
        block
        class="mb-2"
        @click="confirmProgressStatus"
        :loading="isProgressing"
      >
        <v-icon class="mr-2">mdi-check-bold</v-icon>
        Confirmer
      </v-btn>
      <v-btn
        color="grey"
        variant="outlined"
        block
        @click="confirmDialog = false"
      >
        Annuler
      </v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

    <!-- Modal détails complets -->
    <v-dialog v-model="detailsDialog" width="500" persistent>
      <v-card class="details-card">
        <v-card-title class="details-header">
          <v-icon color="primary" class="mr-2">mdi-clipboard-list-outline</v-icon>
          <span>Commande #{{ selectedOrder?.id }}</span>
          <v-spacer />
          <v-btn icon @click="detailsDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="pa-4">
          <div class="details-summary mb-4">
            <v-row>
              <v-col cols="6">
                <div class="detail-label">Date</div>
                <div class="detail-value">{{ formatDate(selectedOrder?.createdAt) }}</div>
              </v-col>
              <v-col cols="6" class="text-right">
                <div class="detail-label">Statut</div>
                <v-chip :color="getStatusColor(selectedOrder?.status)" variant="tonal">
                  {{ getStatusLabel(selectedOrder?.status) }}
                </v-chip>
              </v-col>
            </v-row>
          </div>

          <v-divider class="mb-4"></v-divider>

          <div class="details-items">
            <h4 class="mb-3">Articles commandés</h4>
            <div v-for="item in selectedOrder?.orderLines || []" :key="item.id" class="detail-item">
              <v-row align="center" class="ma-0">
                <v-col cols="1" class="pa-1">
                  <v-avatar size="32" color="primary" variant="tonal">
                    <v-icon size="16">mdi-glass-cocktail</v-icon>
                  </v-avatar>
                </v-col>
                <v-col cols="7" class="pa-1">
                  <div class="item-detail-name">{{ item.cocktail?.name }}</div>
                  <div class="item-detail-size">Taille: {{ item.cocktailSize?.size }}</div>
                </v-col>
                <v-col cols="2" class="pa-1 text-center">
                  <div class="item-detail-qty">x{{ item.quantity }}</div>
                </v-col>
                <v-col cols="2" class="pa-1 text-right">
                  <div class="item-detail-price">{{ formatPrice(item.totalSum) }}</div>
                </v-col>
              </v-row>
            </div>
          </div>

          <v-divider class="my-4"></v-divider>

          <div class="details-total">
            <v-row>
              <v-col cols="8">
                <div class="total-label">Total</div>
              </v-col>
              <v-col cols="4" class="text-right">
                <div class="total-amount">{{ formatPrice(selectedOrder?.totalAmount) }}</div>
              </v-col>
            </v-row>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import api from '../../utils/axios'
import { toast } from 'vue3-toastify'

interface OrderLine {
  id: number
  cocktail: { name: string, imageUrl?: string }
  cocktailSize: { size: string }
  quantity: number
  totalSum: number
}

interface Order {
  id: number
  createdAt: string
  status: string
  totalAmount: number
  orderLines: OrderLine[]
}

const STATUSES = reactive([
  {
    key: 'ORDERED',
    label: 'Nouvelles Commandes',
    icon: 'mdi-cart-arrow-down',
    color: 'orange',
    pulse: true,
    apiStatus: 'ORDERED',
    orders: [] as Order[],
    emptyIcon: 'mdi-cart-outline',
    emptyText: 'Aucune nouvelle commande'
  },
  {
    key: 'IN_PROGRESS',
    label: 'En Préparation',
    icon: 'mdi-chef-hat',
    color: 'blue',
    pulse: true,
    apiStatus: 'IN_PROGRESS',
    orders: [] as Order[],
    emptyIcon: 'mdi-chef-hat',
    emptyText: 'Aucune commande en cours'
  },
  {
    key: 'COMPLETED',
    label: 'Terminées',
    icon: 'mdi-check-circle',
    color: 'green',
    pulse: false,
    apiStatus: 'COMPLETED',
    orders: [] as Order[],
    emptyIcon: 'mdi-check-circle-outline',
    emptyText: 'Aucune commande terminée'
  }
])

const detailsDialog = ref(false)
const confirmDialog = ref(false)
const selectedOrder = ref<Order | null>(null)
const isProgressing = ref(false)
const isFullscreen = ref(false)
const refreshIntervals: any[] = []

function fetchOrdersForStatus(statusObj: typeof STATUSES[0]) {
  api.get(`/api/orders/status/${statusObj.apiStatus}`)
    .then(res => {
      const valid = Array.isArray(res.data)
        ? res.data.filter(order => order && order.id)
        : []
      statusObj.orders.splice(0, statusObj.orders.length, ...valid)
    })
    .catch(error => {
      console.error(`Error fetching orders for ${statusObj.apiStatus}:`, error)
      statusObj.orders.splice(0, statusObj.orders.length)
    })
}

function setupFetchers() {
  STATUSES.forEach(status => {
    fetchOrdersForStatus(status)
    const interval = setInterval(() => {
      fetchOrdersForStatus(status)
    }, 5000) // Refresh toutes les 5 secondes
    refreshIntervals.push(interval)
  })
}

function cleanupFetchers() {
  refreshIntervals.forEach(clearInterval)
  refreshIntervals.splice(0, refreshIntervals.length)
}

// Actions pour gérer les clicks
function handleOrderClick(order: Order) {
  selectedOrder.value = order
  detailsDialog.value = true
}

function quickProgressStatus(order: Order) {
  selectedOrder.value = order

  if (order.status === 'ORDERED') {
    // Passage direct à "En préparation"
    progressToNextStatus(order)
  } else if (order.status === 'IN_PROGRESS') {
    // Demander confirmation pour terminer
    confirmDialog.value = true
  }
}

function confirmProgressStatus() {
  if (selectedOrder.value) {
    progressToNextStatus(selectedOrder.value)
  }
}

async function progressToNextStatus(order: Order) {
  isProgressing.value = true

  try {
    let endpoint = ''
    if (order.status === 'ORDERED') {
      endpoint = `/api/orders/${order.id}/start`
    } else if (order.status === 'IN_PROGRESS') {
      endpoint = `/api/orders/${order.id}/complete`
    }

    await api.patch(endpoint)

    // Refresh les colonnes impactées
    const oldStatusObj = STATUSES.find(s => s.apiStatus === order.status)
    const newStatus = getNextStatus(order.status)
    const newStatusObj = STATUSES.find(s => s.apiStatus === newStatus)

    if (oldStatusObj) fetchOrdersForStatus(oldStatusObj)
    if (newStatusObj) fetchOrdersForStatus(newStatusObj)

    // Notifications et sons
    playSuccessSound()

    if (order.status === 'ORDERED') {
      toast.success('Commande mise en préparation ! 👨‍🍳', {
        position: 'top-center',
        autoClose: 2000
      })
    } else {
      toast.success('Commande terminée ! 🎉', {
        position: 'top-center',
        autoClose: 2000
      })
    }

    // Fermer les modals
    confirmDialog.value = false
    detailsDialog.value = false

  } catch (error) {
    console.error('Error updating order status:', error)
    toast.error('Erreur lors du changement de statut', { position: 'top-center' })
  } finally {
    isProgressing.value = false
  }
}

// Utilitaires pour les statuts
function getNextStatus(status: string): string | null {
  if (status === 'ORDERED') return 'IN_PROGRESS'
  if (status === 'IN_PROGRESS') return 'COMPLETED'
  return null
}

function canProgressStatus(status: string) {
  return getNextStatus(status) !== null
}

function getNextStatusAction(status: string) {
  if (status === 'ORDERED') return 'Préparer'
  if (status === 'IN_PROGRESS') return 'Terminer'
  return ''
}

function getNextStatusIcon(status: string) {
  if (status === 'ORDERED') return 'mdi-chef-hat'
  if (status === 'IN_PROGRESS') return 'mdi-check-bold'
  return 'mdi-help'
}

function getNextStatusColor(status: string) {
  if (status === 'ORDERED') return 'primary'
  if (status === 'IN_PROGRESS') return 'success'
  return 'grey'
}

function getStatusLabel(status?: string) {
  const map: Record<string, string> = {
    'ORDERED': 'Commandée',
    'IN_PROGRESS': 'En préparation',
    'COMPLETED': 'Terminée'
  }
  return map[status ?? ''] ?? status
}

function getStatusColor(status?: string) {
  const map: Record<string, string> = {
    'ORDERED': 'orange',
    'IN_PROGRESS': 'blue',
    'COMPLETED': 'green'
  }
  return map[status ?? ''] ?? 'grey'
}

// Utilitaires de formatage
function formatDate(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

function formatTime(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit'
  })
}

function formatPrice(amount: number | undefined) {
  return amount === undefined
    ? ''
    : `${(amount / 100).toFixed(2)} €`
}

function playSuccessSound() {
  try {
    const audio = new Audio('https://cdn.jsdelivr.net/gh/bastify/public@main/applepay.mp3')
    audio.volume = 0.3
    audio.play()
  } catch (error) {
    console.log('Audio playback failed:', error)
  }
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  if (isFullscreen.value) {
    const elem = document.documentElement
    if (elem.requestFullscreen) elem.requestFullscreen()
    // Ajoute la classe hide-sidebar sur <body> et sur .v-application
    document.body.classList.add('hide-sidebar')
    const appRoot = document.querySelector('.v-application')
    if (appRoot) appRoot.classList.add('hide-sidebar')
  } else {
    if (document.exitFullscreen) document.exitFullscreen()
    document.body.classList.remove('hide-sidebar')
    const appRoot = document.querySelector('.v-application')
    if (appRoot) appRoot.classList.remove('hide-sidebar')
  }
}


onMounted(() => {
  setupFetchers()
})

onUnmounted(() => {
  cleanupFetchers()
})
</script>

<style scoped>
/* Layout principal */
.order-board {
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px 16px;
  min-height: 100vh;
}


.order-board-title {
  font-size: 2.4rem;
  font-weight: 800;
  text-align: center;
  color: #1a1a1a;
  letter-spacing: -0.5px;
}

.order-board-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
  position: relative;
}

.fullscreen-btn {
  position: absolute;
  top: 0;
  right: 0;
}

/* Layout des colonnes */
.status-columns-flex {
  display: flex;
  gap: 24px;
  height: calc(100vh - 200px);
  min-height: 600px;
}

.status-column-flex {
  flex: 1;
  min-width: 320px;
  display: flex;
  flex-direction: column;
}

/* Cartes de statut */
.status-card {
  height: 100%;
  border-radius: 16px !important;
  overflow: hidden;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  display: flex;
  flex-direction: column;
}

.status-card.ORDERED {
  border-top: 4px solid #ff6b35;
}

.status-card.IN_PROGRESS {
  border-top: 4px solid #2196f3;
}

.status-card.COMPLETED {
  border-top: 4px solid #4caf50;
}

/* Header des statuts */
.status-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px 16px;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.status-title {
  font-weight: 700;
  font-size: 1.3rem;
  color: #2c3e50;
  letter-spacing: -0.3px;
}

.status-icon {
  background: #fff;
  border-radius: 50%;
  padding: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.status-icon.ORDERED { color: #ff6b35; }
.status-icon.IN_PROGRESS { color: #2196f3; }
.status-icon.COMPLETED { color: #4caf50; }

.pulse {
  animation: pulse-glow 2s infinite;
}

@keyframes pulse-glow {
  0% { box-shadow: 0 4px 20px rgba(33, 150, 243, 0.1); }
  50% { box-shadow: 0 4px 25px rgba(33, 150, 243, 0.3); }
  100% { box-shadow: 0 4px 20px rgba(33, 150, 243, 0.1); }
}

.count-chip {
  font-weight: 700;
  font-size: 0.9rem;
}

/* Liste des commandes */
.order-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
  min-height: 0;
}

/* Cartes de commande style McDo */
.mcdo-order-card {
  background: #fff;
  border-radius: 12px;
  margin-bottom: 16px;
  border: 2px solid #e2e8f0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.mcdo-order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.12);
  border-color: #3b82f6;
}

.mcdo-order-card.can-progress {
  border-left: 4px solid #3b82f6;
}

/* Header de la commande */
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f1f5f9;
}

.order-number-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
}

.order-amount {
  font-weight: 800;
  font-size: 1.1rem;
  color: #059669;
  background: #ecfdf5;
  padding: 4px 12px;
  border-radius: 6px;
}

/* Items de la commande */
.order-items {
  padding: 12px 16px;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f8fafc;
}

.order-item:last-child {
  border-bottom: none;
}

.item-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.item-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: #374151;
}

.item-size {
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 2px;
}

.item-quantity {
  background: #f3f4f6;
  color: #374151;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85rem;
}

/* Footer de la commande */
.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px 16px;
  background: #f8fafc;
}

.order-time {
  display: flex;
  align-items: center;
  color: #6b7280;
  font-size: 0.85rem;
  font-weight: 500;
}

.action-btn {
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
  border-radius: 8px;
}

/* Indicateur de progression */
.progress-indicator {
  height: 3px;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}

.progress-indicator.ORDERED {
  background: linear-gradient(90deg, #ff6b35, #f7931e);
}

.progress-indicator.IN_PROGRESS {
  background: linear-gradient(90deg, #2196f3, #21cbf3);
  animation: progress-pulse 2s infinite;
}

.progress-indicator.COMPLETED {
  background: linear-gradient(90deg, #4caf50, #81c784);
}

@keyframes progress-pulse {
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
}

/* État vide */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  text-align: center;
  min-height: 300px;
}

.empty-text {
  color: #94a3b8;
  font-size: 1.1rem;
  font-weight: 500;
}

/* Modals */
.confirm-card, .details-card {
  border-radius: 16px !important;
}

.confirm-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #065f46;
}

.confirm-text {
  font-size: 1.1rem;
  color: #374151;
  line-height: 1.5;
}

.confirm-items {
  max-height: 120px;
  overflow-y: auto;
}

.details-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.details-summary {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
}

.detail-label {
  font-size: 0.85rem;
  color: #6b7280;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-top: 4px;
}

.detail-item {
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.detail-item:last-child {
  border-bottom: none;
}

.item-detail-name {
  font-weight: 600;
  color: #374151;
}

.item-detail-size {
  font-size: 0.85rem;
  color: #6b7280;
  margin-top: 2px;
}

.item-detail-qty {
  font-weight: 600;
  color: #6366f1;
  background: #eef2ff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
}

.item-detail-price {
  font-weight: 700;
  color: #059669;
  font-size: 0.95rem;
}

.total-label {
  font-size: 1.2rem;
  font-weight: 700;
  color: #374151;
}

.total-amount {
  font-size: 1.4rem;
  font-weight: 800;
  color: #059669;
}

/* Animations */
.order-list-move,
.order-list-enter-active,
.order-list-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.order-list-enter-from,
.order-list-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.order-list-leave-active {
  position: absolute;
  width: 100%;
}

/* Responsive */
@media (max-width: 1200px) {
  .status-columns-flex {
    flex-direction: column;
    height: auto;
  }

  .status-column-flex {
    min-width: 0;
    height: auto;
  }

  .status-card {
    min-height: 400px;
  }
}

@media (max-width: 768px) {
  .order-board {
    padding: 16px 8px;
  }

  .order-board-title {
    font-size: 1.8rem;
  }

  .status-columns-flex {
    gap: 16px;
  }

  .mcdo-order-card {
    margin-bottom: 12px;
  }

  .order-header {
    padding: 12px 12px 8px;
  }

  .order-items {
    padding: 8px 12px;
  }

  .order-footer {
    padding: 8px 12px 12px;
  }
}

/* Fullscreen */
.order-board.fullscreen {
  height: 100vh !important;
  max-width: 100vw !important;
  padding: 16px 8px !important;
  margin: 0 !important;
}

.order-board.fullscreen .status-columns-flex {
  height: calc(100vh - 120px);
}

body.hide-sidebar .sidebar,
body.hide-sidebar .topbar,
body.hide-sidebar nav,
body.hide-sidebar header {
  display: none !important;
}

/* États hover avancés */
.mcdo-order-card.can-progress:hover .action-btn {
  transform: scale(1.05);
}

.mcdo-order-card:hover .progress-indicator {
  height: 4px;
}

/* Animations supplémentaires */
@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}

.mcdo-order-card.can-progress::before {
  content: '';
  position: absolute;
  top: 0;
  left: -200px;
  width: 200px;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(59, 130, 246, 0.1),
    transparent
  );
  animation: shimmer 3s infinite;
}

/* Styles pour les notifications toast */
.toast-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.toast-error {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}
body.hide-sidebar .v-navigation-drawer,
body.hide-sidebar .v-app-bar,
body.hide-sidebar .v-toolbar,
body.hide-sidebar .sidebar,
body.hide-sidebar nav,
body.hide-sidebar header,
.v-application.hide-sidebar .v-navigation-drawer,
.v-application.hide-sidebar .v-app-bar,
.v-application.hide-sidebar .v-toolbar,
.v-application.hide-sidebar .sidebar,
.v-application.hide-sidebar nav,
.v-application.hide-sidebar header {
  display: none !important;
}
</style>
