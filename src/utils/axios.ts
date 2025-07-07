import axios from "axios";
// import router from "./router";
import apiUrl from "../constant/constant.ts";
// ✅ import nommé, disponible dans jwt-decode
import { jwtDecode } from 'jwt-decode'
import { toast } from 'vue3-toastify'
import { useRouter } from 'vue-router'
const router = useRouter()


interface JwtPayload {
	email: string; // Email de l'utilisateur
  exp: number; // Date d'expiration du token
  ROLE: string; // Identifiant du token
  USER_ID: number; // Identifiant de l'utilisateur
};


const api = axios.create({
  baseURL: apiUrl ,
  headers: {
	"Content-Type": "application/json",
	'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
  }
});



api.interceptors.request.use(
  (config) => {

	  let raw = localStorage.getItem('token');
	  if (!raw) return config;
	  const { exp }: JwtPayload = jwtDecode(raw);
	  // Si vous stockez "Bearer <votre_jwt>", on enlève le préfixe
	  if (raw.startsWith('Bearer ')) {
		raw = raw.slice(7);
	  }
	const token = localStorage.getItem("token");
	const decodedToken = localStorage.getItem("token");
	if (token) {
	  if (isTokenExpired(token)) {
		toast.error("🔴 Token expiré, suppression du token, merci de vous reconnecter", {
		  position: "top-right",
		  autoClose: 5000,
		  hideProgressBar: false,
		  closeOnClick: true,
		  pauseOnHover: true,
		  progress: undefined,
		});
		localStorage.removeItem("token");
		router.push({name : "login"});
		// Si le token est expiré, on le supprime et on redirige vers la page de connexion
		return Promise.reject(new Error("Token expiré, suppression du token, merci de vous reconnecter"));

	  }
	  config.headers.set('x-auth-token', raw);
	  config.headers.set('Content-Type', 'application/json');
	}
	return config;
  },
  (error) => Promise.reject(error)
);


api.interceptors.response.use(
  (response) => response, // Si la réponse est OK, on la retourne
  (error) => {
	if (error.response?.status === 401) {
	  console.log("🔴 Token invalide ou utilisateur non authentifié");
	  localStorage.removeItem("token");
	  router.push("/login");
	}
	return Promise.reject(error);
  }
);

const isTokenExpired = (token: any) => {
  if (!token) return true;
  try {
	const decoded = jwtDecode(token);
	if (!decoded.exp) return true; // Si pas de `exp`, on considère que le token est invalide
	return decoded.exp * 1000 < Date.now(); // Vérifie si `exp` est passé
  } catch (error) {
	return true; // Si erreur, considère que le token est invalide
  }
};


export default api;
