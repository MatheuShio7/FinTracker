// Configuração da API
const API_CONFIG = {
  protocol: import.meta.env.VITE_BACKEND_PROTOCOL || 'http',
  host: import.meta.env.VITE_BACKEND_HOST || 'localhost',
  port: import.meta.env.VITE_BACKEND_PORT || '5001'
};

// URL base da API
export const API_BASE_URL = `${API_CONFIG.protocol}://${API_CONFIG.host}:${API_CONFIG.port}`;

// Função helper para construir URLs da API
export const buildApiUrl = (endpoint) => {
  // Remove barra inicial se existir
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

export default API_CONFIG;
