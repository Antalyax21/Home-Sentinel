import { NavLink } from 'react-router-dom'

function Sidebar() {
  return (
    <nav className="sidebar">
      <NavLink to="/">Dashboard</NavLink>
      <NavLink to="/cameras">Caméras</NavLink>
      <NavLink to="/sensors">Capteurs</NavLink>
      <NavLink to="/alerts">Alertes</NavLink>
      <NavLink to="/logs">Journaux</NavLink>
      <NavLink to="/reseau">Réseau</NavLink>
      <NavLink to="/sante">Santé RPi</NavLink>
      <NavLink to="/blacklist">Liste noire</NavLink>
      <NavLink to="/parametres">Paramètres</NavLink>
    </nav>
  )
}
export default Sidebar