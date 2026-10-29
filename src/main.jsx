import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './design/tokens.css'
import './luxuryTheme.css'
import './themeOverrides.css'
import App from './App.tsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

