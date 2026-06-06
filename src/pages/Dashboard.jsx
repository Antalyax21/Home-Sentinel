import { motion, AnimatePresence } from "framer-motion"
import StatCompteur from "../components/StatCompteur"

// données mock partagées avec la page Cameras
// CAM-02 systeme:true → son état suit arme, pas de toggle manuel
export const CAMERAS_BASE = [
  { id: 1, nom: "CAM-01", zone: "Salon",  ip: "192.168.1.101", active: true,  systeme: false },
  { id: 2, nom: "CAM-02", zone: "Entrée", ip: "192.168.1.102", active: false, systeme: true  },
  { id: 3, nom: "CAM-03", zone: "Garage", ip: "192.168.1.103", active: false, systeme: false },
]

const SENSORS_RESUME = [
  { nom: "Porte d'Entrée",    ouvert: false },
  { nom: "Porte de Garage",   ouvert: false },
  { nom: "Fenêtre Salon 1",   ouvert: false },
  { nom: "Fenêtre Salon 2",   ouvert: false },
]

const alertesNonLues = 3

const Dashboard = ({ arme, onToggleArme }) => {
  // CAM-02 active seulement si système armé
  const CAMERAS = CAMERAS_BASE.map(c => c.systeme ? { ...c, active: arme } : c)
  const camsActives = CAMERAS.filter(c => c.active).length

  return (
    <>
      <h1 className="titleD">Vue d'ensemble</h1>

      {/* bannière lockdown si armé */}
      <AnimatePresence>
        {arme && (
          <motion.div
            className="lockdown-banniere"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <span>⚠ SYSTÈME ARMÉ — Toutes les alertes sont actives</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* stats rapides */}
      <motion.div
        className="cards-container"
        style={{ paddingBottom: 0 }}
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.07 } } }}
      >
        {[
          { label: "CAMÉRAS",  val: camsActives,      color: "var(--accent)"  },
          { label: "CAPTEURS", val: SENSORS_RESUME.length, color: "var(--accent)" },
          { label: "ALERTES",  val: alertesNonLues,   color: alertesNonLues > 0 ? "var(--danger)" : "var(--accent)" },
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

        {/* bouton lockdown comme stat */}
        <motion.div
          className={`card card-lockdown${arme ? " card-lockdown-actif" : ""}`}
          style={{ textAlign: "center", cursor: "pointer" }}
          variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.97 }}
          onClick={onToggleArme}
        >
          <p className="stat-etiquette">{arme ? "ÉTAT" : "ÉTAT"}</p>
          <p className="stat-valeur" style={{ color: arme ? "var(--danger)" : "var(--text-secondary)", fontSize: 18 }}>
            {arme ? "ARMÉ" : "DÉSARMÉ"}
          </p>
          <p style={{ fontSize: 10, marginTop: 6, color: arme ? "var(--danger)" : "var(--accent)", letterSpacing: 1 }}>
            {arme ? "Cliquer pour désarmer" : "Cliquer pour armer"}
          </p>
        </motion.div>
      </motion.div>

      {/* 3 mini caméras */}
      <motion.div
        style={{ padding: "16px 20px 0" }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="stat-etiquette" style={{ marginBottom: 10 }}>CAMÉRAS EN DIRECT</p>
        <div className="cameras-mini-grille">
          {CAMERAS.map((cam, i) => (
            <motion.div
              key={cam.id}
              className={`camera-mini-card${!cam.active ? " camera-inactive" : ""}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 + i * 0.08 }}
              whileHover={{ y: -2 }}
            >
              <div className="camera-mini-header">
                <span className="camera-mini-nom">{cam.nom}</span>
                <span className="camera-mini-zone">{cam.zone}</span>
                <span className={`camera-mini-dot ${cam.active ? "cam-dot-live" : "cam-dot-off"}`} />
              </div>
              <div className="camera-feed camera-feed-mini">
                {cam.active
                  ? <span>{cam.nom} · EN DIRECT</span>
                  : <span style={{ color: "var(--danger)", opacity: 0.6 }}>— HORS LIGNE —</span>
                }
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* capteurs + alertes rapides côte à côte */}
      <motion.div
        className="cards-container"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <motion.div className="card" whileHover={{ y: -2 }}>
          <h3 style={{ color: "var(--accent)", fontSize: 13, letterSpacing: 2, marginBottom: 14 }}>CAPTEURS</h3>
          {SENSORS_RESUME.map((s, i) => (
            <div key={i} className="rpi-metrique">
              <span className="rpi-metrique-label">{s.nom}</span>
              <span style={{ fontSize: 12, color: s.ouvert ? "var(--danger)" : "var(--accent)" }}>
                {s.ouvert ? "OUVERT" : "FERMÉ"}
              </span>
            </div>
          ))}
        </motion.div>

        <motion.div className="card" whileHover={{ y: -2 }}>
          <h3 style={{ color: alertesNonLues > 0 ? "var(--danger)" : "var(--accent)", fontSize: 13, letterSpacing: 2, marginBottom: 14 }}>
            DERNIÈRES ALERTES
          </h3>
          {[
            { type: "Mouvement détecté", zone: "Entrée",  severite: "danger"        },
            { type: "Porte ouverte",     zone: "Garage",  severite: "avertissement" },
            { type: "Caméra déco.",      zone: "CAM-02",  severite: "danger"        },
          ].map((a, i) => (
            <div key={i} className="rpi-metrique">
              <span className="rpi-metrique-label">{a.type}</span>
              <span style={{
                fontSize: 10, letterSpacing: 1,
                color: a.severite === "danger" ? "var(--danger)" : "#ffaa00",
              }}>
                {a.zone}
              </span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </>
  )
}

export default Dashboard
