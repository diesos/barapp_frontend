<template>
  <div class="basket-root">
    <div class="basket-container" :class="{ 'success-mode': orderSuccess }">
      <div v-if="basketStore.isLoading" class="loading-section">
        <div class="pulse-loader">
          <div class="pulse-dot"></div>
          <div class="pulse-dot"></div>
          <div class="pulse-dot"></div>
        </div>
        <div class="loading-text">Chargement de votre panier...</div>
      </div>

      <div v-else-if="orderSuccess" class="success-section">
        <div class="success-icon">
          <svg viewBox="0 0 100 100" class="checkmark">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#22c55e" stroke-width="3" class="circle"/>
            <path d="M25 50 L42 67 L75 33" fill="none" stroke="#22c55e" stroke-width="4" stroke-linecap="round" class="check"/>
          </svg>
        </div>
        <h2 class="success-title">Commande passée !</h2>
        <p class="success-subtitle">Votre commande sera prête dans 10-15 minutes</p>
        <div class="success-order-number">#{{ orderNumber }}</div>
        <div class="success-confetti">
          <div class="confetti" v-for="n in 50" :key="n" :style="getConfettiStyle(n)"></div>
        </div>
      </div>

      <div v-else class="basket-content">
        <div class="basket-header">
          <h2 class="basket-title">Votre panier</h2>
          <div class="basket-items-count">{{ basketStore.cartCount }} article{{ basketStore.cartCount > 1 ? 's' : '' }}</div>
        </div>

        <div v-if="!basketStore.basketLines.length" class="empty-basket">
          <div class="empty-icon">
            <v-icon size="64" color="#9ca3af">mdi-shopping-outline</v-icon>
          </div>
          <h3 class="empty-title">Votre panier est vide</h3>
          <p class="empty-subtitle">Ajoutez des cocktails pour continuer</p>
        </div>

        <div v-else>
          <div class="basket-items">
            <div
              v-for="(line, index) in basketStore.basketLines"
              :key="line.id"
              class="basket-item"
              :style="{ animationDelay: `${index * 0.1}s` }"
            >
              <div class="item-image">
                <img
                  v-if="line.cocktail.imageUrl"
                  :src="line.cocktail.imageUrl"
                  :alt="line.cocktail.name"
                />
                <v-icon v-else color="grey" size="28">mdi-glass-cocktail</v-icon>
              </div>

              <div class="item-details">
                <div class="item-name">{{ line.cocktail.name }}</div>
                <div class="item-description">{{ (line.cocktail as any).description }}</div>
                <div class="item-meta">
                  <span class="item-size">Taille {{ line.cocktailSize.size }}</span>
                  <span v-if="(line.cocktail as any).isDiscount" class="discount-badge">
                    <v-icon size="14" color="white">mdi-tag</v-icon>
                    Promo
                  </span>
                </div>
              </div>

              <div class="item-actions">
                <div class="quantity-controls">
                  <button
                    class="qty-button"
                    @click="updateItemQuantity(line.cocktail.id, line.cocktailSize.id, line.quantity - 1)"
                    :disabled="line.quantity <= 1"
                  >
                    <v-icon size="18">mdi-minus</v-icon>
                  </button>
                  <span class="qty-display">{{ line.quantity }}</span>
                  <button
                    class="qty-button"
                    @click="updateItemQuantity(line.cocktail.id, line.cocktailSize.id, line.quantity + 1)"
                  >
                    <v-icon size="18">mdi-plus</v-icon>
                  </button>
                </div>

                <div class="item-price">
                  <div v-if="(line.cocktail as any).isDiscount" class="price-discount">
                    <span class="original-price">{{ ((line.cocktail as any).price / 100).toFixed(2) }} €</span>
                    <span class="discounted-price">{{ (line.unitPrice * line.quantity / 100).toFixed(2) }} €</span>
                  </div>
                  <div v-else class="price-normal">
                    {{ (line.unitPrice * line.quantity / 100).toFixed(2) }} €
                  </div>
                </div>

                <button
                  class="remove-button"
                  @click="removeBasketLine(line.cocktail.id, line.cocktailSize.id)"
                  title="Retirer du panier"
                >
                  <v-icon size="18" color="#ef4444">mdi-trash-can-outline</v-icon>
                </button>
              </div>
            </div>
          </div>

          <div class="basket-summary">
            <div class="summary-line">
              <span class="summary-label">Sous-total</span>
              <span class="summary-value">{{ (basketStore.cartTotal / 100).toFixed(2) }} €</span>
            </div>
            <div class="summary-line">
              <span class="summary-label">Frais de service</span>
              <span class="summary-value">Gratuit</span>
            </div>
            <div class="summary-total">
              <span class="total-label">Total</span>
              <span class="total-amount">{{ (basketStore.cartTotal / 100).toFixed(2) }} €</span>
            </div>
          </div>

          <div class="action-section">
            <button
              class="continue-shopping-button"
              @click="continueShopping"
            >
              <v-icon left size="20">mdi-arrow-left</v-icon>
              Continuer mes achats
            </button>

            <button
              class="order-button"
              :class="{ 'loading': isOrdering }"
              @click="confirmOrder"
              :disabled="isOrdering || !basketStore.basketLines.length"
            >
              <span v-if="!isOrdering" class="button-text">
                <v-icon left size="20">mdi-credit-card</v-icon>
                Passer commande
              </span>
              <span v-else class="button-loader">
                <div class="spinner"></div>
                Traitement...
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBasketStore } from '../../store/basket' // Adjust path as needed
import api from '../../utils/axios' // Keep api for order conversion for now if it's separate from basket store

