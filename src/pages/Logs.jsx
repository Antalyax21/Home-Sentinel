import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import StatCompteur from "../components/StatCompteur"

const PAR_PAGE = 20
const TROIS_MOIS_MS = 3 * 30 * 24 * 60 * 60 * 1000

const logsMock = [
  { id: 1,  categorie: "ssh",       action: "Connexion SSH acceptee",            source: "192.168.1.42",    pays: "—",      port: 22,   utilisateur: "admin",   statut: "succes",  horodatage: "2026-06-05 09:14:02" },
  { id: 2,  categorie: "externe",   action: "Acces externe detecte",             source: "85.204.12.77",    pays: "Maroc",  port: 443,  utilisateur: "inconnu", statut: "bloque",  horodatage: "2026-06-05 08:52:41" },
  { id: 3,  categorie: "admin",     action: "Tentative connexion tablette",      source: "iPad · Wi-Fi",    pays: "—",      port: 443,  utilisateur: "inconnu", statut: "echec",   horodatage: "2026-06-05 08:30:19" },
  { id: 4,  categorie: "raspberry", action: "Connexion Raspberry Pi",            source: "192.168.1.10",    pays: "—",      port: 22,   utilisateur: "pi",      statut: "succes",  horodatage: "2026-06-05 07:58:55" },
  { id: 5,  categorie: "ssh",       action: "Tentative SSH echouee",             source: "45.33.32.156",    pays: "USA",    port: 22,   utilisateur: "root",    statut: "echec",   horodatage: "2026-06-05 07:45:03" },
  { id: 6,  categorie: "ssh",       action: "Tentative SSH echouee",             source: "45.33.32.156",    pays: "USA",    port: 22,   utilisateur: "root",    statut: "echec",   horodatage: "2026-06-05 07:45:01" },
  { id: 7,  categorie: "ssh",       action: "Tentative SSH echouee",             source: "45.33.32.156",    pays: "USA",    port: 22,   utilisateur: "admin",   statut: "echec",   horodatage: "2026-06-05 07:44:58" },
  { id: 8,  categorie: "systeme",   action: "Demarrage service surveillance",    source: "localhost",        pays: "—",      port: 0,    utilisateur: "systeme", statut: "succes",  horodatage: "2026-06-05 07:00:00" },
  { id: 9,  categorie: "admin",     action: "Connexion tablette admin",          source: "iPad · Wi-Fi",    pays: "—",      port: 443,  utilisateur: "admin",   statut: "succes",  horodatage: "2026-06-04 22:10:44" },
  { id: 10, categorie: "externe",   action: "Scan de ports detecte",             source: "103.21.44.0",     pays: "Chine",  port: 0,    utilisateur: "inconnu", statut: "bloque",  horodatage: "2026-06-04 21:33:17" },
  { id: 11, categorie: "raspberry", action: "Redemarrage Raspberry Pi",          source: "192.168.1.10",    pays: "—",      port: 0,    utilisateur: "pi",      statut: "succes",  horodatage: "2026-06-04 20:05:30" },
  { id: 12, categorie: "ssh",       action: "Connexion SSH acceptee",            source: "192.168.1.42",    pays: "—",      port: 22,   utilisateur: "admin",   statut: "succes",  horodatage: "2026-06-04 18:44:12" },
  { id: 13, categorie: "systeme",   action: "Sauvegarde automatique",            source: "localhost",        pays: "—",      port: 0,    utilisateur: "systeme", statut: "succes",  horodatage: "2026-06-04 18:00:00" },
  { id: 14, categorie: "externe",   action: "Tentative acces API",               source: "212.58.226.10",   pays: "UK",     port: 8080, utilisateur: "inconnu", statut: "bloque",  horodatage: "2026-06-04 15:22:09" },
  { id: 15, categorie: "admin",     action: "Tentative connexion tablette",      source: "Android · Wi-Fi", pays: "—",      port: 443,  utilisateur: "inconnu", statut: "echec",   horodatage: "2026-06-04 14:10:55" },
  { id: 16, categorie: "systeme",   action: "Mise a jour capteurs",              source: "localhost",        pays: "—",      port: 0,    utilisateur: "systeme", statut: "succes",  horodatage: "2026-06-04 12:00:01" },
  // anciens logs > 3 mois → pour tester la banniere de suppression
  { id: 17, categorie: "ssh",       action: "Connexion SSH acceptee",            source: "192.168.1.42",    pays: "—",      port: 22,   utilisateur: "admin",   statut: "succes",  horodatage: "2026-02-14 10:22:00" },
  { id: 18, categorie: "externe",   action: "Tentative acces externe",           source: "91.108.4.0",      pays: "Russie", port: 443,  utilisateur: "inconnu", statut: "bloque",  horodatage: "2026-02-01 03:15:44" },
  { id: 19, categorie: "ssh",       action: "Tentative SSH echouee",             source: "178.62.55.4",     pays: "UK",     port: 22,   utilisateur: "root",    statut: "echec",   horodatage: "2026-01-28 22:08:12" },
  { id: 20, categorie: "systeme",   action: "Sauvegarde automatique",            source: "localhost",        pays: "—",      port: 0,    utilisateur: "systeme", statut: "succes",  horodatage: "2026-01-15 18:00:00" },
]

