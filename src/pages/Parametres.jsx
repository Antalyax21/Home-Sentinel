import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import bcrypt from "bcryptjs"
import { lireSettings, sauverSettings, DEFAULTS } from "../utils/settings"

const champ = (label, name, type, val, onChange, extra = {}) => (
  <div className="param-ligne">
    <label className="param-label">{label}</label>
    <input
      className="param-input"
      type={type}
      name={name}
      value={val}
      onChange={e => onChange(name, e.target.value)}
      {...extra}
    />
  </div>
)

const Section = ({ titre, children }) => (
  <motion.div
    className="card param-section"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <h3 className="param-titre-section">{titre}</h3>
    {children}
  </motion.div>
)

// ── Sous-section : hachage bcrypt ────────────────────────────────────────
const SectionBcrypt = ({ saltRounds, onSaltChange }) => {
  const [texte,   setTexte]   = useState("")
  const [hash,    setHash]    = useState("")
  const [duree,   setDuree]   = useState(null)
  const [calcul,  setCalcul]  = useState(false)
  const [verifIn, setVerifIn] = useState("")
  const [verifOk, setVerifOk] = useState(null)
  const copieRef = useRef(null)

  const hasher = async () => {
    if (!texte) return
    setCalcul(true); setHash(""); setVerifOk(null)
    const t0 = performance.now()
    const h = await bcrypt.hash(texte, saltRounds)
    setDuree(((performance.now() - t0) / 1000).toFixed(2))
    setHash(h)
    setCalcul(false)
  }

  const verifier = async () => {
    if (!verifIn || !hash) return
    const ok = await bcrypt.compare(verifIn, hash)
    setVerifOk(ok)
  }

  const copier = () => {
    navigator.clipboard.writeText(hash)
    if (copieRef.current) {
      copieRef.current.textContent = "Copié !"
      setTimeout(() => { if (copieRef.current) copieRef.current.textContent = "Copier" }, 1500)
    }
  }

  return (
    <Section titre="Hachage bcrypt — démonstration">
      <p className="param-desc">
        En production, le backend (FastAPI + bcrypt Python) hashe et stocke les codes.
        Ici : implémentation JS identique pour valider le concept.
      </p>

      <div className="param-ligne">
        <label className="param-label">Cost factor (salt rounds)</label>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input
            className="param-input" type="range" min={4} max={14}
            value={saltRounds} onChange={e => onSaltChange(Number(e.target.value))}
            style={{ flex: 1, accentColor: "var(--accent)" }}
          />
          <span style={{ color: "var(--accent)", fontSize: 14, minWidth: 20 }}>{saltRounds}</span>
        </div>
      </div>
      <p className="param-desc" style={{ marginTop: -4 }}>
        2^{saltRounds} = {(2 ** saltRounds).toLocaleString("fr-FR")} itérations · temps ≈ {duree ?? "?"} s
      </p>

      <div className="param-ligne">
        <label className="param-label">Texte à hacher</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="param-input" type="text" placeholder="ex: 1234 ou mon_mot_de_passe"
            value={texte} onChange={e => setTexte(e.target.value)}
            onKeyDown={e => e.key === "Enter" && hasher()}
          />
          <motion.button
            className="btn-success" onClick={hasher}
            disabled={calcul || !texte}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            style={{ flexShrink: 0 }}
          >
            {calcul ? "Calcul…" : "Hacher"}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {hash && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="param-hash-bloc">
              <code className="param-hash-code">{hash}</code>
              <button className="param-btn-copier" onClick={copier} ref={copieRef}>Copier</button>
            </div>
            <p className="param-desc" style={{ color: "var(--text-secondary)", marginTop: 6 }}>
              Format Modular Crypt : <strong style={{ color: "var(--accent)" }}>$2b$</strong>{saltRounds}$…
              — algorithme Blowfish, résistant aux attaques GPU
            </p>

            <div className="param-ligne" style={{ marginTop: 12 }}>
              <label className="param-label">Vérifier un texte contre ce hash</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="param-input" type="text" placeholder="Retaper le texte…"
                  value={verifIn} onChange={e => { setVerifIn(e.target.value); setVerifOk(null) }}
                />
                <motion.button
                  className="btn-filtre" onClick={verifier}
                  disabled={!verifIn}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  style={{ flexShrink: 0 }}
                >
                  Vérifier
                </motion.button>
              </div>
            </div>
            {verifOk !== null && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ color: verifOk ? "var(--accent)" : "var(--danger)", fontSize: 13, marginTop: 6 }}
              >
                {verifOk ? "✓ Hash valide — textes correspondent" : "✗ Hash invalide — textes différents"}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  )
}

