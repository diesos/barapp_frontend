<template>
  <v-app>
    <!-- Loading overlay -->
    <v-overlay v-model="loading" class="loading-overlay">
      <v-progress-circular
        indeterminate
        size="64"
        color="primary"
      />
    </v-overlay>

    <!-- Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      :temporary="$vuetify.display.mobile"
      :permanent="!$vuetify.display.mobile"
      class="nav-drawer"
      width="280"
    >
      <!-- Header -->
      <div class="nav-header">
        <div class="nav-logo">
          <v-icon size="40" color="primary">mdi-glass-cocktail</v-icon>
          <div class="nav-title">
            <h2 color="blue">BarCraft</h2>
            <span class="nav-subtitle">{{ userType }}</span>
          </div>
        </div>
      </div>

      <v-divider class="nav-divider" />

      <!-- Navigation Items -->
        <v-list nav class="nav-list">
    <v-list-item
      v-for="item in displayedMenuItems"
      :key="item.value"
      :to="item.to"
      :value="item.value"
      class="nav-item"
      rounded="xl"
    >
      <template #prepend>
        <v-icon :icon="item.icon" size="20" />
      </template>
      <v-list-item-title>{{ item.title }}</v-list-item-title>
    </v-list-item>
  </v-list>
      <!-- Footer -->
      <template #append>
        <div class="nav-footer">
          <v-btn
            @click="logout"
            variant="text"
            color="error"
            block
            class="logout-btn"
          >
            <v-icon start>mdi-logout</v-icon>
            Déconnexion
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar
      :elevation="0"
      class="app-bar"
      height="80"
    >
      <v-app-bar-nav-icon
        v-if="$vuetify.display.mobile"
        @click="drawer = !drawer"
        class="nav-toggle"
      />

      <v-app-bar-title class="app-title">
        {{ currentPageTitle? currentPageTitle : 'BarCraft' }}
      </v-app-bar-title>

      <v-spacer />

      <!-- Client cart icon -->
      <v-btn
        v-if="userType === 'client'"
        icon
        size="large"
        class="cart-btn"
        @click="$router.push('/cart')"
      >
        <v-badge
          :content="cartCount"
          :model-value="cartCount > 0"
          color="error"
          offset-x="2"
          offset-y="2"
        >
          <v-icon>mdi-cart</v-icon>
        </v-badge>
      </v-btn>

      <!-- Notifications -->
<!-- Cart Button in AppBar -->
<v-menu offset-y min-width="340">
  <template #activator="{ props }">
    <v-btn v-bind="props" icon>
      <v-badge
        :content="cartCount"
        :model-value="cartCount > 0"
        color="error"
        offset-x="-4"
        offset-y="-4"
      >
        <v-icon>mdi-cart</v-icon>
      </v-badge>
    </v-btn>
  </template>
  <v-list class="cart-popup-list pa-0">
    <v-list-item>
      <v-list-item-title class="text-lg font-bold py-1">Mon Panier</v-list-item-title>
    </v-list-item>
    <v-divider/>
    <template v-if="!basket || basket.basketLines.length === 0">
      <v-list-item>
        <v-list-item-title class="text-grey">Panier vide</v-list-item-title>
      </v-list-item>
    </template>
    <template v-else>
      <div class="cart-mini-list">
        <v-list-item
          v-for="line in basket.basketLines"
          :key="line.id"
          class="cart-line-item"
        >
          <template #prepend>
            <v-avatar size="38" rounded>
              <img
                v-if="line.cocktail.imageUrl"
                :src="line.cocktail.imageUrl"
                :alt="line.cocktail.name"
                style="object-fit:cover;"
              />
              <v-icon v-else color="grey">mdi-glass-cocktail</v-icon>
            </v-avatar>
          </template>
          <div class="cart-line-info">
            <div class="cart-line-main">
              <span class="cart-name">{{ line.cocktail.name }}</span>
              <span class="cart-size">({{ line.cocktailSize.size }})</span>
            </div>
            <div class="cart-line-details">
              <span class="cart-qty">x{{ line.quantity }}</span>
              <span class="cart-unit">@{{ (line.unitPrice / 100).toFixed(2) }} €</span>
            </div>
          </div>
          <div class="cart-line-price ml-auto font-bold text-right">
            {{ ((line.unitPrice * line.quantity) / 100).toFixed(2) }} €
          </div>
        </v-list-item>
      </div>
      <v-divider class="my-1" />
      <v-list-item>
        <v-list-item-title class="font-bold">
          Total&nbsp;: <span class="text-primary">{{ (cartTotal / 100).toFixed(2) }} €</span>
        </v-list-item-title>
        <v-spacer />
        <v-btn
          color="primary"
          size="small"
          class="rounded-xl font-bold"
          @click="$router.push('/cart')"
        >
          Voir le panier
        </v-btn>
      </v-list-item>
    </template>
  </v-list>
