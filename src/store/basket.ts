// src/stores/basket.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../utils/axios'

// -------- INTERFACES -------------
export interface Authority {
  authority: string
}

export interface User {
  id: number
  email: string
  role: string
  enabled: boolean
  username: string
  accountNonExpired: boolean
  accountNonLocked: boolean
  credentialsNonExpired: boolean
  authorities: Authority[]
}

export interface Cocktail {
  id: number
  name: string
  // Optionally add: description, imageUrl, etc.
}

export interface CocktailSize {
  id: number
  size: string   // "S", "M", "L"
  price: number
}

export interface BasketLine {
  id: number
  cocktail: Cocktail
  cocktailSize: CocktailSize    // <-- AJOUT taille obligatoire
  quantity: number
  unitPrice: number
}

export interface Basket {
  id: number
  basketLines: BasketLine[]
  isArchived: boolean
  isConverted: boolean
  totalAmount: number
  totalItems: number
  user: User
}

// -------- STORE -------------
export const useBasketStore = defineStore('basket', () => {
  // State
  const basket = ref<Basket | null>(null)
  const isLoading = ref(false)
  const error = ref<unknown>(null)

  // Getters
  const cartCount = computed(() => basket.value?.totalItems ?? 0)
  const cartTotal = computed(() => basket.value?.totalAmount ?? 0)
  const basketLines = computed(() => basket.value?.basketLines ?? [])
  const currentUser = computed(() => basket.value?.user ?? null)

  // Actions
  async function fetchBasket() {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.get<Basket>('/api/basket')
      basket.value = data
    } catch (e) {
      error.value = e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Ajoute un cocktail d'une taille donnée au panier
   */
  async function addToBasket(cocktailId: number, cocktailSizeId: number, quantity = 1) {
    isLoading.value = true
    error.value = null
    try {
      await api.post('/api/basket/add', null, {
        params: { cocktailId, cocktailSizeId, quantity }
      })
      await fetchBasket()
    } catch (e) {
      error.value = e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Met à jour la quantité d'un cocktail d'une taille donnée dans le panier
   */
  async function updateQuantity(cocktailId: number, cocktailSizeId: number, quantity: number) {
    isLoading.value = true
    error.value = null
    try {
      await api.put('/api/basket/update', null, {
        params: { cocktailId, cocktailSizeId, quantity }
      })
      await fetchBasket()
    } catch (e) {
      error.value = e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Supprime une ligne de panier (cocktail + taille)
   */
  async function removeFromBasket(cocktailId: number, cocktailSizeId: number) {
    isLoading.value = true
    error.value = null
    try {
      await api.delete(`/api/basket/remove/${cocktailId}/${cocktailSizeId}`)
      await fetchBasket()
    } catch (e) {
      error.value = e
    } finally {
      isLoading.value = false
    }
  }

  async function clearBasket() {
    isLoading.value = true
    error.value = null
    try {
      await api.delete('/api/basket/clear')
      await fetchBasket()
    } catch (e) {
      error.value = e
    } finally {
      isLoading.value = false
    }
  }

  async function convertToOrder() {
    isLoading.value = true
    error.value = null
    try {
      await api.post('/api/basket/convert')
      await fetchBasket()
    } catch (e) {
      error.value = e
    } finally {
      isLoading.value = false
    }
  }

  // Auto-fetch panier au 1er appel du store
  fetchBasket()

  return {
    basket,
    isLoading,
    error,
    cartCount,
    cartTotal,
    basketLines,
    currentUser,
    fetchBasket,
    addToBasket,
    updateQuantity,
    removeFromBasket,
    clearBasket,
    convertToOrder,
  }
})
