import { useState } from "react"


const Dashboard = () => {
  const [cameraActive, setCameraActive] = useState(true)
  const [doorOpen, setDoorOpen] = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const [showConfirm, setShowConfirm] = useState(false)
  return (
    <>

      <h1 className="titleD">Général</h1>
      <div className="cards-container">
        <div className="card">
          <h3>Caméra</h3>
          <p className="blink">Statut : {cameraActive ? "Actif" : "Inactif"}</p>
          <button 
  className={cameraActive ? "btn-danger" : "btn-success"}
  onClick={() => setShowConfirm(true)}
>
  {cameraActive ? "Désactiver" : "Activer"}
</button>
          {showConfirm && (
            <div>
              <p>Voulez-vous vraiment {cameraActive ? "désactiver" : "activer"} la caméra ?</p>
              <button onClick={() => {
                setCameraActive(!cameraActive)
                setShowConfirm(false)
              }}>Oui</button>
              <button onClick={() => setShowConfirm(false)}>Non</button>
            </div>
          )}
<div className="camera-feed">
  <span>CAM-01 · EN DIRECT</span>
</div>
        </div>
        <div className="card">
          <h3>Capteur de portes ouvert </h3>
          <p>Statut : {doorOpen ? "Ouvert" : "Fermé"}</p>
        </div>
        <div className="card">
          <h3>Alertes </h3>
          <p>Nombre : {alertCount}</p>
        </div >
      </div >
      
    </>
  )
}

export default Dashboard