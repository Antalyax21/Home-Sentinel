import { useState } from 'react'

const Sensors = () => {
  const [sensors, setSensors] = useState([
    { id: 1, nom: "Porte d'Entrée", ouvert: false, actif: true },
    { id: 2, nom: "Porte de Garage", ouvert: false, actif: true },
    { id: 3, nom: "Fenêtre de Salon 1", ouvert: false, actif: true },
    { id: 4, nom: "Fenêtre de salon 2", ouvert: false, actif: true },
  ])

  // un seul capteur 
  const toggleActif = (id) => {
    setSensors(sensors.map(s => // s = element de mon tableau sensors
      s.id === id ? { ...s, actif: !s.actif } : s
    ))
  }

  // tout activer ou desac dun coup 
  const toggleTout = () => {
    const nouvelEtat = !sensors.every(s => s.actif)
    setSensors(sensors.map(s => ({ ...s, actif: nouvelEtat })))
  }

  return (
    <>
      <div>Etat Des Capteurs</div>
      <button
        className={sensors.every(s => s.actif) ? "btn-danger" : "btn-success"}
        onClick={toggleTout}
      >
        {sensors.every(s => s.actif) ? "Tout désactiver" : "Tout activer"}
      </button>

      <div className='EtatCapteur'>
        {sensors.map((sensor) => (
          <div key={sensor.id} className="card">
            <h3>{sensor.nom}</h3>
            <p>Statut : {sensor.ouvert ? "Ouvert" : "Fermé"}</p>
            <p>Surveillance : {sensor.actif ? "Active" : "Inactive"}</p>
            <button
              className={sensor.actif ? "btn-danger" : "btn-success"}
              onClick={() => toggleActif(sensor.id)}
            >
              {sensor.actif ? "Désactiver" : "Activer"}
            </button>
          </div>
        ))}
      </div>
    </>
  )
}

export default Sensors