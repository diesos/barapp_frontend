<template>
  <v-container class="cart-root fill-height" fluid>
    <v-row justify="center" align="start">
      <v-col cols="12" sm="8" md="6" lg="5" xl="4">
        <v-card class="pa-0 ticket-container" elevation="2" rounded="xl">
          <v-card-title class="ticket-title py-5 text-center">
            <span>Votre commande</span>
          </v-card-title>
          <v-divider />
          <v-card-text>
            <div v-if="basket && basket.basketLines.length > 0">
              <v-list class="pa-0 ticket-list" density="compact">
                <v-list-item
                  v-for="line in basket.basketLines"
                  :key="line.id"
                  class="ticket-line px-0"
                  min-height="60"
                >
                  <template #prepend>
                    <v-avatar size="44" variant="tonal">
                      <v-img
                        v-if="line.cocktail.imageUrl"
                        :src="line.cocktail.imageUrl"
                        :alt="line.cocktail.name"
                        aspect-ratio="1"
                        cover
                        class="ticket-img"
                      />
                      <v-icon v-else color="grey">mdi-glass-cocktail</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="ticket-item-title">
                    <div class="d-flex align-center gap-2">
                      <span class="font-weight-bold text-truncate">{{ line.cocktail.name }}</span>
                      <v-chip class="ms-1" color="grey-lighten-3" size="x-small" variant="flat">
                        {{ line.cocktailSize.size }}
                      </v-chip>
                    </div>
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    <div class="d-flex align-center gap-2">
                      <span>x{{ line.quantity }}</span>
                      <span class="text-grey">@{{ (line.unitPrice / 100).toFixed(2) }} €</span>
                    </div>
                  </v-list-item-subtitle>
                  <div class="ml-auto text-right">
                    <span class="font-weight-bold text-primary">
                      {{ ((line.unitPrice * line.quantity) / 100).toFixed(2) }} €
                    </span>
                  </div>
                </v-list-item>
              </v-list>
              <v-divider class="my-3"/>
              <div class="d-flex align-center justify-space-between ticket-total mb-2">
                <div class="font-weight-bold">Total</div>
                <div class="font-weight-bold text-primary text-lg">
                  {{ (cartTotal / 100).toFixed(2) }} €
                </div>
              </div>
              <v-btn
                color="primary"
                size="large"
                block
                rounded="xl"
                class="font-bold mt-2"
                :loading="isLoading"
                :disabled="isLoading"
                @click="orderNow"
              >
                <v-icon start>mdi-send</v-icon>
                Commander
              </v-btn>
            </div>
            <div v-else class="empty-cart py-16 text-center">
              <v-icon color="grey" size="56">mdi-cart-off</v-icon>
              <div class="mt-2">Votre panier est vide</div>
              <v-btn color="primary" variant="text" @click="$router.push('/menu')" class="mt-2">
                Voir la carte
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useBasketStore } from '../../store/basket'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue3-toastify'

const router = useRouter()
const basketStore = useBasketStore()
const isLoading = ref(false)

const basket = computed(() => basketStore.basket)
const cartTotal = computed(() => basketStore.cartTotal)

async function orderNow() {
  if (!basket.value || basket.value.basketLines.length === 0) return
  isLoading.value = true
  try {
    const res = await basketStore.convertToOrder()
    router.push('/orders?pending=1')
    toast.success('Commande envoyée !', { autoClose: 2000 })
  } catch (e) {
    toast.error('Erreur lors de la commande')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.cart-root {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding-top: 36px;
  padding-bottom: 32px;
}
.ticket-container {
  border-radius: 22px;
  border: 1.5px dashed #f59e0b;
  box-shadow: 0 4px 32px 0 rgba(0,0,0,0.08);
  background: white;
}
.ticket-title {
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  background: linear-gradient(90deg, #f59e0b 60%, #eab308 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.ticket-list {
  background: none;
  max-height: 295px;
  overflow-y: auto;
  border-radius: 0;
}
.ticket-line {
  border-bottom: 1px solid #f3f4f6;
  min-height: 60px !important;
}
.ticket-line:last-child {
  border-bottom: none;
}
.ticket-img {
  border-radius: 50%;
  min-width: 44px;
  min-height: 44px;
  background: #f8fafc;
}
.ticket-item-title {
  max-width: 180px;
  font-size: 1.04rem;
}
.ticket-total {
  font-size: 1.13rem;
  letter-spacing: 0.01em;
}
.empty-cart {
  color: #64748b;
}
@media (max-width: 700px) {
  .ticket-container {
    max-width: 98vw;
    padding-left: 4vw;
    padding-right: 4vw;
    border-radius: 13px;
  }
  .ticket-title {
    font-size: 1.12rem;
  }
}
</style>
