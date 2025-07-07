import axios from "axios";
import { apiUrl } from "../constant/constant";
import { jwtDecode } from 'jwt-decode';

// Interface pour le payload JWT selon ton backend JWTService.java
interface JwtPayload {
  EMAIL: string;
  USER_ID: number;
  ROLE: string;
  exp: number;
  iss: string;
}

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        // Vérifier si le token est expiré
        const decoded: JwtPayload = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          // Token expiré
          console.log("🔴 Token expiré, suppression automatique");
          localStorage.removeItem('token');

          // Rediriger vers login seulement si on n'y est pas déjà
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }

          return Promise.reject(new Error("Token expiré"));
        }

        // Ajouter le token dans les headers
        config.headers.Authorization = `Bearer ${token}`;

      } catch (error) {
        // Token malformé
        console.error("🔴 Token malformé:", error);
        localStorage.removeItem('token');

        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }

        return Promise.reject(new Error("Token invalide"));
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si erreur 401, token invalide côté serveur
    if (error.response?.status === 401) {
      console.log("🔴 Unauthorized (401) - Token invalide côté serveur");
      localStorage.removeItem('token');

      // Rediriger vers login seulement si on n'y est pas déjà
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
