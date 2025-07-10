import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'


const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
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
  },
  {
    path: '/admin/ingredients',
    name: 'IngredientManagement',
    component: () => import('../views/crud/Ingredient.vue'),
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('../views/crud/Cart.vue'),
  },
  {
    path: '/orders',
    name: 'Order',
    props: true,
    component: () => import('../views/crud/Order.vue'),
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