</v-menu>




      <!-- User Menu -->
      <v-menu offset-y>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon
            size="large"
            class="user-menu-btn"
          >
            <v-avatar size="40" color="primary">
              <v-icon>mdi-account</v-icon>
            </v-avatar>
          </v-btn>
        </template>

        <v-list class="user-menu">
          <v-list-item>
            <v-list-item-title>{{ userEmail }}</v-list-item-title>
            <v-list-item-subtitle>
                                    <v-chip
                        :color="getRoleColor(userType)"
                        size="small"
                        variant="tonal"
                      >{{ userType }}
                      </v-chip></v-list-item-subtitle>
          </v-list-item>
          <v-divider />
          <v-list-item @click="$router.push('/profile')">
            <template #prepend>
              <v-icon>mdi-account-circle</v-icon>
            </template>
            <v-list-item-title>Profil</v-list-item-title>
          </v-list-item>
          <v-list-item @click="logout">
            <template #prepend>
              <v-icon>mdi-logout</v-icon>
            </template>
            <v-list-item-title>Déconnexion</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Main Content -->
    <v-main class="main-content">
      <v-container fluid class="content-container">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </v-container>
    </v-main>

    <!-- Floating Action Button (pour mobile) -->
    <v-fab
      v-if="$vuetify.display.mobile && userType === 'client'"
      location="bottom end"
      size="large"
      color="primary"
      @click="$router.push('/cart')"
      class="fab-cart"
    >
      <v-badge
        :content="cartCount"
        :model-value="cartCount > 0"
        color="error"
        offset-x="-8"
        offset-y="-8"
      >
        <v-icon>mdi-cart</v-icon>
      </v-badge>
    </v-fab>

    <!-- Snackbar pour notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top"
      class="custom-snackbar"
    >
      {{ snackbar.message }}
      <template #actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from './store/auth'
import { useBasketStore } from './store/basket'
import api from './utils/axios'


// Composables
const router = useRouter()
const route = useRoute()
const { mobile } = useDisplay()

const authStore = useAuthStore()
const basketStore = useBasketStore()

// Reactive data
const drawer = ref(!mobile.value)
const loading = ref(false)
const userType = ref('client') // 'client' ou 'barmaker'
const userEmail = ref('user@example.com')
const notificationCount = ref(2)
const cartItems = ref([])

const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
  timeout: 3000
})


const basket = computed(() => basketStore.basket)
const cartCount = computed(() => basketStore.cartCount)
const cartTotal = computed(() => basketStore.cartTotal)

async function fetchCart() {
  const { data } = await api.get('/api/basket')
  basket.value = data
  cartItems.value = data.basketLines
  cartTotal.value = data.totalAmount // adapte selon ton modèle
  cartCount.value = cartItems.value.reduce((acc, curr) => acc + curr.quantity, 0)
}

async function removeFromCart(cocktailId) {
  await api.delete(`/api/basket/remove/${cocktailId}`)
  fetchCart()
}

// A appeler quand tu ajoutes au panier (dans ta page Menu)
async function addToCart(cocktailId, quantity) {
  await api.post('/api/basket/add', null, {
    params: { cocktailId, quantity }
  })
  fetchCart()
}



const currentPageTitle = computed(() => {
  // On utilise la nouvelle propriété calculée qu'on va créer juste après
  const currentItem = displayedMenuItems.value.find(item => item.to === route.path);
  return currentItem?.title || 'Tableau de bord'; // Utilise le titre trouvé ou une valeur par défaut
});

