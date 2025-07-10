<template>
  <v-container class="order-board">
    <h1 class="order-board-title mb-8">Gestion des commandes</h1>
    <v-row class="status-columns" dense>
      <v-col
        v-for="status in STATUSES"
        :key="status.key"
        cols="12"
        sm="4"
        class="status-column"
      >
        <v-card class="status-card" :class="status.key" elevation="5">
          <div class="status-header">
            <v-icon :class="['status-icon', status.key, { pulse: status.pulse }]" size="38">
              {{ status.icon }}
            </v-icon>
            <span class="status-title">{{ status.label }}</span>
          </div>
          <v-divider class="mb-2"></v-divider>
          <transition-group name="order-list" tag="div" class="order-list">
            <v-card
              v-for="order in status.orders"
              :key="order.id"
              class="order-card"
              elevation="2"
              @click="selectOrder(order, status)"
            >
              <v-card-title>
                <span class="order-number">#{{ order.id }}</span>
                <span class="order-amount">{{ formatPrice(order.totalAmount) }}</span>
              </v-card-title>
              <v-card-text class="order-items-preview">
                <v-chip
                  v-for="item in order.orderLines"
                  :key="item.id"
                  class="mr-1 mb-1"
                  variant="outlined"
                  size="small"
                  color="primary"
                >
                  {{ item.cocktail?.name }} x{{ item.quantity }}
                </v-chip>
              </v-card-text>
              <v-card-subtitle class="order-date">{{ formatDate(order.createdAt) }}</v-card-subtitle>
            </v-card>
          </transition-group>
        </v-card>
      </v-col>
    </v-row>

    <!-- Drawer pour changer statut -->
    <v-dialog v-model="drawer" width="420" persistent>
      <v-card>
        <v-card-title>
          <v-icon color="primary" class="mr-2">mdi-clipboard-list-outline</v-icon>
          <span>Détail de la commande #{{ selectedOrder?.id }}</span>
          <v-spacer />
          <v-btn icon @click="drawer = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="6"><strong>Date :</strong> {{ formatDate(selectedOrder?.createdAt) }}</v-col>
            <v-col cols="6" class="text-right">
              <v-chip :color="getStatusColor(selectedOrder?.status)">
                {{ getStatusLabel(selectedOrder?.status) }}
              </v-chip>
            </v-col>
          </v-row>
          <v-divider class="my-2" />
          <h4 class="mb-2">Articles</h4>
          <div v-for="item in selectedOrder?.orderLines || []" :key="item.id" class="order-item-detail mb-2">
            <v-row align="center">
              <v-col cols="1" class="py-0">
                <v-icon color="primary">mdi-glass-cocktail</v-icon>
              </v-col>
              <v-col cols="8" class="py-0">
                <div>{{ item.cocktail?.name }} <span class="text-grey text-caption">(x{{ item.quantity }})</span></div>
                <div class="text-caption text-grey">Taille: {{ item.cocktailSize?.size }}</div>
              </v-col>
              <v-col cols="3" class="py-0 text-right">
                <span>{{ formatPrice(item.totalSum) }}</span>
              </v-col>
            </v-row>
          </div>
          <v-divider class="my-2" />
          <div class="text-right">
            <strong>Total :</strong> {{ formatPrice(selectedOrder?.totalAmount) }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn v-if="selectedOrder && canProgressStatus(selectedOrder.status)" color="success" @click="progressStatus(selectedOrder)">
            <v-icon left>mdi-arrow-right-bold</v-icon>
            {{ getNextStatusLabel(selectedOrder.status) }}
          </v-btn>
          <v-btn text color="grey" @click="drawer = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
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

// --- Statuts configurables
const STATUSES = [
  {
    key: 'ORDERED',
    label: 'Commandées',
    icon: 'mdi-cart-arrow-down',
    color: 'amber',
    pulse: true,
    apiStatus: 'ORDERED',
    orders: ref<Order[]>([])
  },
  {
    key: 'IN_PROGRESS',
    label: 'En préparation',
    icon: 'mdi-chef-hat',
    color: 'blue',
    pulse: true,
    apiStatus: 'IN_PROGRESS',
    orders: ref<Order[]>([])
  },
  {
    key: 'COMPLETED',
    label: 'Terminées',
    icon: 'mdi-check-circle',
    color: 'green',
    pulse: false,
    apiStatus: 'COMPLETED',
    orders: ref<Order[]>([])
  }
]

// --- Etat drawer & sélection
const drawer = ref(false)
const selectedOrder = ref<Order | null>(null)
const selectedStatus = ref<typeof STATUSES[0] | null>(null)

// --- Intervalles refresh pour chaque status
const refreshIntervals: any[] = []

function fetchOrdersForStatus(statusKey: string, ordersRef: any) {
  api.get(`/api/orders/status/${statusKey}`)
    .then(res => { ordersRef.value = res.data })
    .catch(() => { ordersRef.value = [] })
}

// --- Refresh toutes les 3s chaque colonne, sans perdre les icônes
function setupFetchers() {
  STATUSES.forEach(status => {
    fetchOrdersForStatus(status.apiStatus, status.orders)
    const interval = setInterval(() => {
      fetchOrdersForStatus(status.apiStatus, status.orders)
    }, 3000)
    refreshIntervals.push(interval)
  })
}
function cleanupFetchers() {
  refreshIntervals.forEach(clearInterval)
}

// --- Affichage status/format UX
function getStatusLabel(status?: string) {
  const map: Record<string, string> = {
    'ORDERED': 'Commandée',
    'IN_PROGRESS': 'En préparation',
    'COMPLETED': 'Terminée'
  }
  return map[status ?? ''] ?? status
}
function getNextStatus(status?: string): string | null {
  if (status === 'ORDERED') return 'IN_PROGRESS'
  if (status === 'IN_PROGRESS') return 'COMPLETED'
  return null
}
function getNextStatusLabel(status?: string): string | null {
  const map: Record<string, string> = {
    'ORDERED': 'Passer en préparation',
    'IN_PROGRESS': 'Marquer comme terminée'
  }
  return map[status ?? ''] ?? null
}
function canProgressStatus(status?: string) {
  return getNextStatus(status) !== null
}
function getStatusColor(status?: string) {
  const map: Record<string, string> = {
    'ORDERED': 'amber',
    'IN_PROGRESS': 'blue',
    'COMPLETED': 'green'
  }
  return map[status ?? ''] ?? 'grey'
}
function formatDate(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}
function formatPrice(amount: number | undefined) {
  return amount === undefined
    ? ''
    : `${amount.toFixed(2)} €`
}

// --- Sélection commande (ouvre drawer)
function selectOrder(order: Order, statusObj: typeof STATUSES[0]) {
  selectedOrder.value = order
  selectedStatus.value = statusObj
  drawer.value = true
}

// --- Son Apple Pay-style (mini mp3 embedded)
function playSuccessSound() {
  const audio = new Audio(
    'https://cdn.jsdelivr.net/gh/bastify/public@main/applepay.mp3'
  )
  audio.volume = 0.2
  audio.play()
}

// --- Action progression statut
async function progressStatus(order: Order) {
  const nextStatus = getNextStatus(order.status)
  if (!nextStatus) return

  try {
    // PATCH (en fonction du statut courant)
    let endpoint = ''
    if (nextStatus === 'IN_PROGRESS')
      endpoint = `/api/orders/${order.id}/start`
    else if (nextStatus === 'COMPLETED')
      endpoint = `/api/orders/${order.id}/complete`
    else return

    await api.patch(endpoint)
    // Refresh juste la colonne d'origine & cible
    STATUSES.forEach(status => {
      if ([order.status, nextStatus].includes(status.apiStatus)) {
        fetchOrdersForStatus(status.apiStatus, status.orders)
      }
    })

    // Notif + son
    toast('Statut mis à jour !', { position: 'top-center', autoClose: 1800, theme: 'colored', hideProgressBar: false })
    playSuccessSound()

    drawer.value = false
  } catch (err) {
    toast.error('Erreur lors du changement de statut', { position: 'top-center' })
  }
}

// --- Life cycle
onMounted(setupFetchers)
onUnmounted(cleanupFetchers)
</script>
<style scoped>
.order-board {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 8px 24px;
}
.order-board-title {
  font-size: 2.2rem;
  font-weight: 700;
  text-align: center;
  color: #24292f;
  letter-spacing: 2px;
}

.status-columns {
  gap: 12px;
}

.status-card {
  min-height: 540px;
  border-radius: 22px;
  padding: 10px 0 18px;
  box-shadow: 0 2px 24px 0 rgba(25, 118, 210, 0.08);
  background: linear-gradient(120deg, #f5faff 0%, #f6f7fb 100%);
  display: flex;
  flex-direction: column;
}
.status-card.ORDERED {
  border-top: 5px solid #fbc02d;
}
.status-card.IN_PROGRESS {
  border-top: 5px solid #1e88e5;
}
.status-card.COMPLETED {
  border-top: 5px solid #43a047;
  opacity: 0.94;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 18px 0 18px;
}
.status-title {
  font-weight: 600;
  font-size: 1.25rem;
  letter-spacing: 1.1px;
  color: #323e4d;
}

.status-icon {
  background: #fff;
  border-radius: 50%;
  padding: 8px;
  font-size: 2.2rem !important;
  box-shadow: 0 2px 16px 0 rgba(25, 118, 210, 0.08);
}
.status-icon.ORDERED {
  color: #fbc02d;
}
.status-icon.IN_PROGRESS {
  color: #1e88e5;
}
.status-icon.COMPLETED {
  color: #43a047;
}
.pulse {
  animation: pulse-glow 1.7s infinite;
}
@keyframes pulse-glow {
  0% { box-shadow: 0 0 0 0 #42a5f566; }
  70% { box-shadow: 0 0 0 15px #42a5f500; }
  100% { box-shadow: 0 0 0 0 #42a5f500; }
}

.order-list {
  padding: 12px 18px 0 18px;
  flex: 1;
}

.order-card {
  margin-bottom: 12px;
  border-radius: 16px;
  transition: transform 0.13s, box-shadow 0.13s, border 0.13s;
  cursor: pointer;
  background: #fff;
  box-shadow: 0 2px 10px 0 rgba(25, 118, 210, 0.08);
  border: 2px solid #e3ecf7;
  overflow: hidden;
}
.order-card:hover {
  transform: translateY(-2px) scale(1.025);
  border-color: #1976d2;
  box-shadow: 0 4px 20px 0 rgba(25, 118, 210, 0.12);
}

.order-card .order-number {
  font-weight: 700;
  color: #24292f;
  font-size: 1.1rem;
  letter-spacing: 0.7px;
}
.order-card .order-amount {
  float: right;
  font-weight: 600;
  color: #1976d2;
}
.order-card .order-date {
  font-size: 0.85rem;
  color: #8e99af;
  text-align: right;
}

.order-items-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 8px;
  padding: 0 0 2px 0;
}
.order-item-detail {
  font-size: 1.01rem;
}

/* Drawer / Dialog */
.v-dialog .v-card {
  border-radius: 20px !important;
  min-width: 340px;
}
.v-dialog .order-item-detail {
  font-size: 0.97rem;
}
.v-dialog .v-chip {
  font-size: 0.97rem;
}

.v-btn[disabled] {
  opacity: 0.5;
}

@media (max-width: 900px) {
  .status-card {
    min-height: 360px;
    padding: 7px 0 14px;
  }
}
@media (max-width: 600px) {
  .status-columns {
    flex-direction: column !important;
    gap: 16px;
  }
  .status-card {
    min-height: 180px;
    padding: 3px 0 10px;
  }
  .order-board-title {
    font-size: 1.3rem;
  }
}

.order-list-move,
.order-list-enter-active,
.order-list-leave-active {
  transition: all 0.29s cubic-bezier(.47,1.64,.41,.8);
}
.order-list-enter-from,
.order-list-leave-to {
  opacity: 0;
  transform: translateY(14px) scale(0.96);
}
.order-list-leave-active {
  position: absolute;
}
</style>
