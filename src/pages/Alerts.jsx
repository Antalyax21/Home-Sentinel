import { useState } from "react"

// donnees MOCK (a remplacer plus tard avec fastapi)
// chaque alerte a un id, un type ,une zone , une sévérité ou po, un
// horodatage, et un état si lu ou pas 

const alertesMock = [
  { id: 1, type: "Mouvement détecté", zone: "Entrée principale", severite: "danger", horodatage: "2026-06-04 08:42:11", lue: false },
  { id: 2, type: "Porte ouverte", zone: "Porte arrière", severite: "avertissement", horodatage: "2026-06-04 07:15:03", lue: false },
  { id: 3, type: "Caméra déconnectée", zone: "CAM-02 · Garage", severite: "danger", horodatage: "2026-06-04 06:58:44", lue: false },
  { id: 4, type: "Mouvement détecté", zone: "Jardin", severite: "avertissement", horodatage: "2026-06-03 23:30:19", lue: true },
  { id: 5, type: "Capteur hors ligne", zone: "Fenêtre cuisine", severite: "info", horodatage: "2026-06-03 21:10:55", lue: true },
  { id: 6, type: "Tentative d'accès", zone: "Serrure connectée", severite: "danger", horodatage: "2026-06-03 18:44:02", lue: true },
  { id: 7, type: "Batterie faible", zone: "Capteur salon", severite: "info", horodatage: "2026-06-03 14:22:37", lue: true },
]

const etiquetteSeverite = { danger: "CRITIQUE", avertissement: "AVERTISSEMENT", info: "INFO" }

// couleur selon la sévérité du truc (rouge, orange, vert)
const couleurSeverite = { danger: "var(--danger)", avertissement: "#ffaa00", info: "var(--accent)" }

const LigneAlerte = ({ alerte, onLire, onSupprimer }) => {
  const couleur = couleurSeverite[alerte.severite]

  return (
    //  classe "alerte-lue" rend la ligne semi-transparente si déjà lu
    // bordure gauche change de couleur selon la sévérité
    <div className={`ligne-alerte${alerte.lue ? " alerte-lue" : ""}`} style={{ borderLeftColor: couleur }}>

     
      <div className="indicateur-alerte" style={{ background: couleur, boxShadow: `0 0 6px ${couleur}` }} />

   
      <div className="corps-alerte">

     
        <div className="en-tete-alerte">
          <span className="type-alerte">{alerte.type}</span>
          <span className="badge-alerte" style={{ borderColor: couleur, color: couleur }}>
            {etiquetteSeverite[alerte.severite]}
          </span>
        </div>

      
        <div className="meta-alerte">
          <span className="zone-alerte">{alerte.zone}</span>
          <span className="heure-alerte">{alerte.horodatage}</span>
        </div>
      </div>

     
      <div className="actions-alerte">
        {/* que si l'alerte n'est pas encore lue */}
        {!alerte.lue && (
          <button className="btn-lire" onClick={() => onLire(alerte.id)}>Marquer lu</button>
        )}
        <button className="btn-supprimer-alerte" onClick={() => onSupprimer(alerte.id)}>Supprimer</button>
      </div>
    </div>
  )
}


// page Alertes

const Alertes = () => {

  // liste des alertes qui sont afficher et initialisé avec les donnees mock
  const [alertes, setAlertes] = useState(alertesMock)

  // Filtre actif "tout"  "danger"  "avertissement"  "info"
  const [filtre, setFiltre] = useState("tout")

  // Marque alerte comme lu en cherchant son id dans le tab
  const marquerLue = (id) => setAlertes(prev => prev.map(a => a.id === id ? { ...a, lue: true } : a))

  // supp l'alerte du tab 
  const supprimer = (id) => setAlertes(prev => prev.filter(a => a.id !== id))

  // pour gagner du temps marque tt les alertes comme lu d'un coup
  const toutMarquerLu = () => setAlertes(prev => prev.map(a => ({ ...a, lue: true })))

  // vide la liste effaceééé
  const toutEffacer = () => setAlertes([])

  // calcul des compteurs affichés dans les cartes de stats
  const nonLues = alertes.filter(a => !a.lue).length
  const critiques = alertes.filter(a => a.severite === "danger").length
  const avertissements = alertes.filter(a => a.severite === "avertissement").length

  // si un filtre est actif, on ne garde que les alertes de cette sévérité
  const alertesFiltrees = filtre === "tout" ? alertes : alertes.filter(a => a.severite === filtre)

  return (
    <>
      <h1 className="titleD">Alertes</h1>

      <div className="cards-container" style={{ paddingBottom: 0 }}>
        <div className="card" style={{ textAlign: "center" }}>
          <p className="stat-etiquette">TOTAL</p>
          <p className="stat-valeur">{alertes.length}</p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <p className="stat-etiquette">NON LUES</p>
          <p className="stat-valeur" style={{ color: "var(--accent)" }}>{nonLues}</p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <p className="stat-etiquette">CRITIQUES</p>
          <p className="stat-valeur" style={{ color: "var(--danger)" }}>{critiques}</p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <p className="stat-etiquette">AVERTISSEMENTS</p>
          <p className="stat-valeur" style={{ color: "#ffaa00" }}>{avertissements}</p>
        </div>
      </div>


      <div className="barre-alertes">

        {/* filtre pour eviter la repetition */}
        <div className="groupe-filtres">
          {[
            { valeur: "tout", etiquette: "Tout" },
            { valeur: "danger", etiquette: "Critiques" },
            { valeur: "avertissement", etiquette: "Avertissements" },
            { valeur: "info", etiquette: "Infos" },
          ].map(({ valeur, etiquette }) => (
            <button
              key={valeur}
              // La classe "actif" met en surbrillance le filtre sélectionné
              className={`btn-filtre${filtre === valeur ? " actif" : ""}`}
              onClick={() => setFiltre(valeur)}
            >
              {etiquette}
            </button>
          ))}
        </div>

        
        <div className="groupe-actions">
          <button className="btn-success" onClick={toutMarquerLu} disabled={nonLues === 0}>
            Tout marquer lu
          </button>
          <button className="btn-danger" onClick={toutEffacer} disabled={alertes.length === 0}>
            Tout effacer
          </button>
        </div>
      </div>

    
      <div className="liste-alertes">
        {/* si la liste filtrée est vide, on affiche un message */}
        {alertesFiltrees.length === 0 ? (
          <div className="alertes-vides">Aucune alerte</div>
        ) : (
          // sinon on affiche une ligneAlerte par alerte
          alertesFiltrees.map(alerte => (
            <LigneAlerte
              key={alerte.id}
              alerte={alerte}
              onLire={marquerLue}
              onSupprimer={supprimer}
            />
          ))
        )}
      </div>
    </>
  )
}

export default Alertes