const infoCategorie = {
  ssh:       { tag: "SSH" },
  externe:   { tag: "EXT" },
  admin:     { tag: "ADM" },
  raspberry: { tag: "RPI" },
  systeme:   { tag: "SYS" },
}

const couleurStatut = { succes: "var(--accent)", echec: "var(--danger)", bloque: "#ffaa00" }
const labelStatut   = { succes: "SUCCES",        echec: "ECHEC",         bloque: "BLOQUE"  }

const exporterCsv = (logs, nomFichier = "home-sentinel-logs.csv") => {
  const entetes = "id,categorie,action,source,pays,port,utilisateur,statut,horodatage"
  const lignes = logs.map(l =>
    `${l.id},${l.categorie},"${l.action}",${l.source},${l.pays},${l.port},${l.utilisateur},${l.statut},${l.horodatage}`
  )
  const blob = new Blob([[entetes, ...lignes].join("\n")], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = nomFichier
  a.click()
  URL.revokeObjectURL(url)
}

const ligneVariants = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.18, ease: "easeOut" } },
  exit:    { opacity: 0, x: 16,  transition: { duration: 0.12 } },
}

const LigneLog = ({ log, bruteforce }) => {
  const couleur = couleurStatut[log.statut]
  const { tag } = infoCategorie[log.categorie]

  return (
    <motion.div
      variants={ligneVariants}
      layout
      className={`ligne-log${bruteforce ? " log-bruteforce" : ""}`}
      style={{ borderLeftColor: couleur }}
      whileHover={{ x: 3 }}
    >
      <span className="log-tag">{tag}</span>
      <div className="log-corps">
        <div className="log-en-tete">
          <span className="log-action">{log.action}</span>
          <div className="log-badges">
            {bruteforce && <span className="log-badge-bf">BRUTEFORCE</span>}
            <span className="log-badge-statut" style={{ borderColor: couleur, color: couleur }}>
              {labelStatut[log.statut]}
            </span>
          </div>
        </div>
        <div className="log-meta">
          <span className="log-source">{log.source}</span>
          {log.pays !== "—" && <span className="log-pays">{log.pays}</span>}
          {log.port > 0 && <span className="log-port">:{log.port}</span>}
          <span className="log-utilisateur">· {log.utilisateur}</span>
          <span className="log-heure">{log.horodatage}</span>
        </div>
      </div>
    </motion.div>
  )
}

