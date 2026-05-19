import { NavLink } from 'react-router-dom'

function Sidebar() {
  return (
    <nav className="sidebar">
      <NavLink to="/">Dashboard</NavLink>
      <NavLink to="/sensors">Capteurs</NavLink>
      <NavLink to="/alerts">Alertes</NavLink>
    </nav>
  )
}
export default Sidebar