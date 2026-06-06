import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import StatCompteur from "../components/StatCompteur"

// systeme:true = active/inactive piloté par l'état armé, pas par toggle manuel
const camerasMock = [
  { id: 1, nom: "CAM-01", zone: "Salon",   ip: "192.168.1.101", active: true,  resolution: "1080p", fps: 25, systeme: false },
  { id: 2, nom: "CAM-02", zone: "Entrée",  ip: "192.168.1.102", active: false, resolution: "1080p", fps: 25, systeme: true  },
  { id: 3, nom: "CAM-03", zone: "Garage",  ip: "192.168.1.103", active: false, resolution: "720p",  fps: 15, systeme: false },
]

const Cameras = ({ arme }) => {
  const [cameras, setCameras]           = useState(camerasMock)
  const [confirmation, setConfirmation] = useState(null)

  // CAM-02 suit l'état armé automatiquement
  useEffect(() => {
    setCameras(prev => prev.map(c => c.systeme ? { ...c, active: arme } : c))
  }, [arme])

  const demanderToggle = (id) => setConfirmation(id)
  const confirmerToggle = () => {
    setCameras(prev => prev.map(c => c.id === confirmation ? { ...c, active: !c.active } : c))
    setConfirmation(null)
  }

  const actives   = cameras.filter(c => c.active).length
  const inactives = cameras.filter(c => !c.active).length

  return (
    <>
      <h1 className="titleD">Caméras</h1>

      {/* stats */}
      <motion.div
        className="cards-container"
        style={{ paddingBottom: 0 }}
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
      >
        {[
          { label: "TOTAL",    val: cameras.length, color: "var(--text-primary)" },
          { label: "EN LIGNE", val: actives,         color: "var(--accent)"       },
          { label: "HORS LIGNE", val: inactives,     color: inactives > 0 ? "var(--danger)" : "var(--text-primary)" },
        ].map(({ label, val, color }) => (
          <motion.div
            key={label}
            className="card"
            style={{ textAlign: "center" }}
            variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }}
            whileHover={{ y: -3, boxShadow: `0 6px 24px ${color}33` }}
          >
            <p className="stat-etiquette">{label}</p>
            <StatCompteur valeur={val} className="stat-valeur" style={{ color }} />
          </motion.div>
        ))}
      </motion.div>

      {/* grille caméras */}
      <motion.div
        className="cameras-grille"
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.1 } } }}
      >
        {cameras.map(cam => (
          <motion.div
            key={cam.id}
            className={`card camera-card${!cam.active ? " camera-card-inactive" : ""}`}
            variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }}
            whileHover={{ y: -3 }}
          >
            {/* en-tête caméra */}
            <div className="camera-card-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className={`rpi-statut-point ${cam.active ? "rpi-enligne" : "rpi-horsligne"}`} />
                <span style={{ color: "var(--accent)", fontSize: 13, letterSpacing: 2 }}>{cam.nom}</span>
              </div>
              <span className="camera-card-zone">{cam.zone}</span>
            </div>

            {/* feed */}
            <div className={`camera-feed${!cam.active ? " camera-feed-off" : ""}`}>
              {cam.active
                ? <span>{cam.nom} · EN DIRECT</span>
                : <span style={{ color: "var(--danger)", opacity: 0.6 }}>— FLUX COUPÉ —</span>
              }
            </div>

            {/* infos techniques */}
            <div style={{ margin: "12px 0 14px" }}>
              <div className="rpi-metrique">
                <span className="rpi-metrique-label">IP</span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{cam.ip}</span>
              </div>
              <div className="rpi-metrique">
                <span className="rpi-metrique-label">Résolution</span>
                <span style={{ fontSize: 12, color: "var(--accent)" }}>{cam.resolution}</span>
              </div>
              <div className="rpi-metrique">
                <span className="rpi-metrique-label">FPS</span>
                <span style={{ fontSize: 12, color: "var(--accent)" }}>{cam.fps}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {cam.systeme && (
                <span className="camera-badge-systeme">
                  {arme ? "🔒 Auto — armé" : "⏸ Auto — désarmé"}
                </span>
              )}
              {!cam.systeme && <div />}
              <motion.button
                className={cam.active ? "btn-danger" : "btn-success"}
                onClick={() => demanderToggle(cam.id)}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              >
                {cam.active ? "Désactiver" : "Activer"}
              </motion.button>
            </div>

            {/* dialogue confirmation inline */}
            <AnimatePresence>
              {confirmation === cam.id && (
                <motion.div
                  className="dash-confirm"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                    Confirmer {cam.active ? "la désactivation" : "l'activation"} de {cam.nom} ?
                  </p>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <motion.button
                      className="btn-danger"
                      onClick={confirmerToggle}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    >
                      Confirmer
                    </motion.button>
                    <motion.button
                      className="btn-filtre"
                      onClick={() => setConfirmation(null)}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    >
                      Annuler
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </motion.div>
    </>
  )
}

export default Cameras
