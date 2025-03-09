// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // Using the new App component
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)