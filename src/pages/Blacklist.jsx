import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import StatCompteur from "../components/StatCompteur"

// le vrai blocage se fera cote fastapi (iptables / firewall)
// cette page gere juste la liste

const blacklistMock = [
  { id: 1, ip: "45.33.32.156",  raison: "Bruteforce SSH detecte",  dateAjout: "2026-06-05 07:45:03" },
  { id: 2, ip: "103.21.44.0",   raison: "Scan de ports",           dateAjout: "2026-06-04 21:33:17" },
  { id: 3, ip: "212.58.226.10", raison: "Tentative acces API",     dateAjout: "2026-06-04 15:22:09" },
  { id: 4, ip: "91.108.4.0/24", raison: "Plage Russie suspecte",   dateAjout: "2026-02-01 03:15:44" },
]

const validerIp = (ip) => /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(ip.trim())

const ligneVariants = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.18, ease: "easeOut" } },
  exit:    { opacity: 0, x: 20,  transition: { duration: 0.15 } },
}

const Blacklist = () => {
  const [liste, setListe]           = useState(blacklistMock)
  const [nouvelleIp, setNouvelleIp] = useState("")
  const [raison, setRaison]         = useState("")
  const [erreur, setErreur]         = useState("")

  const ajouter = () => {
    const ip = nouvelleIp.trim()
    if (!validerIp(ip)) { setErreur("Format invalide — ex: 192.168.1.1 ou 10.0.0.0/24"); return }
    if (liste.find(e => e.ip === ip)) { setErreur("IP deja dans la liste"); return }

    setListe(prev => [{
      id: Date.now(),
      ip,
      raison: raison.trim() || "Ajout manuel",
      dateAjout: new Date().toLocaleString("fr-FR"),
    }, ...prev])
    setNouvelleIp("")
    setRaison("")
    setErreur("")
  }

  const supprimer = (id) => setListe(prev => prev.filter(e => e.id !== id))

  const nbCidr = liste.filter(e => e.ip.includes("/")).length

  return (
    <>
      <h1 className="titleD">Liste noire</h1>

      {/* stats */}
      <motion.div
        className="cards-container"
        style={{ paddingBottom: 0 }}
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
      >
        {[
          { label: "IPs BLOQUEES", val: liste.length, color: "var(--danger)" },
          { label: "PLAGES CIDR",  val: nbCidr,       color: "#ffaa00"       },
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

      {/* formulaire ajout */}
      <motion.div
        className="bl-formulaire"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="bl-champs">
          <input
            className="log-recherche"
            type="text"
            placeholder="IP ou plage CIDR — ex: 45.33.32.156 ou 10.0.0.0/24"
            value={nouvelleIp}
            onChange={e => { setNouvelleIp(e.target.value); setErreur("") }}
            onKeyDown={e => e.key === "Enter" && ajouter()}
          />
          <input
            className="log-recherche"
            type="text"
            placeholder="Raison (optionnel)"
            value={raison}
            onChange={e => setRaison(e.target.value)}
            onKeyDown={e => e.key === "Enter" && ajouter()}
          />
          <motion.button
            className="btn-danger"
            onClick={ajouter}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          >
            Bloquer
          </motion.button>
        </div>
        <AnimatePresence>
          {erreur && (
            <motion.p
              className="bl-erreur"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {erreur}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* liste des ips */}
      <motion.div
        className="liste-alertes"
        style={{ marginTop: 16 }}
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
      >
        <AnimatePresence>
          {liste.length === 0 ? (
            <motion.div className="alertes-vides" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Aucune IP bloquee
            </motion.div>
          ) : (
            liste.map(entree => (
              <motion.div
                key={entree.id}
                variants={ligneVariants}
                layout
                className="ligne-log"
                style={{ borderLeftColor: "var(--danger)" }}
                whileHover={{ x: 3 }}
              >
                <span className="log-tag" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
                  BLK
                </span>
                <div className="log-corps">
                  <div className="log-en-tete">
                    <span className="log-action" style={{ color: "var(--danger)" }}>{entree.ip}</span>
                  </div>
                  <div className="log-meta">
                    <span>{entree.raison}</span>
                    <span className="log-heure">{entree.dateAjout}</span>
                  </div>
                </div>
                <motion.button
                  className="btn-supprimer-alerte"
                  onClick={() => supprimer(entree.id)}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                >
                  Debloquer
                </motion.button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}

export default Blacklist
