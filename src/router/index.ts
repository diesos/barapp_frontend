import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'


const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Menu.vue'),
  },
  {
    path: '/menu',
    name: 'Menu',
    component: () => import('../views/Menu.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/Auth.vue'),
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/auth/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/cocktails',
    name: 'CocktailManagement',
    component: () => import('../views/crud/Cocktail.vue'),
  },
  {
    path: '/admin/orders',
    name: 'OrderManagement',
    component: () => import('../views/crud/AdminOrders.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/categories',
    name: 'CategorieManagement',
    component: () => import('../views/crud/Categorie.vue'),
  },
  {
    path: '/admin/recipes',
    name: 'RecipeManagement',
    component: () => import('../views/crud/Recipe.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/ingredients',
    name: 'IngredientManagement',
    component: () => import('../views/crud/Ingredient.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('../views/crud/Cart.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/orders',
    name: 'Order',
    props: true,
    component: () => import('../views/crud/Order.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

import { useAuthStore } from '../store/auth'

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  // Si la route nécessite d'être authentifié
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    // Optionnel : Mémoriser la page demandée pour y revenir après login
    auth.setReturnUrl(to.fullPath)
    return next('/login')
  }
  next()
})

export default router
