<template>
  <v-card
    class="cocktail-card"
    elevation="0"
    :class="{ 'card-hover': !$vuetify.display.mobile, 'card-disabled': disabled }"
    @click="!$vuetify.display.mobile && !disabled && showDetails()"
  >
    <!-- Image Container -->
    <div class="image-container">
      <div
        class="cocktail-image"
        :style="{ background: !cocktail.imageUrl ? getCategoryGradient(cocktail.category) : 'transparent' }"
      >
        <!-- Image réelle du cocktail si disponible -->
        <img
          v-if="cocktail.imageUrl"
          :src="cocktail.imageUrl"
          :alt="cocktail.name"
          class="cocktail-real-image"
          @error="handleImageError"
        />

        <!-- Icône de fallback -->
        <v-icon
          v-else
          :icon="getCategoryIcon(cocktail.category)"
          size="80"
          color="white"
          class="cocktail-icon"
        />

        <!-- Category Badge -->
        <v-chip
          class="category-chip"
          :color="getCategoryColor(cocktail.category)"
          size="small"
          label
        >
          {{ cocktail.category }}
        </v-chip>

        <!-- Favorite Button -->
        <v-btn
          icon
          size="small"
          class="favorite-btn"
          @click.stop="toggleFavorite"
          :disabled="disabled"
        >
          <v-icon
            :color="isFavorite ? 'red' : 'white'"
            :icon="isFavorite ? 'mdi-heart' : 'mdi-heart-outline'"
          />
        </v-btn>

        <!-- Discount Badge -->
        <v-chip
          v-if="cocktail.isDiscount"
          class="discount-chip"
          color="red"
          size="small"
          label
        >
          <v-icon start size="16">mdi-percent</v-icon>
          PROMO
        </v-chip>
      </div>
    </div>

    <!-- Content -->
    <v-card-text class="card-content">
      <div class="cocktail-header">
        <h3 class="cocktail-name">{{ cocktail.name }}</h3>
        <div class="availability-indicator">
          <v-chip
            :color="cocktail.isAvailable ? 'green' : 'red'"
            size="x-small"
            class="availability-chip"
          >
            {{ cocktail.isAvailable ? 'Disponible' : 'Indisponible' }}
          </v-chip>
        </div>
      </div>

      <!-- Description -->
      <p class="cocktail-description">
        {{ cocktail.description }}
      </p>

      <!-- Size Selection avec prix -->
      <div class="size-selection">
        <div class="size-header">
          <v-icon size="16" color="primary">mdi-resize</v-icon>
          <span class="size-title">Taille & Prix</span>
        </div>
        <div class="size-chips-container">
          <v-chip-group
            v-model="selectedSizeIndex"
            mandatory
            class="size-chips"
          >
            <v-chip
              v-for="(size, index) in cocktail.sizes"
              :key="size.name"
              :value="index"
              size="small"
              :color="selectedSizeIndex === index ? 'primary' : 'default'"
              :variant="selectedSizeIndex === index ? 'elevated' : 'outlined'"
              class="size-chip"
              :disabled="disabled"
            >
              <div class="size-chip-content">
                <span class="size-name">{{ size.name }}</span>
                <span class="size-price">{{ size.price.toFixed(2) }}€</span>
              </div>
            </v-chip>
          </v-chip-group>
        </div>
      </div>

      <!-- Prix actuel en grand -->
      <div class="current-price-section">
        <div class="price-display">
          <span class="current-price">{{ getTotalPrice.toFixed(2) }}€</span>
          <span class="size-indicator">{{ getCurrentSize.name }} × {{ quantity }}</span>
        </div>
      </div>

      <!-- Ingredients -->
      <div v-if="cocktail.ingredients && cocktail.ingredients.length > 0" class="ingredients-section">
        <div class="ingredients-header">
          <v-icon size="16" color="primary">mdi-bottle-tonic</v-icon>
          <span class="ingredients-title">Ingrédients</span>
        </div>
        <div class="ingredients-list">
          <v-chip
            v-for="ingredient in cocktail.ingredients"
            :key="ingredient"
            size="x-small"
            variant="outlined"
            class="ingredient-chip"
          >
            {{ ingredient }}
          </v-chip>
        </div>
      </div>

      <!-- Quantity Controls -->
      <div class="quantity-controls">
        <div class="quantity-section">
          <span class="quantity-label">Quantité</span>
          <div class="quantity-input-group">
            <v-btn
              icon
              size="small"
              variant="outlined"
              color="primary"
              @click="decreaseQuantity"
              :disabled="quantity <= 1 || disabled"
              class="quantity-btn"
            >
              <v-icon size="16">mdi-minus</v-icon>
            </v-btn>

            <v-text-field
              v-model.number="quantity"
              type="number"
              min="1"
              max="99"
              hide-details
              single-line
              density="compact"
              class="quantity-input"
              :disabled="disabled"
              @blur="validateQuantity"
            />

            <v-btn
              icon
              size="small"
              variant="outlined"
              color="primary"
              @click="increaseQuantity"
              :disabled="quantity >= 99 || disabled"
              class="quantity-btn"
            >
              <v-icon size="16">mdi-plus</v-icon>
            </v-btn>
          </div>
        </div>

        <!-- Add to Cart Button -->
        <v-btn
          color="primary"
          variant="elevated"
          class="add-to-cart-btn"
          @click="addToCart"
          :loading="isAddingToCart"
          :disabled="disabled || !cocktail.isAvailable"
        >
          <v-icon start>mdi-cart-plus</v-icon>
          Ajouter - {{ getTotalPrice.toFixed(2) }}€
        </v-btn>
      </div>
    </v-card-text>

    <!-- Mobile Actions -->
    <v-card-actions v-if="$vuetify.display.mobile" class="mobile-actions">
      <v-btn
        variant="text"
        color="primary"
        @click="showDetails"
        :disabled="disabled"
      >
        <v-icon start>mdi-information-outline</v-icon>
        Détails
      </v-btn>
      <v-spacer />
      <v-btn
        color="primary"
        variant="elevated"
        @click="addToCart"
        :loading="isAddingToCart"
        :disabled="disabled || !cocktail.isAvailable"
      >
        <v-icon start>mdi-cart-plus</v-icon>
        {{ getTotalPrice.toFixed(2) }}€
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Props
const props = defineProps({
  cocktail: {
    type: Object,
    required: true,
    validator: (value) => {
      return value.name && value.category && value.sizes
    }
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['add-to-cart', 'toggle-favorite', 'show-details'])

// Reactive data
const selectedSizeIndex = ref(0)
const quantity = ref(1)
const isAddingToCart = ref(false)
const isFavorite = ref(false)
const imageError = ref(false)

// Computed properties
const getCurrentSize = computed(() => {
  return props.cocktail.sizes[selectedSizeIndex.value] || props.cocktail.sizes[0]
})

const getCurrentPrice = computed(() => {
  const size = getCurrentSize.value
  return size ? size.price : 0
})

const getTotalPrice = computed(() => {
  return getCurrentPrice.value * quantity.value
})

// Methods utilitaires
const getCategoryGradient = (category) => {
  const gradients = {
    'Base Rhum': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    'Base Whisky': 'linear-gradient(135deg, #92400e 0%, #78350f 100%)',
    'Base Vodka': 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    'Base Gin': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    'Sans Alcool': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    'Tropical': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    'Classique': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    'Signature': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    'Digestif': 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    'Apéritif': 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    'default': 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
  }
  return gradients[category] || gradients.default
}

const getCategoryIcon = (category) => {
  const icons = {
    'Base Rhum': 'mdi-glass-cocktail',
    'Base Whisky': 'mdi-glass-wine',
    'Base Vodka': 'mdi-glass-flute',
    'Base Gin': 'mdi-leaf',
    'Sans Alcool': 'mdi-water',
    'Tropical': 'mdi-palm-tree',
    'Classique': 'mdi-diamond-stone',
    'Signature': 'mdi-star',
    'Digestif': 'mdi-glass-wine',
    'Apéritif': 'mdi-glass-flute',
    'default': 'mdi-glass-cocktail'
  }
  return icons[category] || icons.default
}

const getCategoryColor = (category) => {
  const colors = {
    'Base Rhum': 'amber',
    'Base Whisky': 'brown',
    'Base Vodka': 'cyan',
    'Base Gin': 'green',
    'Sans Alcool': 'purple',
    'Tropical': 'green',
    'Classique': 'amber',
    'Signature': 'purple',
    'Digestif': 'red',
    'Apéritif': 'pink',
    'default': 'grey'
  }
  return colors[category] || colors.default
}

// Image error handler
const handleImageError = () => {
  imageError.value = true
}

// Quantity logic
const increaseQuantity = () => {
  if (quantity.value < 99) quantity.value++
}

const decreaseQuantity = () => {
  if (quantity.value > 1) quantity.value--
}

const validateQuantity = () => {
  if (quantity.value < 1) quantity.value = 1
  if (quantity.value > 99) quantity.value = 99
  if (isNaN(quantity.value)) quantity.value = 1
}

// Action handlers
const addToCart = async () => {
  if (props.disabled || !props.cocktail.isAvailable) return

  isAddingToCart.value = true
  try {
    const cartItem = {
      cocktail: props.cocktail,
      size: getCurrentSize.value,
      quantity: quantity.value,
      totalPrice: getTotalPrice.value
    }
    await new Promise(resolve => setTimeout(resolve, 500)) // simulate API
    emit('add-to-cart', cartItem)
    quantity.value = 1
  } catch (error) {
    console.error('Error adding to cart:', error)
  } finally {
    isAddingToCart.value = false
  }
}

const toggleFavorite = () => {
  if (props.disabled) return

  isFavorite.value = !isFavorite.value
  emit('toggle-favorite', {
    cocktail: props.cocktail,
    isFavorite: isFavorite.value
  })
}

const showDetails = () => {
  if (props.disabled) return
  emit('show-details', props.cocktail)
}

// Reset quantity when size changes
watch(selectedSizeIndex, () => {
  quantity.value = 1
})
</script>

<style scoped>
/* Variables */
:root {
  --card-radius: 20px;
  --shadow-light: 0 4px 20px rgba(0, 0, 0, 0.08);
  --shadow-hover: 0 8px 30px rgba(0, 0, 0, 0.12);
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Card Base */
.cocktail-card {
  border-radius: var(--card-radius);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: var(--shadow-light);
  overflow: hidden;
  transition: var(--transition);
  cursor: pointer;
  max-width: 400px;
  margin: 0 auto;
}

.card-hover:hover:not(.card-disabled) {
  transform: translateY(-8px);
  box-shadow: var(--shadow-hover);
}

.card-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Image Container */
.image-container {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.cocktail-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: var(--transition);
}

.cocktail-real-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: var(--transition);
}

.cocktail-card:hover .cocktail-real-image {
  transform: scale(1.05);
}

.cocktail-icon {
  opacity: 0.9;
  transition: var(--transition);
}

.cocktail-card:hover .cocktail-icon {
  transform: scale(1.1);
  opacity: 1;
}

/* Category Chip */
.category-chip {
  position: absolute;
  top: 12px;
  left: 12px;
  font-weight: 600;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  z-index: 2;
}

/* Favorite Button */
.favorite-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  z-index: 2;
}

.favorite-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

/* Discount Badge */
.discount-chip {
  position: absolute;
  top: 12px;
  right: 60px;
  font-weight: 600;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  z-index: 2;
}

/* Card Content */
.card-content {
  padding: 20px;
}

.cocktail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.cocktail-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  line-height: 1.3;
  flex: 1;
}