const router = useRouter()
const basketStore = useBasketStore() // Initialize the store

const isOrdering = ref(false)
const orderSuccess = ref(false)
const orderNumber = ref('')

// The basket is now managed by the store, no need for local 'basket' ref or 'loadBasket' method

const updateItemQuantity = async (cocktailId: number, cocktailSizeId: number, newQuantity: number) => {
  if (newQuantity < 1) return
  await basketStore.updateQuantity(cocktailId, cocktailSizeId, newQuantity)
}

const removeBasketLine = async (cocktailId: number, cocktailSizeId: number) => {
  await basketStore.removeFromBasket(cocktailId, cocktailSizeId)
}

const continueShopping = () => {
  router.push('/menu')
}

const confirmOrder = async () => {
  // Use basketStore.basketLines for length check
  if (!basketStore.basketLines.length) return

  isOrdering.value = true

  try {
    // The convertToOrder action in your store handles the API call to convert the basket.
    // However, your component logic here also calls /api/orders.
    // If the store's convertToOrder handles the full conversion and redirects/updates,
    // you might not need this direct api.post('/api/orders').
    // For now, I'm assuming 'api.post('/api/orders')' is a distinct step for order creation
    // that happens *after* the basket is conceptually "converted" or finalized via the store.
    // If convertToOrder in your store should handle everything including creating the final order
    // and giving back an order ID, then modify the store action to return the order ID.

    // If convertToOrder in the store just archives the basket and you need a new API call for the order:
    const response = await api.post('/api/orders', {
      basketId: basketStore.basket?.id // Pass the basket ID from the store
    })
    // After successful order creation, you might want to clear the basket in the store
    // or let fetchBasket (which convertToOrder calls) update it to an empty state.
    basketStore.clearBasket() // Clear the basket after order is confirmed

    orderNumber.value = `CMD${Date.now().toString().slice(-6)}`
    orderSuccess.value = true

    setTimeout(() => {
      router.push(`/orders/`)
    }, 4000)

  } catch (error) {
    console.error('Erreur lors de la commande:', error)
    // Show error notification here
  } finally {
    isOrdering.value = false
  }
}

const getConfettiStyle = (n: number) => {
  const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
  return {
    '--delay': `${Math.random() * 3}s`,
    '--duration': `${2 + Math.random() * 2}s`,
    '--x': `${Math.random() * 100}%`,
    '--color': colors[n % colors.length],
    '--size': `${4 + Math.random() * 6}px`
  }
}
</script>

<style scoped>
/* Votre style CSS reste inchangé */
.basket-root {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.basket-container {
  width: 100%;
  max-width: 480px;
  background: white;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  overflow: hidden;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.basket-container.success-mode {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  transform: scale(1.02);
}

/* Loading States */
.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 40px;
}

.pulse-loader {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.pulse-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #6366f1;
  animation: pulse 1.4s ease-in-out infinite both;
}

.pulse-dot:nth-child(1) { animation-delay: -0.32s; }
.pulse-dot:nth-child(2) { animation-delay: -0.16s; }

.loading-text {
  color: #6b7280;
  font-size: 16px;
  font-weight: 500;
}

/* Success States */
.success-section {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 40px;
  position: relative;
  overflow: hidden;
}

.success-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 24px;
}