// Items pour TOUS les utilisateurs (clients inclus)
const baseMenuItems = [
  { title: 'Carte', value: 'menu', icon: 'mdi-silverware', to: '/menu' },
  { title: 'Mes Commandes', value: 'orders', icon: 'mdi-clock-outline', to: '/orders' },
  { title: 'Profil', value: 'profile', icon: 'mdi-account', to: '/profile' }
];

// Items UNIQUEMENT pour les administrateurs
const adminOnlyMenuItems = [
    { title: 'Commandes en cours', value: 'orders-management', icon: 'mdi-clipboard-list', to: '/admin/orders' },
    { title: 'Gestion Carte', value: 'menu-management', icon: 'mdi-cog', to: '/admin/menu' },
    { title: 'Gestion Categories', value: 'categorie-management', icon: 'mdi-shape-plus', to: '/admin/categories' },
    { title: 'Gestion Cocktails', value: 'cocktail-management', icon: 'mdi-glass-pint-outline', to: '/admin/cocktails' },
    { title: 'Gestion Recettes', value: 'recipe-management', icon: 'mdi-notebook-edit', to: '/admin/recipes' },
    { title: 'Gestion Ingrédients', value: 'ingredient-management', icon: 'mdi-spa', to: '/admin/ingredients' },
    { title: 'Statistiques', value: 'stats', icon: 'mdi-chart-bar', to: '/admin/stats' },
];

const clientMenuItems = computed(() => {
    // Les clients ont le menu de base + le panier
    return [
      ...baseMenuItems,
      { title: 'Panier', value: 'cart', icon: 'mdi-cart', to: '/cart' },
    ];
});

const adminMenuItems = computed(() => {
    // Les admins ont tout
    return [...baseMenuItems, ...adminOnlyMenuItems];
});

// LA PROPRIÉTÉ MAGIQUE !
// Elle choisit quelle liste afficher.
const displayedMenuItems = computed(() => {
  if (userType.value === 'Administrateur') {
    return adminMenuItems.value;
  }
  // Par défaut, on retourne le menu client
  return clientMenuItems.value;
});

// Methods
const logout = () => {
  // Logique de déconnexion
  router.push('/login')
}

const showSnackbar = (message, color = 'success') => {
  snackbar.value = {
    show: true,
    message,
    color,
    timeout: 3000
  }
}

  const getRoleColor = (role) => {
  switch (role) {
    case 'ROLE_ADMIN': return 'error'
    case 'Administrateur': return 'error'
    case 'ROLE_BARMAKER': return 'warning'
    case 'Barmaker': return 'warning'
    case 'ROLE_USER': return 'primary'
    case 'Client': return 'primary'
    default: return 'grey'
  }
}

const getRoleLabel = (role) => {
  switch (role) {
    case 'ROLE_ADMIN': return 'Administrateur'
    case 'ROLE_BARMAKER': return 'Barmaker'
    case 'ROLE_USER': return 'Client'
    default: return 'Inconnu'
  }
}


// Lifecycle
onMounted(() => {


  // Récupérer les informations de l'utilisateur depuis le store
  userType.value = getRoleLabel(authStore.userRole) || 'client'
  userEmail.value = authStore.userEmail || ''
  fetchCart()
})
</script>

<style scoped>
/* Variables CSS personnalisées */

.admin-divider {
  position: relative;
  margin: 20px 0;
  border-color: #333;
  border-width: 2px;
}

.admin-divider-text {
  position: absolute;
  left: 50%;
  top: 50%;
  background: white;
  transform: translate(-50%, -50%);
  padding: 0 16px;
  font-weight: bold;
  color: #333;
  letter-spacing: 2px;
  font-size: 0.95rem;
}


:root {
  --primary-gradient: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  --secondary-gradient: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.2);
  --shadow-soft: 0 8px 32px rgba(0, 0, 0, 0.1);
  --shadow-hover: 0 12px 40px rgba(0, 0, 0, 0.15);
}