.availability-indicator {
  margin-left: 10px;
}

.availability-chip {
  font-size: 0.75rem;
  font-weight: 600;
}

/* Description */
.cocktail-description {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Size Selection */
.size-selection {
  margin-bottom: 16px;
}

.size-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.size-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.size-chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.size-chips {
  gap: 8px;
  flex-wrap: wrap;
}

.size-chip {
  min-width: 80px;
  height: 48px;
  border-radius: 12px;
}

.size-chip-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.size-name {
  font-weight: 600;
  font-size: 0.875rem;
}

.size-price {
  font-size: 0.75rem;
  font-weight: 500;
  opacity: 0.8;
}

/* Current Price */
.current-price-section {
  margin-bottom: 16px;
  text-align: center;
}

.price-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.current-price {
  font-size: 1.75rem;
  font-weight: 800;
  color: #f59e0b;
  line-height: 1;
}

.size-indicator {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

/* Ingredients */
.ingredients-section {
  margin-bottom: 20px;
}

.ingredients-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.ingredients-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.ingredients-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ingredient-chip {
  font-size: 0.75rem;
  height: 24px;
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
  color: #92400e;
}

/* Quantity Controls */
.quantity-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.quantity-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quantity-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.quantity-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quantity-btn {
  border-radius: 8px;
  border: 2px solid #f59e0b;
}

.quantity-input {
  width: 60px;
}

.quantity-input :deep(.v-field__input) {
  text-align: center;
  font-weight: 600;
  padding: 0;
}

.add-to-cart-btn {
  border-radius: 12px;
  font-weight: 600;
  text-transform: none;
  padding: 0 20px;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.add-to-cart-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
}

/* Mobile Actions */
.mobile-actions {
  padding: 16px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(248, 250, 252, 0.5);
}

/* Desktop Layout */
@media (min-width: 769px) {
  .cocktail-card {
    max-width: none;
    width: 100%;
  }

  .mobile-actions {
    display: none;
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .cocktail-card {
    max-width: none;
  }

  .image-container {
    height: 160px;
  }

  .cocktail-icon {
    font-size: 60px;
  }

  .card-content {
    padding: 16px;
  }

  .cocktail-name {
    font-size: 1.1rem;
  }

  .current-price {
    font-size: 1.5rem;
  }

  .quantity-controls {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .quantity-section {
    align-items: center;
  }

  .quantity-input-group {
    justify-content: center;
  }

  .add-to-cart-btn {
    width: 100%;
  }

  .size-chips-container {
    justify-content: center;
  }
}

/* Tablet Responsive */
@media (max-width: 1024px) and (min-width: 769px) {
  .cocktail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .availability-indicator {
    margin-left: 0;
  }

  .quantity-controls {
    flex-direction: column;
    gap: 12px;
  }

  .add-to-cart-btn {
    width: 100%;
  }
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.cocktail-card {
  animation: fadeInUp 0.5s ease-out;
}

/* Loading state */
.add-to-cart-btn.v-btn--loading {
  pointer-events: none;
}

/* Focus states */
.quantity-input :deep(.v-field--focused) {
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
}

.quantity-btn:focus-visible {
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
}

/* Disabled states */
.card-disabled .cocktail-image {
  filter: grayscale(50%);
}

.card-disabled .add-to-cart-btn {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Size chips disabled state */
.size-chip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Promo styles */
.discount-chip {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
</style>
