import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import StatCompteur from "../components/StatCompteur"

// a remplacer par GET /api/reseau depuis fastapi (nmap ou arp-scan)
const appareilsMock = [
  { id: 1, ip: "192.168.1.1",   mac: "A4:2B:8C:11:22:33", nom: "Routeur principal",  type: "NET", connecte: true,  dernierVu: "maintenant",   connu: true  },
  { id: 2, ip: "192.168.1.10",  mac: "B8:27:EB:44:55:66", nom: "Raspberry Pi",       type: "RPI", connecte: true,  dernierVu: "maintenant",   connu: true  },
  { id: 3, ip: "192.168.1.42",  mac: "DC:A6:32:77:88:99", nom: "PC Bureau",          type: "PC",  connecte: true,  dernierVu: "maintenant",   connu: true  },
  { id: 4, ip: "192.168.1.55",  mac: "F0:18:98:AA:BB:CC", nom: "iPad admin",         type: "MOB", connecte: true,  dernierVu: "il y a 2 min", connu: true  },
  { id: 5, ip: "192.168.1.78",  mac: "3C:15:C2:DD:EE:FF", nom: "Telephone Android",  type: "MOB", connecte: false, dernierVu: "il y a 1h",    connu: true  },
  { id: 6, ip: "192.168.1.101", mac: "00:1A:2B:CC:DD:EE", nom: "Camera IP salon",    type: "IOT", connecte: true,  dernierVu: "maintenant",   connu: true  },
  { id: 7, ip: "192.168.1.102", mac: "00:1A:2B:11:22:AB", nom: "Camera IP entree",   type: "IOT", connecte: true,  dernierVu: "maintenant",   connu: true  },
  { id: 8, ip: "192.168.1.200", mac: "??:??:??:??:??:??", nom: "Appareil inconnu",   type: "INC", connecte: true,  dernierVu: "il y a 5 min", connu: false },
]

const couleurType = {
  NET: "var(--accent)",
  RPI: "var(--accent)",
  PC:  "var(--accent)",
  MOB: "#ffaa00",
  IOT: "#ffaa00",
  INC: "var(--danger)",
}

const ligneVariants = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.18, ease: "easeOut" } },
  exit:    { opacity: 0, x: 16,  transition: { duration: 0.12 } },
}

const Reseau = () => {
  const [filtre, setFiltre] = useState("tout")

  const appareils = appareilsMock.filter(a => {
    if (filtre === "connectes") return a.connecte
    if (filtre === "inconnus")  return !a.connu
    return true
  })

  const connectes = appareilsMock.filter(a => a.connecte).length
  const inconnus  = appareilsMock.filter(a => !a.connu).length

  return (
    <>
      <h1 className="titleD">Reseau local</h1>

      {/* stats */}
      <motion.div
        className="cards-container"
        style={{ paddingBottom: 0 }}
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
      >
        {[
          { label: "TOTAL",      val: appareilsMock.length, color: "var(--text-primary)"                         },
          { label: "CONNECTES",  val: connectes,            color: "var(--accent)"                               },
          { label: "INCONNUS",   val: inconnus,             color: inconnus > 0 ? "var(--danger)" : "var(--text-primary)" },
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

      {/* filtres */}
      <div className="barre-alertes">
        <div className="groupe-filtres">
          {[
            { valeur: "tout",      etiquette: "Tous"      },
            { valeur: "connectes", etiquette: "Connectes" },
            { valeur: "inconnus",  etiquette: "Inconnus"  },
          ].map(({ valeur, etiquette }) => (
            <motion.button
              key={valeur}
              className={`btn-filtre${filtre === valeur ? " actif" : ""}`}
              onClick={() => setFiltre(valeur)}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              {etiquette}
            </motion.button>
          ))}
        </div>
      </div>

      {/* liste appareils */}
      <motion.div
        className="liste-alertes"
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
      >
        <AnimatePresence>
          {appareils.map(a => {
            const couleur = a.connu ? (a.connecte ? "var(--accent)" : "var(--border)") : "var(--danger)"
            return (
              <motion.div
                key={a.id}
                variants={ligneVariants}
                layout
                className="ligne-log"
                style={{ borderLeftColor: couleur }}
                whileHover={{ x: 3 }}
              >
                <span className="log-tag" style={{ borderColor: couleurType[a.type], color: couleurType[a.type] }}>
                  {a.type}
                </span>
                <div className="log-corps">
                  <div className="log-en-tete">
                    <span className="log-action">{a.nom}</span>
                    <div className="log-badges">
                      {!a.connu && <span className="log-badge-bf">INCONNU</span>}
                      <span className="log-badge-statut" style={{
                        borderColor: a.connecte ? "var(--accent)" : "var(--border)",
                        color: a.connecte ? "var(--accent)" : "var(--text-secondary)",
                      }}>
                        {a.connecte ? "CONNECTE" : "DECONNECTE"}
                      </span>
                    </div>
                  </div>
                  <div className="log-meta">
                    <span className="log-source">{a.ip}</span>
                    <span style={{ opacity: 0.6 }}>{a.mac}</span>
                    <span className="log-heure">{a.dernierVu}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>
    </>
  )
}

export default Reseau