/* Navigation Drawer */
.nav-drawer {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  backdrop-filter: blur(20px);
  border-right: 1px solid var(--glass-border);
}

.nav-header {
  padding: 24px 20px;
  background: var(--primary-gradient);
  color: white;
  margin: 0;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 16px;
}

.nav-title h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}

.nav-subtitle {
  font-size: 0.875rem;
  opacity: 0.9;
  text-transform: capitalize;
}

.nav-divider {
  margin: 0;
  border-color: rgba(0, 0, 0, 0.08);
}

.nav-list {
  padding: 16px 12px;
}

.nav-item {
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.nav-item:hover {
  background: rgba(245, 158, 11, 0.1);
  transform: translateX(4px);
}

.nav-item.v-list-item--active {
  background: var(--primary-gradient);
  color: #1967C0;
  box-shadow: var(--shadow-soft);
}

.nav-footer {
  padding: 16px 12px;
  border-top: 1px solid var(--glass-border);
}

.logout-btn {
  border-radius: 12px;
  text-transform: none;
  font-weight: 500;
}

/* App Bar */
.app-bar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--glass-border);
}

.nav-toggle {
  border-radius: 12px;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
}

.app-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-left: 8px;
}

.cart-btn, .notification-btn, .user-menu-btn {
  border-radius: 12px;
  margin: 0 4px;
  transition: all 0.3s ease;
}

.cart-btn:hover, .notification-btn:hover, .user-menu-btn:hover {
  background: var(--glass-bg);
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.user-menu {
  border-radius: 16px;
  box-shadow: var(--shadow-soft);
  border: 1px solid var(--glass-border);
}

/* Main Content */
.main-content {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
}

.content-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .content-container {
    padding: 16px;
  }

  .nav-header {
    padding: 20px 16px;
  }

  .nav-title h2 {
    font-size: 1.25rem;
  }

  .app-title {
    font-size: 1.25rem;
  }
}

/* Floating Action Button */
.fab-cart {
  bottom: 24px;
  right: 24px;
  box-shadow: var(--shadow-hover);
  background: var(--primary-gradient);
}

.fab-cart:hover {
  transform: scale(1.05);
}

/* Page Transitions */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Loading Overlay */
.loading-overlay {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

/* Custom Snackbar */
.custom-snackbar {
  border-radius: 12px;
  box-shadow: var(--shadow-soft);
}

/* Scrollbar personnalisée */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
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

.nav-item {
  animation: fadeInUp 0.3s ease forwards;
}

.nav-item:nth-child(1) { animation-delay: 0.1s; }
.nav-item:nth-child(2) { animation-delay: 0.2s; }
.nav-item:nth-child(3) { animation-delay: 0.3s; }
.nav-item:nth-child(4) { animation-delay: 0.4s; }
.nav-item:nth-child(5) { animation-delay: 0.5s; }

.cart-popup-list {
  min-width: 340px;
  max-width: 96vw;
  padding-bottom: 0;
  border-radius: 16px;
  box-shadow: 0 4px 32px 0 rgba(0,0,0,0.10);
  max-height: 60vh;
  overflow-y: auto;
  background: white;
}

.cart-mini-list {
  max-height: 230px;
  overflow-y: auto;
}

.cart-line-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  min-height: 52px;
  transition: background 0.13s;
}

.cart-line-item:hover {
  background: rgba(245,158,11,0.06);
}

.cart-line-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  flex: 1 1 auto;
  margin-left: 8px;
  overflow: hidden;
}

.cart-line-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.cart-name {
  max-width: 120px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.cart-size {
  font-size: 0.93em;
  color: #64748b;
  font-weight: 400;
}

.cart-line-details {
  display: flex;
  gap: 8px;
  font-size: 0.93em;
  color: #64748b;
  margin-top: 2px;
}

.cart-line-price {
  min-width: 58px;
  text-align: right;
  font-size: 1.05rem;
  color: #f59e0b;
}

@media (max-width: 600px) {
  .cart-popup-list {
    min-width: 85vw;
    max-width: 98vw;
    border-radius: 14px;
    font-size: 0.97rem;
  }
  .cart-name {
    max-width: 65vw;
  }
}

</style>
