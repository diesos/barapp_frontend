<template>
  <v-container fluid class="auth-container">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="auth-card" elevation="24">
          <!-- Header avec animation -->
          <v-card-title class="auth-header">
            <div class="brand-section">
              <v-icon
                :size="isLogin ? 48 : 52"
                color="primary"
                class="brand-icon"
              >
                mdi-glass-cocktail
              </v-icon>
              <h1 class="brand-title">Bar'app</h1>
              <p class="brand-subtitle">
                {{ isLogin ? 'Bienvenue' : 'Rejoignez-nous' }}
              </p>
            </div>
          </v-card-title>

          <!-- Indicateur d'état -->

          <v-card-text class="auth-content">
            <!-- Titre dynamique -->
            <div class="form-title">
              <h2>{{ isLogin ? 'Connectez-vous' : 'Créer votre compte' }}</h2>
              <p class="text-medium-emphasis">
                {{ isLogin
                  ? 'Accédez à votre espace personnel'
                  : 'Commencez votre expérience cocktail'
                }}
              </p>
            </div>

            <!-- Formulaire -->
            <v-form @submit.prevent="handleSubmit" class="auth-form">
              <!-- Email -->
              <div class="form-group">
                <v-text-field
                  v-model="email"
                  label="Adresse email"
                  type="email"
                  variant="outlined"
                  :error-messages="errors.email"
                  prepend-inner-icon="mdi-email-outline"
                  class="form-field"
                  color="primary"
                  :rules="[rules.required, rules.email]"
                />
              </div>

              <!-- Mot de passe -->
              <div class="form-group">
                <v-text-field
                  v-model="password"
                  :label="isLogin ? 'Mot de passe' : 'Créer un mot de passe'"
                  :type="showPassword ? 'text' : 'password'"
                  variant="outlined"
                  :error-messages="errors.password"
                  prepend-inner-icon="mdi-lock-outline"
                  :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  @click:append-inner="showPassword = !showPassword"
                  class="form-field"
                  color="primary"
                  :rules="isLogin ? [rules.required] : [rules.required, rules.passwordPattern]"
                />
                <div v-if="!isLogin" class="password-requirements">
                  <small class="text-caption">
                    <v-icon size="12" :color="hasLowerCase ? 'success' : 'error'">
                      {{ hasLowerCase ? 'mdi-check' : 'mdi-close' }}
                    </v-icon>
                    1 minuscule

                    <v-icon size="12" :color="hasUpperCase ? 'success' : 'error'" class="ml-2">
                      {{ hasUpperCase ? 'mdi-check' : 'mdi-close' }}
                    </v-icon>
                    1 majuscule

                    <v-icon size="12" :color="hasNumber ? 'success' : 'error'" class="ml-2">
                      {{ hasNumber ? 'mdi-check' : 'mdi-close' }}
                    </v-icon>
                    1 chiffre

                    <v-icon size="12" :color="hasSpecialChar ? 'success' : 'error'" class="ml-2">
                      {{ hasSpecialChar ? 'mdi-check' : 'mdi-close' }}
                    </v-icon>
                    1 caractère spécial (@$!%*?&)
                  </small>
                </div>
              </div>

              <!-- Confirmation mot de passe (inscription uniquement) -->
              <div v-if="!isLogin" class="form-group">
                <v-text-field
                  v-model="confirmPassword"
                  label="Confirmer le mot de passe"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  variant="outlined"
                  :error-messages="errors.confirmPassword"
                  prepend-inner-icon="mdi-lock-check-outline"
                  :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  @click:append-inner="showConfirmPassword = !showConfirmPassword"
                  class="form-field"
                  color="primary"
                  :rules="[rules.required, rules.passwordMatch]"
                />
              </div>

              <!-- Options additionnelles pour connexion -->
              <div v-if="isLogin" class="form-options">
                <v-btn
                  variant="text"
                  size="small"
                  color="primary"
                  class="forgot-password-btn"
                >
                  Mot de passe oublié ?
                </v-btn>
              </div>

              <!-- Bouton principal -->
              <v-btn
                type="submit"
                :color="isLogin ? 'primary' : 'secondary'"
                block
                size="large"
                :loading="loading"
                class="submit-btn"
                elevation="2"
              >
                <v-icon start>
                  {{ isLogin ? 'mdi-login' : 'mdi-account-plus' }}
                </v-icon>
                {{ isLogin ? 'Se connecter' : 'Créer le compte' }}
              </v-btn>
            </v-form>
          </v-card-text>

          <!-- Séparateur -->
          <v-divider class="auth-divider" />

          <!-- Basculer entre les modes -->
          <v-card-actions class="auth-actions">
            <div class="toggle-section">
              <p class="toggle-text">
                {{ isLogin ? 'Nouveau sur Bar\'app ?' : 'Déjà un compte ?' }}
              </p>
              <v-btn
                variant="text"
                :color="isLogin ? 'secondary' : 'primary'"
                @click="toggleMode"
                class="toggle-btn"
              >
                {{ isLogin ? 'Créer un compte' : 'Se connecter' }}
                <v-icon end>
                  {{ isLogin ? 'mdi-arrow-right' : 'mdi-arrow-left' }}
                </v-icon>
              </v-btn>
            </div>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '../../store/auth'
