<template>
  <v-container fluid class="auth-container">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="6" md="4">
        <v-card class="pa-6">
          <v-card-title class="text-h4 text-center mb-4">
            <v-icon size="40" color="primary" class="mr-2">mdi-glass-cocktail</v-icon>
            BarCraft
          </v-card-title>

          <v-form @submit.prevent="handleSubmit">
            <v-text-field
              v-model="email"
              label="Email"
              type="email"
              variant="outlined"
              :error-messages="errors.email"
              class="mb-3"
            />

            <v-text-field
              v-model="password"
              label="Mot de passe"
              :type="showPassword ? 'text' : 'password'"
              variant="outlined"
              :error-messages="errors.password"
              :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append-inner="showPassword = !showPassword"
            />

            <v-btn
              type="submit"
              color="primary"
              block
              size="large"
              :loading="loading"
              class="mt-4"
            >
              {{ isLogin ? 'Connexion' : 'Inscription' }}
            </v-btn>
          </v-form>

          <v-divider class="my-4" />

          <v-btn
            variant="text"
            block
            @click="toggleMode"
          >
            {{ isLogin ? 'Créer un compte' : 'Déjà un compte ?' }}
          </v-btn>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuthStore } from '../../store/auth'
import { toast } from 'vue3-toastify'

const authStore = useAuthStore()

const isLogin = ref(true)
const loading = ref(false)
const showPassword = ref(false)
const email = ref('')
const password = ref('')

const errors = reactive({
  email: '',
  password: ''
})

const validateForm = () => {
  errors.email = ''
  errors.password = ''

  if (!email.value) {
    errors.email = 'Email requis'
    return false
  }
  if (!/\S+@\S+\.\S+/.test(email.value)) {
    errors.email = 'Email invalide'
    return false
  }
  if (!password.value) {
    errors.password = 'Mot de passe requis'
    return false
  }
  if (password.value.length < 8) {
    errors.password = 'Minimum 8 caractères'
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true

  try {
    if (isLogin.value) {
      await authStore.login(email.value, password.value)
    } else {
      await authStore.register(email.value, password.value)
    }
  } catch (error: any) {
    toast.error(error.message)
  } finally {
    loading.value = false
  }
}

const toggleMode = () => {
  isLogin.value = !isLogin.value
  errors.email = ''
  errors.password = ''
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
