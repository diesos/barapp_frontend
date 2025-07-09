<template>
  <div class="order-root">
    <div class="order-container">
      <div v-if="loading" class="loading-section">
        <v-progress-circular indeterminate size="60" color="primary" />
        <div class="mt-4 font-bold text-primary">Votre commande est en préparation...</div>
      </div>
      <div v-else>
        <div class="order-status" :class="statusClass">
          <v-icon :color="statusColor" class="mr-2" size="24">{{ statusIcon }}</v-icon>
          <span class="font-bold text-lg">{{ statusLabel }}</span>
        </div>
        <div class="order-recap-title">Récapitulatif</div>
        <div class="order-lines">
          <div
            v-for="line in order?.orderLines || []"
            :key="line.id"
            class="order-line"
          >
            <v-avatar size="38" rounded class="mr-2">
              <img v-if="line.cocktail.imageUrl" :src="line.cocktail.imageUrl" :alt="line.cocktail.name" />
              <v-icon v-else color="grey">mdi-glass-cocktail</v-icon>
            </v-avatar>
            <div class="order-line-info">
              <div>
                <span class="font-bold">{{ line.cocktail.name }}</span>
                <span class="order-size">({{ line.cocktailSize.size }})</span>
                <span class="order-qty">×{{ line.quantity }}</span>
              </div>
              <div class="order-line-price">
                {{ ((line.unitPrice * line.quantity) / 100).toFixed(2) }} €
              </div>
            </div>
          </div>
        </div>
        <div class="order-total mt-3">
          Total : <span class="text-primary font-bold">{{ (orderTotal / 100).toFixed(2) }} €</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/utils/axios'

const route = useRoute()
const loading = ref(true)
const order = ref<any>(null)

onMounted(async () => {
  try {
    const { data } = await api.get(`/api/orders/${route.params.id}`)
    order.value = data
  } finally {
    loading.value = false
  }
})

const orderTotal = computed(() =>
  order.value?.orderLines?.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0) ?? 0
)

const statusLabel = computed(() => {
  switch (order.value?.status) {
    case 'ORDERED': return 'Commandée'
    case 'IN_PROGRESS': return 'En cours de préparation'
    case 'COMPLETED': return 'Terminée'
    default: return 'Inconnue'
  }
})
const statusIcon = computed(() => {
  switch (order.value?.status) {
    case 'ORDERED': return 'mdi-clock-outline'
    case 'IN_PROGRESS': return 'mdi-fire'
    case 'COMPLETED': return 'mdi-check-circle-outline'
    default: return 'mdi-help-circle-outline'
  }
})
const statusColor = computed(() => {
  switch (order.value?.status) {
    case 'ORDERED': return 'primary'
    case 'IN_PROGRESS': return 'warning'
    case 'COMPLETED': return 'success'
    default: return 'grey'
  }
})
const statusClass = computed(() => ({
  'status-prep': order.value?.status === 'IN_PROGRESS',
  'status-ok': order.value?.status === 'COMPLETED',
}))
</script>

<style scoped>
.order-root {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 36px 8px 32px 8px;
}
.order-container {
  width: 100%;
  max-width: 440px;
  margin: auto;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 32px 0 rgba(0,0,0,0.06);
  padding: 28px 22px 18px 22px;
  animation: fadeInUp 0.5s;
}
.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
}
.order-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 1.17rem;
}
.order-recap-title {
  font-weight: bold;
  font-size: 1.08rem;
  margin-bottom: 8px;
  color: #9a3412;
  letter-spacing: 1px;
}
.order-lines {
  border-top: 1px dashed #eab308;
  border-bottom: 1px dashed #eab308;
  margin: 0 -12px 0 -12px;
  padding: 6px 0;
  max-height: 260px;
  overflow-y: auto;
}
.order-line {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 6px 0 6px 0;
  border-bottom: 1px solid #f3f4f6;
}
.order-line:last-child {
  border-bottom: none;
}
.order-line-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.order-size {
  font-size: 0.93em;
  color: #64748b;
  font-weight: 400;
}
.order-qty {
  margin-left: 4px;
  font-size: 0.95em;
  color: #6b7280;
}
.order-line-price {
  font-size: 1.1rem;
  color: #f59e0b;
  font-weight: 700;
  margin-top: 2px;
}
.order-total {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  font-size: 1.13rem;
  margin-top: 10px;
  gap: 8px;
}
.status-prep { color: #eab308; }
.status-ok { color: #22c55e; }
@media (max-width: 600px) {
  .order-container {
    max-width: 97vw;
    padding: 16px 3vw;
    border-radius: 16px;
  }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px);}
  to { opacity: 1; transform: translateY(0);}
}
</style>