import { toast } from 'vue3-toastify'

const authStore = useAuthStore()

// États réactifs
const isLogin = ref(true)
const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const rememberMe = ref(false)

// Données du formulaire
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

// Validation en temps réel des critères mot de passe
const hasLowerCase = computed(() => /[a-z]/.test(password.value))
const hasUpperCase = computed(() => /[A-Z]/.test(password.value))
const hasNumber = computed(() => /\d/.test(password.value))
const hasSpecialChar = computed(() => /[@$!%*?&]/.test(password.value))

// Erreurs
const errors = reactive({
  email: '',
  password: '',
  confirmPassword: ''
})

// Règles de validation
const rules = {
  required: (value: string) => !!value || 'Ce champ est requis',
  email: (value: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || 'Email invalide'
  },
  minLength: (value: string) => value.length >= 8 || 'Minimum 8 caractères',
  passwordPattern: (value: string) => {
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,24}$/
    return pattern.test(value) || 'Le mot de passe doit contenir: 1 minuscule, 1 majuscule, 1 chiffre, 1 caractère spécial (@$!%*?&)'
  },
  passwordMatch: (value: string) => value === password.value || 'Les mots de passe ne correspondent pas'
}

// Validation du formulaire
const validateForm = () => {
  errors.email = ''
  errors.password = ''
  errors.confirmPassword = ''

  let isValid = true

  // Email
  if (!email.value) {
    errors.email = 'Email requis'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    errors.email = 'Format email invalide'
    isValid = false
  }

  // Mot de passe
  if (!password.value) {
    errors.password = 'Mot de passe requis'
    isValid = false
  } else if (!isLogin.value) {
    // Validation stricte uniquement pour l'inscription
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,24}$/
    if (!passwordPattern.test(password.value)) {
      errors.password = 'Le mot de passe doit contenir: 1 minuscule, 1 majuscule, 1 chiffre, 1 caractère spécial (@$!%*?&) et faire entre 8 et 24 caractères'
      isValid = false
    }
  }

  // Confirmation mot de passe (inscription uniquement)
  if (!isLogin.value) {
    if (!confirmPassword.value) {
      errors.confirmPassword = 'Confirmation requise'
      isValid = false
    } else if (confirmPassword.value !== password.value) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas'
      isValid = false
    }
  }

  return isValid
}

// Soumission du formulaire
const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true

  try {
    if (isLogin.value) {
      await authStore.login(email.value, password.value)
    } else {
      await authStore.register(email.value, password.value)
      isLogin.value = true
    }
  } catch (error: any) {
    toast.error(error.message || 'Une erreur est survenue')
  } finally {
    loading.value = false
  }
}

// Basculer entre connexion et inscription
const toggleMode = () => {
  isLogin.value = !isLogin.value

  // Reset des erreurs et champs
  errors.email = ''
  errors.password = ''
  errors.confirmPassword = ''
  confirmPassword.value = ''
  showPassword.value = false
  showConfirmPassword.value = false
  rememberMe.value = false
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 2rem 0;
}

.auth-card {
  border-radius: 24px !important;
  overflow: hidden;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95) !important;
  transition: all 0.3s ease;
}

.auth-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.1) !important;
}

.auth-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  text-align: center;
}

.brand-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.brand-icon {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.brand-title {
  font-size: 2.5rem !important;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.brand-subtitle {
  opacity: 0.9;
  font-size: 1.1rem;
  margin: 0;
}

.state-indicator {
  display: flex;
  justify-content: center;
  padding: 1rem;
  background: rgba(0,0,0,0.02);
}

.state-chip {
  transition: all 0.3s ease;
}

.auth-content {
  padding: 1rem !important;
}

.form-title {
  text-align: center;
  margin-bottom: 2rem;
}

.form-title h2 {
  font-size: 1.8rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
}

.form-group {
  position: relative;
}

.form-field {
  transition: all 0.3s ease;
}

.form-field:focus-within {
  transform: scale(1.02);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0.5rem 0;
}

.forgot-password-btn {
  text-decoration: none;
  font-size: 0.9rem;
}

.submit-btn {
  margin-top: 1rem;
  padding: 0.5rem !important;
  font-size: 1.1rem !important;
  font-weight: 600;
  border-radius: 12px !important;
  transition: all 0.3s ease;
  text-transform: none !important;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.auth-divider {
  margin: 1rem 0;
  opacity: 0.1;
}

.auth-actions {
  padding: 1.5rem 2rem 2rem !important;
}

.toggle-section {
  width: 100%;
  text-align: center;
}

.toggle-text {
  color: #6c757d;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.toggle-btn {
  font-size: 1rem;
  font-weight: 500;
  text-transform: none !important;
  transition: all 0.3s ease;
}

.toggle-btn:hover {
  transform: scale(1.05);
}

/* Responsive */
@media (max-width: 600px) {
  .auth-container {
    padding: 1rem;
  }

  .auth-content {
    padding: 1.5rem !important;
  }

  .brand-title {
    font-size: 2rem !important;
  }

  .form-title h2 {
    font-size: 1.5rem;
  }
}

/* Animations d'entrée */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.auth-card {
  animation: slideInUp 0.6s ease-out;
}
</style>
