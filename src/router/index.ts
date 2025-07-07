import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'


const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
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
    path: '/recipe-management',
    name: 'RecipeManagement',
    component: () => import('../views/crud/Recipe.vue'),
  },
  {
    path: '/ingredient-management',
    name: 'IngredientManagement',
    component: () => import('../views/crud/Ingredient.vue'),
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
