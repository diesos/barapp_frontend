<template>
  <v-card
    class="cocktail-card"
    elevation="0"
    :class="{ 'card-hover': !$vuetify.display.mobile }"
    @click="!$vuetify.display.mobile && showDetails()"
  >
    <!-- Image Container -->
    <div class="image-container">
      <div
        class="cocktail-image"
        :style="{ background: getCategoryGradient(cocktail.category) }"
      >
        <v-icon
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
        >
          <v-icon
            :color="isFavorite ? 'red' : 'white'"
            :icon="isFavorite ? 'mdi-heart' : 'mdi-heart-outline'"
          />
        </v-btn>

        <!-- Size Selector -->
        <div class="size-selector">
          <v-chip-group
            v-model="selectedSize"
            mandatory
            class="size-chips"
          >
            <v-chip
              v-for="size in cocktail.sizes"
              :key="size.name"
              :value="size.name"
              size="small"
              :color="selectedSize === size.name ? 'primary' : 'white'"
              class="size-chip"
            >
              {{ size.name }}
            </v-chip>
          </v-chip-group>
        </div>
      </div>
    </div>

    <!-- Content -->
    <v-card-text class="card-content">
      <div class="cocktail-header">
        <h3 class="cocktail-name">{{ cocktail.name }}</h3>
        <div class="price-container">
          <span class="price">{{ selectedSize[0].price }}€</span>
          <span class="size-info">{{ selectedSize }}</span>
        </div>
      </div>

      <!-- Description -->
      <p class="cocktail-description">
        {{ cocktail.description }}
      </p>

      <!-- Ingredients -->
      <div class="ingredients-section">
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
              :disabled="quantity <= 1"
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
              @blur="validateQuantity"
            />

            <v-btn
              icon
              size="small"
              variant="outlined"
              color="primary"
              @click="increaseQuantity"
              :disabled="quantity >= 99"
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
        >
          <v-icon start>mdi-cart-plus</v-icon>
          Ajouter
        </v-btn>
      </div>
    </v-card-text>

    <!-- Mobile Actions -->
    <v-card-actions v-if="$vuetify.display.mobile" class="mobile-actions">
      <v-btn
        variant="text"
        color="primary"
        @click="showDetails"
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
      >
        <v-icon start>mdi-cart-plus</v-icon>
        {{ getCurrentPrice.value }}€
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
      return value.name && value.category && value.sizes && value.ingredients
    }
  }
})

// Emits
const emit = defineEmits(['add-to-cart', 'toggle-favorite', 'show-details'])

// Reactive data
const selectedSize = ref(props.cocktail.sizes[0]?.name || 'M')
const quantity = ref(1)
const isAddingToCart = ref(false)
const isFavorite = ref(false)

// Prix actuel selon la taille sélectionnée
const getCurrentPrice = computed(() => {
  const size = props.cocktail.sizes.find(s => s.name === selectedSize.value)
  return size?.price || 0
})

// Methods utilitaires
const getCategoryGradient = (category) => {
  const gradients = {
    'Classique': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    'Tropical': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    'Signature': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    'Sans Alcool': 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    'Digestif': 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    'Apéritif': 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    'default': 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
  }
  return gradients[category] || gradients.default
}

const getCategoryIcon = (category) => {
  const icons = {
    'Classique': 'mdi-glass-cocktail',
    'Tropical': 'mdi-palm-tree',
    'Signature': 'mdi-diamond-stone',
    'Sans Alcool': 'mdi-leaf',
    'Digestif': 'mdi-glass-wine',
    'Apéritif': 'mdi-glass-flute',
    'default': 'mdi-glass-cocktail'
  }
  return icons[category] || icons.default
}

const getCategoryColor = (category) => {
  const colors = {
    'Classique': 'amber',
    'Tropical': 'green',
    'Signature': 'purple',
    'Sans Alcool': 'cyan',
    'Digestif': 'red',
    'Apéritif': 'pink',
    'default': 'grey'
  }
  return colors[category] || colors.default
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
  isAddingToCart.value = true
  try {
    const cartItem = {
      cocktail: props.cocktail,
      size: selectedSize.value,
      quantity: quantity.value,
      price: getCurrentPrice.value
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
  isFavorite.value = !isFavorite.value
  emit('toggle-favorite', {
    cocktail: props.cocktail,
    isFavorite: isFavorite.value
  })
}

const showDetails = () => {
  emit('show-details', props.cocktail)
}

// Reset quantity when size changes
watch(selectedSize, () => {
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
}

.card-hover:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-hover);
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
}

/* Favorite Button */
.favorite-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.favorite-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

/* Size Selector */
.size-selector {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
}

.size-chips {
  gap: 4px;
}

.size-chip {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: var(--transition);
}

.size-chip:hover {
  transform: scale(1.05);
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
}

.price-container {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.price {
  font-size: 1.5rem;
  font-weight: 800;
  color: #f59e0b;
  line-height: 1;
}

.size-info {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
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

.add-to-cart-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
}

/* Mobile Actions */
.mobile-actions {
  padding: 16px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(248, 250, 252, 0.5);
}

/* Mobile Responsive */
@media (max-width: 768px) {
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

  .price {
    font-size: 1.25rem;
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
}

/* Tablet Responsive */
@media (max-width: 1024px) and (min-width: 769px) {
  .cocktail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .price-container {
    align-items: flex-start;
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
</style>