.checkmark {
  width: 100%;
  height: 100%;
}

.circle {
  stroke-dasharray: 283;
  stroke-dashoffset: 283;
  animation: circle-fill 0.8s ease-out 0.3s forwards;
}

.check {
  stroke-dasharray: 50;
  stroke-dashoffset: 50;
  animation: check-draw 0.6s ease-out 0.8s forwards;
}

.success-title {
  font-size: 24px;
  font-weight: 700;
  color: #16a34a;
  margin: 0 0 8px 0;
}

.success-subtitle {
  color: #6b7280;
  font-size: 16px;
  margin: 0 0 16px 0;
  text-align: center;
}

.success-order-number {
  background: #16a34a;
  color: white;
  padding: 8px 16px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.5px;
}

.success-confetti {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.confetti {
  position: absolute;
  width: var(--size);
  height: var(--size);
  background: var(--color);
  border-radius: 2px;
  left: var(--x);
  animation: confetti-fall var(--duration) var(--delay) ease-out;
}

/* Basket Content */
.basket-content {
  padding: 32px;
}

.basket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
}

.basket-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.basket-items-count {
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

/* Empty State */
.empty-basket {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  margin-bottom: 24px;
  opacity: 0.6;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.empty-subtitle {
  color: #64748b;
  font-size: 16px;
  margin: 0;
}

/* Basket Items */
.basket-items {
  margin-bottom: 32px;
}

.basket-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 0;
  border-bottom: 1px solid #f8fafc;
  animation: slide-in 0.6s ease-out backwards;
}

.basket-item:last-child {
  border-bottom: none;
}

.item-image {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-details {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.item-description {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 8px;
  line-height: 1.4;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #64748b;
}

.discount-badge {
  background: #ef4444;
  color: white;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 2px;
}

.item-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  border-radius: 12px;
  padding: 4px;
}

.qty-button {
  width: 32px;
  height: 32px;
  border: none;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.qty-button:hover:not(:disabled) {
  background: #6366f1;
  color: white;
}

.qty-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.qty-display {
  font-weight: 600;
  color: #1e293b;
  min-width: 24px;
  text-align: center;
}

.item-price {
  text-align: right;
}

.price-discount {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.original-price {
  font-size: 12px;
  color: #6b7280;
  text-decoration: line-through;
}

.discounted-price {
  font-size: 16px;
  font-weight: 700;
  color: #ef4444;
}

.price-normal {
  font-size: 16px;
  font-weight: 700;
  color: #059669;
}

.remove-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
}

.remove-button:hover {
  background: #fef2f2;
}

/* Summary */
.basket-summary {
  background: #f8fafc;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
}

.summary-line:last-of-type {
  margin-bottom: 16px;
}

.summary-label {
  color: #64748b;
}

.summary-value {
  color: #1e293b;
  font-weight: 500;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  font-size: 18px;
  font-weight: 700;
}

.total-label {
  color: #1e293b;
}

.total-amount {
  color: #059669;
}

/* Action Buttons */
.action-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.continue-shopping-button {
  width: 100%;
  height: 48px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.continue-shopping-button:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.order-button {
  width: 100%;
  height: 56px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 16px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.order-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(99, 102, 241, 0.4);
}

.order-button:active {
  transform: translateY(0);
}

.order-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
}

.button-text {
  display: flex;
  align-items: center;
  gap: 8px;
}

.button-loader {
  display: flex;
  align-items: center;
  gap: 12px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Animations */
@keyframes pulse {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes circle-fill {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes check-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes confetti-fall {
  0% {
    opacity: 1;
    transform: translateY(-100vh) rotateZ(0deg);
  }
  100% {
    opacity: 0;
    transform: translateY(100vh) rotateZ(360deg);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 480px) {
  .basket-root {
    padding: 16px;
  }

  .basket-content {
    padding: 24px;
  }

  .basket-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .basket-item {
    flex-direction: column;
    gap: 12px;
  }

  .item-actions {
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }

  .action-section {
    gap: 8px;
  }

  .continue-shopping-button {
    height: 44px;
  }

  .order-button {
    height: 52px;
  }
}
</style>
