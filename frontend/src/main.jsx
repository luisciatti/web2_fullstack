import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import App from './App.jsx'
import './styles/temaEscuro.css'
import './styles/temaEscuroAjustes.css'
import { aplicarTemaSalvo } from './tema/tema.js'

aplicarTemaSalvo()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
