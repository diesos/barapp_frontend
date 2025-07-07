// stores/auth.ts
import { defineStore } from 'pinia'
import { router } from '../router'
import api from '../utils/axios'
// ✅ import nommé, disponible dans jwt-decode
// ✅ import nommé, disponible dans jwt-decode
import { jwtDecode } from 'jwt-decode'
import { toast } from 'vue3-toastify'

// 1) Définissez l'interface de votre payload, adaptée à votre token
export interface JwtPayload {
  iat: number
  exp: number
  roles: string[]
  username: string
  id: number
  email: string
  id_client: number
  auth_token: string
  language: string
  magasin_id: number
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    const token = localStorage.getItem('token')
    let payload: JwtPayload | null = null

    if (token) {
      try {
        payload = jwtDecode<JwtPayload>(token)
        // Si déjà expiré, on va forcer un logout en nextTick
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

    // Exemples d’infos utilisateur tirées du payload
    userEmail: (state): string | null => state.payload?.email ?? null,
    userNom:   (state): string | null => state.payload?.username ?? null,
    userRoles: (state): string[]      => state.payload?.roles ?? [],
    isSuperAdmin: (state): boolean       =>
        state.payload?.roles.includes('ROLE_SUPER_ADMIN') ?? false,
      getUserId: (state): number | null => state.payload?.id ?? null,
      getUserIdClient: (state): number | null => state.payload?.id_client ?? null,
      getUserIdMagasin: (state): number | null => state.payload?.magasin_id ?? null,
      getUserLanguage: (state): string | null => state.payload?.language ?? null,

          // Date d'expiration pour un éventuel affichage
    expiresAt: (state): Date | null =>
        state.payload ? new Date(state.payload.exp * 1000) : null,
    getToken: (state): string | null => localStorage.getItem('token') ?? null,
  },

  actions: {
    init() {
        this.initAutoLogout()
    },
    // Si vous voulez lancer l'auto-logout après le chargement
    initAutoLogout() {
      if (!this.payload) return
      const ms = this.payload.exp * 1000 - Date.now()
      if (ms <= 0) {
        return this.logout()
      }
      this.logoutTimer = setTimeout(() => {
        this.logout()
        router.push({name: 'Login'})
      }, ms)
    },

    // Appel de login : on récupère token, on décode et on schedule
    async login(username: string, password: string) {
      try {
        const { data } = await api.post('auth-tokens-admin-manager', {
          login: username,
          password: password,
        })
        // 1) Stocker le token
        this.payload = jwtDecode<JwtPayload>(data.token)
        this.token = data.token
        if (!this.payload) {
          toast.error('Token invalide ou mal formé')
          return
        }
        if (this.token){
        localStorage.setItem('token', this.token)
        }
        else {
          toast.error('Token invalide ou mal formé')
          return
        }
        toast.success(`Connexion réussie ! Bienvenu  ${this.payload.username} `, { autoClose: 1000 })
        // 3) Planifier la déconnexion auto
        this.initAutoLogout()
        setTimeout(() => {
          router.push(this.returnUrl || {name: 'Dashboard1'})
        }
        , 1000)
      } catch (err) {
        console.error(err)
        throw err
      }
    },

    logout() {
      // Nettoyage total
      this.token = null
      this.payload = null
      if (this.logoutTimer) {
        clearTimeout(this.logoutTimer)
        this.logoutTimer = null
      }
      toast.error('Déconnexion réussie !', { autoClose: 2000 })
      localStorage.removeItem('token')
      setTimeout(() => {
        router.push({name: 'Login'})
      }
      , 1000)
    },
  },
})
