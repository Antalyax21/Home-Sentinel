import { useState, useEffect } from "react"
import { motion } from "framer-motion"

const etatInitial = {
  enligne: true,
  uptime: "3j 14h 22m",
  cpu: 34,
  ram: 61,
  temperature: 48,
  disque: 42,
  reseauEntrant: "1.2 MB/s",
  reseauSortant: "0.4 MB/s",
  derniereMaj: new Date().toLocaleTimeString("fr-FR"),
}

const couleurBarre = (pct) => {
  if (pct >= 80) return "var(--danger)"
  if (pct >= 60) return "#ffaa00"
  return "var(--accent)"
}

// barre avec animation framer motion sur le remplissage
const BarreMetrique = ({ label, valeur, unite = "%" }) => {
  const couleur = couleurBarre(valeur)
  return (
    <div className="rpi-metrique" style={{ flexDirection: "column", alignItems: "stretch" }}>
      <div className="rpi-metrique-header">
        <span className="rpi-metrique-label">{label}</span>
        <motion.span
          className="rpi-metrique-valeur"
          style={{ color: couleur }}
          key={valeur}
          initial={{ opacity: 0.4, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {valeur}{unite}
        </motion.span>
      </div>
      <div className="rpi-barre-fond">
        <motion.div
          className="rpi-barre-rempli"
          style={{ background: couleur }}
          initial={{ width: 0 }}
          animate={{ width: `${valeur}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

const SanteRpi = () => {
  const [etat, setEtat] = useState(etatInitial)

  const rafraichir = () => {
    setEtat({
      enligne: true,
      uptime: "3j 14h 22m",
      cpu: Math.floor(Math.random() * 60) + 10,
      ram: Math.floor(Math.random() * 40) + 40,
      temperature: Math.floor(Math.random() * 25) + 38,
      disque: Math.floor(Math.random() * 20) + 35,
      reseauEntrant: `${(Math.random() * 3).toFixed(1)} MB/s`,
      reseauSortant: `${(Math.random() * 1).toFixed(1)} MB/s`,
      derniereMaj: new Date().toLocaleTimeString("fr-FR"),
    })
  }

  useEffect(() => {
    const interval = setInterval(rafraichir, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <h1 className="titleD">Sante Raspberry Pi</h1>

      {/* statut + refresh */}
      <motion.div
        className="barre-alertes"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className={`rpi-statut-point ${etat.enligne ? "rpi-enligne" : "rpi-horsligne"}`} />
          <span style={{ color: etat.enligne ? "var(--accent)" : "var(--danger)", fontSize: 13 }}>
            {etat.enligne ? "EN LIGNE" : "HORS LIGNE"}
          </span>
          <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
            · Uptime : {etat.uptime}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>
            Derniere maj : {etat.derniereMaj}
          </span>
          <motion.button
            className="btn-success"
            onClick={rafraichir}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          >
            Rafraichir
          </motion.button>
        </div>
      </motion.div>

      {/* cartes metriques avec stagger */}
      <motion.div
        className="cards-container"
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.1 } } }}
      >
        <motion.div
          className="card"
          variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }}
          whileHover={{ y: -3 }}
        >
          <h3 style={{ color: "var(--accent)", marginBottom: 16, fontSize: 13, letterSpacing: 2 }}>
            PROCESSEUR
          </h3>
          <BarreMetrique label="CPU" valeur={etat.cpu} />
          <BarreMetrique label="Temperature" valeur={etat.temperature} unite="°C" />
        </motion.div>

        <motion.div
          className="card"
          variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }}
          whileHover={{ y: -3 }}
        >
          <h3 style={{ color: "var(--accent)", marginBottom: 16, fontSize: 13, letterSpacing: 2 }}>
            MEMOIRE &amp; STOCKAGE
          </h3>
          <BarreMetrique label="RAM" valeur={etat.ram} />
          <BarreMetrique label="Disque" valeur={etat.disque} />
        </motion.div>

        <motion.div
          className="card"
          variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }}
          whileHover={{ y: -3 }}
        >
          <h3 style={{ color: "var(--accent)", marginBottom: 16, fontSize: 13, letterSpacing: 2 }}>
            RESEAU
          </h3>
          <div className="rpi-metrique">
            <span className="rpi-metrique-label">Entrant</span>
            <motion.span
              className="rpi-metrique-valeur"
              key={etat.reseauEntrant}
              style={{ color: "var(--accent)" }}
              initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {etat.reseauEntrant}
            </motion.span>
          </div>
          <div className="rpi-metrique">
            <span className="rpi-metrique-label">Sortant</span>
            <motion.span
              className="rpi-metrique-valeur"
              key={etat.reseauSortant}
              style={{ color: "var(--text-secondary)" }}
              initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {etat.reseauSortant}
            </motion.span>
          </div>
        </motion.div>
      </motion.div>
    </>
  )
}

export default SanteRpi
