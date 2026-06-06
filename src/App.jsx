import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import PageWrapper from './components/PageWrapper'
import Verrou from './pages/Verrou'
import VueUser from './pages/VueUser'
import Dashboard from './pages/Dashboard'
import Alerts from './pages/Alerts'
import Sensors from './pages/Sensors'
import Cameras from './pages/Cameras'
import Logs from './pages/Logs'
import Reseau from './pages/Reseau'
import SanteRpi from './pages/SanteRpi'
import Blacklist from './pages/Blacklist'
import Parametres from './pages/Parametres'
import './App.css'

const CLE_ARME = 'sentinel_arme'

const lireArme = () => {
  try { return JSON.parse(localStorage.getItem(CLE_ARME)) === true }
  catch { return false }
}

function App() {
  const [deVerrouille, setDeVerrouille] = useState(false)
  // initialiser depuis localStorage pour cohérence avec la tablette USER
  const [arme, setArmeState] = useState(lireArme)
  const location = useLocation()

  // écrire dans localStorage à chaque changement d'état armé
  const setArme = useCallback((val) => {
    const nouvelEtat = typeof val === 'function' ? val(arme) : val
    localStorage.setItem(CLE_ARME, JSON.stringify(nouvelEtat))
    setArmeState(nouvelEtat)
  }, [arme])

  // écouter les changements depuis l'autre onglet (tablette USER)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === CLE_ARME) setArmeState(JSON.parse(e.newValue) === true)
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  // tablette USER — rendu sans aucun layout ADMIN
  if (location.pathname === '/user') return <VueUser />

  if (!deVerrouille) return <Verrou onSuccess={() => setDeVerrouille(true)} />

  return (
    <div className={`dashboard${arme ? " app-arme" : ""}`}>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0,
        height: 2,
        background: arme
          ? "linear-gradient(90deg, transparent, rgba(255,51,51,0.5), transparent)"
          : "linear-gradient(90deg, transparent, rgba(0,255,100,0.3), transparent)",
        animation: "scanMove 4s linear infinite",
        pointerEvents: "none",
        zIndex: 100,
      }} />
      <Header title="Home Sentinel" arme={arme} onToggleArme={() => setArme(v => !v)} />
      <Sidebar />

      <div className='main-content'>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/"          element={<PageWrapper><Dashboard arme={arme} onToggleArme={() => setArme(v => !v)} /></PageWrapper>} />
            <Route path="/cameras"   element={<PageWrapper><Cameras arme={arme} /></PageWrapper>} />
            <Route path="/sensors"   element={<PageWrapper><Sensors /></PageWrapper>} />
            <Route path="/alerts"    element={<PageWrapper><Alerts /></PageWrapper>} />
            <Route path="/logs"      element={<PageWrapper><Logs /></PageWrapper>} />
            <Route path="/reseau"    element={<PageWrapper><Reseau /></PageWrapper>} />
            <Route path="/sante"     element={<PageWrapper><SanteRpi /></PageWrapper>} />
            <Route path="/blacklist"  element={<PageWrapper><Blacklist /></PageWrapper>} />
            <Route path="/parametres" element={<PageWrapper><Parametres /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
