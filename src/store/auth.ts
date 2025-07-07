import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode'
import { toast } from 'vue3-toastify'
import api from '../utils/axios'
import router from '../router'

// Interface pour le payload JWT selon ton backend JWTService.java
export interface JwtPayload {
  EMAIL: string;
  USER_ID: number;
  ROLE: string;
  exp: number;
  iss: string;
}

export const useAuthStore = defineStore('auth', {
  state: () => {



    // Récupération du token depuis localStorage
    const token = localStorage.getItem('token')
    let payload: JwtPayload | null = null

    if (token) {
      try {
        payload = jwtDecode<JwtPayload>(token)
        // Si déjà expiré, on nettoie
        if (Date.now() / 1000 >= payload.exp) {
          payload = null
          localStorage.removeItem('token')
        }
      } catch {
        // token invalide ou mal formé
        localStorage.removeItem('token')
      }
    }

    return {
      token: token as string | null,
      payload,
      returnUrl: null as string | null,
      logoutTimer: null as ReturnType<typeof setTimeout> | null,
    }
  },

  getters: {
    // Est-ce qu'on a un token valide non-expiré ?
    isAuthenticated: (state): boolean =>
      !!state.token && !!state.payload,

    // Infos utilisateur tirées du payload
    userEmail: (state): string | null => state.payload?.EMAIL ?? null,
    userId: (state): number | null => state.payload?.USER_ID ?? null,
    userRole: (state): string | null => state.payload?.ROLE ?? null,

    // Helpers pour les rôles
    isUser: (state): boolean => state.payload?.ROLE === 'ROLE_USER',
    isBarmaker: (state): boolean => state.payload?.ROLE === 'ROLE_BARMAKER',
    isAdmin: (state): boolean => state.payload?.ROLE === 'ROLE_ADMIN',

    // Date d'expiration
    expiresAt: (state): Date | null =>
      state.payload ? new Date(state.payload.exp * 1000) : null,
  },

  actions: {
    init() {
      this.initAutoLogout()
    },

    // Auto-logout avant expiration
    initAutoLogout() {
      if (!this.payload) return

      const ms = this.payload.exp * 1000 - Date.now()
      if (ms <= 0) {
        return this.logout()
      }

      this.logoutTimer = setTimeout(() => {
        this.logout()
        toast.error('Session expirée, veuillez vous reconnecter')
        router.push('/login')
      }, ms)
    },

    // Login avec les endpoints de ton backend
    async login(email: string, password: string) {
      try {
        const { data } = await api.post('/api/auth/login', {
          email: email,
          password: password,
        })

        // Stocker le token
        this.token = data
        localStorage.setItem('token', data)

        // Décoder le payload
        try {
          this.payload = jwtDecode<JwtPayload>(data)
        } catch (error) {
          console.error('Erreur décodage JWT:', error)
          throw new Error('Token invalide reçu du serveur')
        }

        toast.success(`Connexion réussie ! Bienvenue ${this.userEmail}`, {
          autoClose: 2000
        })

        // Planifier la déconnexion auto
        this.initAutoLogout()

        // Redirection selon le rôle
        setTimeout(() => {
          if (this.returnUrl) {
            router.push(this.returnUrl)
            this.returnUrl = null
          } else {
            // Redirection par défaut selon le rôle
            if (this.isBarmaker || this.isAdmin) {
              router.push('/orders-management')
            } else {
              router.push('/menu')
            }
          }
        }, 1000)

      } catch (error: any) {
        console.error('Erreur login:', error)

        if (error.response?.status === 401) {
          throw new Error('Email ou mot de passe incorrect')
        } else if (error.response?.status === 403) {
          throw new Error('Compte non autorisé')
        } else {
          throw new Error('Erreur de connexion. Veuillez réessayer.')
        }
      }
    },

    // Register avec les endpoints de ton backend
    async register(email: string, password: string) {
      try {
        const { data } = await api.post('/api/auth/register', {
          email: email,
          password: password,
        })

        toast.success('Inscription réussie ! Vous pouvez maintenant vous connecter.', {
          autoClose: 3000
        })

        // Rediriger vers login après inscription
        setTimeout(() => {
          router.push('/login')
        }, 1500)

        return data

      } catch (error: any) {
        console.error('Erreur register:', error)

        if (error.response?.status === 409) {
          throw new Error('Cette adresse email est déjà utilisée')
        } else {
          throw new Error('Erreur lors de l\'inscription. Veuillez réessayer.')
        }
      }
    },

    logout() {
      // Nettoyage total
      this.token = null
      this.payload = null
      this.returnUrl = null

      if (this.logoutTimer) {
        clearTimeout(this.logoutTimer)
        this.logoutTimer = null
      }

      localStorage.removeItem('token')

      toast.info('Déconnexion réussie !', { autoClose: 2000 })

      setTimeout(() => {
        router.push('/login')
      }, 1000)
    },

    // Méthode pour sauvegarder l'URL de retour
    setReturnUrl(url: string) {
      this.returnUrl = url
    },

    // Vérifier si l'utilisateur a un rôle spécifique
    hasRole(role: string): boolean {
      return this.userRole === role
    },

    // Vérifier si l'utilisateur a au moins un des rôles
    hasAnyRole(roles: string[]): boolean {
      return roles.includes(this.userRole || '')
    }
  },
})
