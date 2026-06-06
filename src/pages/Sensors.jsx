import { useState } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import StatCompteur from "../components/StatCompteur"

const ligneVariants = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.18, ease: "easeOut" } },
  exit:    { opacity: 0, x: 16,  transition: { duration: 0.12 } },
}

const Sensors = () => {
  const [sensors, setSensors] = useState([
    { id: 1, nom: "Porte d'Entrée",    ouvert: false, actif: true },
    { id: 2, nom: "Porte de Garage",   ouvert: false, actif: true },
    { id: 3, nom: "Fenêtre de Salon 1", ouvert: false, actif: true },
    { id: 4, nom: "Fenêtre de Salon 2", ouvert: false, actif: true },
  ])

  const toggleActif = (id) =>
    setSensors(prev => prev.map(s => s.id === id ? { ...s, actif: !s.actif } : s))

  const toggleTout = () => {
    const nouvelEtat = !sensors.every(s => s.actif)
    setSensors(prev => prev.map(s => ({ ...s, actif: nouvelEtat })))
  }

  const actifs   = sensors.filter(s => s.actif).length
  const inactifs = sensors.filter(s => !s.actif).length

  return (
    <>
      <h1 className="titleD">État des Capteurs</h1>

      {/* stats */}
      <motion.div
        className="cards-container"
        style={{ paddingBottom: 0 }}
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
      >
        {[
          { label: "TOTAL",    val: sensors.length, color: "var(--text-primary)" },
          { label: "ACTIFS",   val: actifs,          color: "var(--accent)"       },
          { label: "INACTIFS", val: inactifs,         color: inactifs > 0 ? "var(--danger)" : "var(--text-primary)" },
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

      {/* bouton global */}
      <div className="barre-alertes">
        <motion.button
          className={sensors.every(s => s.actif) ? "btn-danger" : "btn-success"}
          onClick={toggleTout}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        >
          {sensors.every(s => s.actif) ? "Tout désactiver" : "Tout activer"}
        </motion.button>
      </div>

      {/* liste capteurs */}
      <motion.div
        className="liste-alertes"
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.07 } } }}
      >
        <AnimatePresence>
          {sensors.map(sensor => {
            const couleurEtat = sensor.ouvert ? "var(--danger)" : "var(--accent)"
            const couleurActif = sensor.actif  ? "var(--accent)" : "var(--text-secondary)"
            return (
              <motion.div
                key={sensor.id}
                variants={ligneVariants}
                layout
                className="ligne-alerte"
                style={{ borderLeftColor: sensor.actif ? couleurEtat : "var(--border)" }}
                whileHover={{ x: 3 }}
              >
                <div
                  className="indicateur-alerte"
                  style={{ background: couleurEtat, boxShadow: sensor.actif ? `0 0 6px ${couleurEtat}` : "none" }}
                />

                <div className="corps-alerte">
                  <div className="en-tete-alerte">
                    <span className="type-alerte">{sensor.nom}</span>
                    <span className="badge-alerte" style={{ borderColor: couleurEtat, color: couleurEtat }}>
                      {sensor.ouvert ? "OUVERT" : "FERMÉ"}
                    </span>
                  </div>
                  <div className="meta-alerte">
                    <span className="zone-alerte" style={{ color: couleurActif }}>
                      Surveillance : {sensor.actif ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <motion.button
                  className={sensor.actif ? "btn-danger" : "btn-success"}
                  onClick={() => toggleActif(sensor.id)}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                >
                  {sensor.actif ? "Désactiver" : "Activer"}
                </motion.button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>
    </>
  )
}

export default Sensors