const Logs = () => {
  const [logs, setLogs] = useState(logsMock)
  const [searchParams] = useSearchParams()
  const [filtreCategorie, setFiltreCategorie] = useState("tout")
  const [filtreStatut, setFiltreStatut]       = useState("tout")
  const [recherche, setRecherche] = useState(() => searchParams.get("q") || "")
  const [page, setPage] = useState(1)
  const [csvAnciensTelecharge, setCsvAnciensTelecharge] = useState(false)

  useEffect(() => {
    const q = searchParams.get("q")
    if (q) setRecherche(q)
  }, [searchParams])

  const maintenant    = new Date()
  const logsAnciens   = logs.filter(l => maintenant - new Date(l.horodatage) > TROIS_MOIS_MS)
  const ipsBruteforce = Object.entries(
    logs.filter(l => l.statut === "echec")
      .reduce((acc, l) => { acc[l.source] = (acc[l.source] || 0) + 1; return acc }, {})
  ).filter(([, count]) => count >= 2).map(([ip]) => ip)

  const total   = logs.length
  const succes  = logs.filter(l => l.statut === "succes").length
  const echecs  = logs.filter(l => l.statut === "echec").length
  const bloques = logs.filter(l => l.statut === "bloque").length

  const logsFiltres = logs
    .filter(l => filtreCategorie === "tout" || l.categorie === filtreCategorie)
    .filter(l => filtreStatut   === "tout" || l.statut    === filtreStatut)
    .filter(l => {
      if (!recherche) return true
      const q = recherche.toLowerCase()
      return (
        l.source.toLowerCase().includes(q)      ||
        l.utilisateur.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q)      ||
        l.pays.toLowerCase().includes(q)
      )
    })

  const totalPages = Math.ceil(logsFiltres.length / PAR_PAGE)
  const logsPage   = logsFiltres.slice((page - 1) * PAR_PAGE, page * PAR_PAGE)

  const changerFiltreCategorie = (v) => { setFiltreCategorie(v); setPage(1) }
  const changerFiltreStatut    = (v) => { setFiltreStatut(v);    setPage(1) }
  const changerRecherche       = (v) => { setRecherche(v);       setPage(1) }

  const telechargerAnciensEtSignaler = () => {
    exporterCsv(logsAnciens, "home-sentinel-logs-anciens.csv")
    setCsvAnciensTelecharge(true)
  }

  const supprimerAnciens = () => {
    setLogs(prev => prev.filter(l => maintenant - new Date(l.horodatage) <= TROIS_MOIS_MS))
    setCsvAnciensTelecharge(false)
  }

  return (
    <>
      <h1 className="titleD">Journaux</h1>

      {/* banniere anciens logs */}
      <AnimatePresence>
        {logsAnciens.length > 0 && (
          <motion.div
            className="log-banniere-anciens"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="log-banniere-texte">
              <span className="log-banniere-icone">!</span>
              <div>
                <strong>{logsAnciens.length} journal{logsAnciens.length > 1 ? "x" : ""} de plus de 3 mois</strong>
                <p>Telechargez d'abord le CSV pour archiver avant de supprimer.</p>
              </div>
            </div>
            <div className="log-banniere-actions">
              <motion.button
                className={csvAnciensTelecharge ? "btn-success" : "btn-danger"}
                onClick={telechargerAnciensEtSignaler}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              >
                {csvAnciensTelecharge ? "CSV telecharge" : "Telecharger CSV"}
              </motion.button>
              <motion.button
                className="btn-danger"
                onClick={supprimerAnciens}
                disabled={!csvAnciensTelecharge}
                whileHover={csvAnciensTelecharge ? { scale: 1.04 } : {}}
                whileTap={csvAnciensTelecharge ? { scale: 0.96 } : {}}
              >
                Supprimer les anciens
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* stats */}
      <motion.div
        className="cards-container"
        style={{ paddingBottom: 0 }}
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
      >
        {[
          { label: "TOTAL",   val: total,   color: "var(--text-primary)" },
          { label: "SUCCES",  val: succes,  color: "var(--accent)"       },
          { label: "ECHECS",  val: echecs,  color: "var(--danger)"       },
          { label: "BLOQUES", val: bloques, color: "#ffaa00"             },
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

      {/* barre recherche + export */}
      <div className="barre-alertes" style={{ paddingBottom: 0 }}>
        <input
          className="log-recherche"
          type="text"
          placeholder="Rechercher par IP, utilisateur, action..."
          value={recherche}
          onChange={e => changerRecherche(e.target.value)}
        />
        <motion.button
          className="btn-success"
          onClick={() => exporterCsv(logsFiltres)}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        >
          Exporter CSV
        </motion.button>
      </div>

      {/* filtres categorie + statut */}
      <div className="barre-alertes">
        <div className="groupe-filtres">
          {[
            { valeur: "tout",      etiquette: "Tout"      },
            { valeur: "ssh",       etiquette: "SSH"       },
            { valeur: "externe",   etiquette: "Externe"   },
            { valeur: "admin",     etiquette: "Admin"     },
            { valeur: "raspberry", etiquette: "Raspberry" },
            { valeur: "systeme",   etiquette: "Systeme"   },
          ].map(({ valeur, etiquette }) => (
            <motion.button
              key={valeur}
              className={`btn-filtre${filtreCategorie === valeur ? " actif" : ""}`}
              onClick={() => changerFiltreCategorie(valeur)}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              {etiquette}
            </motion.button>
          ))}
        </div>
        <div className="groupe-filtres">
          {[
            { valeur: "tout",   etiquette: "Tous"    },
            { valeur: "succes", etiquette: "Succes"  },
            { valeur: "echec",  etiquette: "Echecs"  },
            { valeur: "bloque", etiquette: "Bloques" },
          ].map(({ valeur, etiquette }) => (
            <motion.button
              key={valeur}
              className={`btn-filtre${filtreStatut === valeur ? " actif" : ""}`}
              onClick={() => changerFiltreStatut(valeur)}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              {etiquette}
            </motion.button>
          ))}
        </div>
      </div>

      {/* liste avec stagger */}
      <motion.div
        className="liste-alertes"
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.04 } } }}
      >
        <AnimatePresence>
          {logsPage.length === 0 ? (
            <motion.div className="alertes-vides" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Aucun journal trouve
            </motion.div>
          ) : (
            logsPage.map(log => (
              <LigneLog
                key={log.id}
                log={log}
                bruteforce={ipsBruteforce.includes(log.source)}
              />
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* pagination */}
      {totalPages > 1 && (
        <div className="log-pagination">
          <motion.button
            className="btn-filtre"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            whileHover={page !== 1 ? { scale: 1.05 } : {}}
            whileTap={page !== 1 ? { scale: 0.95 } : {}}
          >
            &lt; Prec
          </motion.button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
            .reduce((acc, n, i, arr) => {
              if (i > 0 && n - arr[i - 1] > 1) acc.push("...")
              acc.push(n)
              return acc
            }, [])
            .map((n, i) =>
              n === "..." ? (
                <span key={`sep-${i}`} className="log-pagination-sep">...</span>
              ) : (
                <motion.button
                  key={n}
                  className={`btn-filtre${page === n ? " actif" : ""}`}
                  onClick={() => setPage(n)}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                >
                  {n}
                </motion.button>
              )
            )}

          <motion.button
            className="btn-filtre"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            whileHover={page !== totalPages ? { scale: 1.05 } : {}}
            whileTap={page !== totalPages ? { scale: 0.95 } : {}}
          >
            Suiv &gt;
          </motion.button>

          <span className="log-pagination-info">
            {(page - 1) * PAR_PAGE + 1}–{Math.min(page * PAR_PAGE, logsFiltres.length)} sur {logsFiltres.length}
          </span>
        </div>
      )}
    </>
  )
}

export default Logs
