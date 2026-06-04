import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Alerts from './pages/Alerts'
import Sensors from './pages/Sensors'
import Header from './components/Header'
import Verrou from './pages/Verrou'
import './App.css'


function App() {
  // false au demarrage → affiche le verrou, true → accede a l'app
  const [deVerrouille, setDeVerrouille] = useState(false)

  // tant que pas deverrouille on affiche juste le verrou
  if (!deVerrouille) {
    return <Verrou onSuccess={() => setDeVerrouille(true)} />
  }

  return (
    <div className='dashboard'>
      <div style={{
  position: "fixed", top: 0, left: 0, right: 0,
  height: 2,
  background: "linear-gradient(90deg, transparent, rgba(0,255,100,0.3), transparent)",
  animation: "scanMove 4s linear infinite",
  pointerEvents: "none",
  zIndex: 100,
}} />
      <Header title="Home Sentinel" />
      <Sidebar />

      <div className='main-content'>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sensors" element={<Sensors />} />
          <Route path="/alerts" element={<Alerts />} />

        </Routes>
      </div>
    </div>
  )
}

export default App