// ── Page principale ──────────────────────────────────────────────────────
const Parametres = () => {
  const [settings,  setSettings]  = useState(lireSettings)
  const [sauvegarde, setSauvegarde] = useState(false)
  const [erreurs,   setErreurs]   = useState({})

  const modifier = (name, val) => {
    setSettings(s => ({ ...s, [name]: val }))
    setErreurs(e => { const n = { ...e }; delete n[name]; return n })
  }

  const valider = () => {
    const e = {}
    if (!/^\d{4}$/.test(settings.pinUser))  e.pinUser  = "4 chiffres requis"
    if (!/^\d{6}$/.test(settings.pinAdmin)) e.pinAdmin = "6 chiffres requis"
    if (settings.delaiEntree < 10 || settings.delaiEntree > 300)  e.delaiEntree = "Entre 10 et 300 s"
    if (settings.delaiSortie < 5  || settings.delaiSortie > 120)  e.delaiSortie = "Entre 5 et 120 s"
    if (settings.delaiDim    < 15 || settings.delaiDim    > 300)  e.delaiDim    = "Entre 15 et 300 s"
    if (settings.delaiVerrou < settings.delaiDim + 5)             e.delaiVerrou = `Minimum délai dim + 5 s (${Number(settings.delaiDim) + 5} s)`
    return e
  }

  const sauver = () => {
    const e = valider()
    if (Object.keys(e).length > 0) { setErreurs(e); return }
    sauverSettings({
      ...settings,
      delaiEntree:  Number(settings.delaiEntree),
      delaiSortie:  Number(settings.delaiSortie),
      delaiDim:     Number(settings.delaiDim),
      delaiVerrou:  Number(settings.delaiVerrou),
    })
    setSauvegarde(true)
    setTimeout(() => setSauvegarde(false), 2500)
  }

  const reinitialiser = () => {
    setSettings({ ...DEFAULTS })
    setErreurs({})
  }

  const champNum = (label, name, min, max, unite = "s") => (
    <div key={name} className="param-ligne">
      <label className="param-label">{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          className={`param-input${erreurs[name] ? " param-erreur" : ""}`}
          type="number" min={min} max={max}
          value={settings[name]}
          onChange={e => modifier(name, e.target.value)}
          style={{ width: 90 }}
        />
        <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{unite}</span>
      </div>
      {erreurs[name] && <p className="param-msg-erreur">{erreurs[name]}</p>}
    </div>
  )

  return (
    <>
      <h1 className="titleD">Paramètres</h1>

      <div className="param-grille">

        {/* ── Codes d'accès ─────────────────────────────────── */}
        <Section titre="Codes d'accès">
          <div className="param-ligne">
            <label className="param-label">PIN tablette USER (4 chiffres)</label>
            <input
              className={`param-input${erreurs.pinUser ? " param-erreur" : ""}`}
              type="password" maxLength={4} placeholder="••••"
              value={settings.pinUser}
              onChange={e => modifier("pinUser", e.target.value)}
              style={{ letterSpacing: 6, width: 120 }}
            />
            {erreurs.pinUser && <p className="param-msg-erreur">{erreurs.pinUser}</p>}
          </div>
          <div className="param-ligne">
            <label className="param-label">PIN tableau de bord ADMIN (6 chiffres)</label>
            <input
              className={`param-input${erreurs.pinAdmin ? " param-erreur" : ""}`}
              type="password" maxLength={6} placeholder="••••••"
              value={settings.pinAdmin}
              onChange={e => modifier("pinAdmin", e.target.value)}
              style={{ letterSpacing: 6, width: 120 }}
            />
            {erreurs.pinAdmin && <p className="param-msg-erreur">{erreurs.pinAdmin}</p>}
          </div>
          <p className="param-desc">
            En production : stockage bcrypt côté backend FastAPI. Voir section ci-dessous.
          </p>
        </Section>

        {/* ── Délais système ────────────────────────────────── */}
        <Section titre="Délais système">
          {champNum("Délai d'entrée — alarme si code non saisi", "delaiEntree", 10, 300)}
          {champNum("Délai de sortie — temps pour quitter après armement", "delaiSortie", 5, 120)}
          {champNum("Dim auto — assombrissement tablette USER", "delaiDim", 15, 300)}
          {champNum("Verrouillage auto — inactivité tablette USER", "delaiVerrou", 20, 600)}
        </Section>

      </div>

      {/* ── Bcrypt ────────────────────────────────────────────────────────── */}
      <SectionBcrypt
        saltRounds={settings.saltRounds}
        onSaltChange={v => modifier("saltRounds", v)}
      />

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <motion.div
        className="param-actions"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
      >
        <motion.button className="btn-filtre" onClick={reinitialiser}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          Réinitialiser les défauts
        </motion.button>
        <motion.button className="btn-success" onClick={sauver}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          Sauvegarder
        </motion.button>
        <AnimatePresence>
          {sauvegarde && (
            <motion.span
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              style={{ color: "var(--accent)", fontSize: 13, letterSpacing: 1 }}
            >
              ✓ Paramètres sauvegardés
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}

export default Parametres
