import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard' 
import Alerts from './pages/Alerts'
import Sensors from './pages/Sensors'
import Header from './components/Header'
import './App.css'


function App() {
  return (
    <div className='dashboard'>
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