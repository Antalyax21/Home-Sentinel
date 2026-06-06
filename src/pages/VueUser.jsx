import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import "../User.css"
import { lireSettings } from "../utils/settings"

// Lu depuis localStorage (configurables via la page /parametres)
const { pinUser: PIN_USER, delaiEntree: DELAI_ENTREE, delaiSortie: DELAI_SORTIE,
        delaiDim: DELAI_DIM, delaiVerrou: DELAI_VERROU } = lireSettings()

// mock capteurs — sera remplacé par WebSocket FastAPI
const CAPTEURS = [
  { nom: "Porte d'Entrée",    ouvert: false },
  { nom: "Porte de Garage",   ouvert: false },
  { nom: "Fenêtre Salon 1",   ouvert: false },
  { nom: "Fenêtre Salon 2",   ouvert: true  }, // laisser ouvert pour tester la vérification
]

// ── WMO weather codes ──────────────────────────────────────────────────────
const METEO_CODES = {
  0:  { label: "Ensoleillé",  icone: "☀️" }, 1: { label: "Peu nuageux", icone: "🌤" },
  2:  { label: "Nuageux",     icone: "⛅" }, 3: { label: "Couvert",     icone: "☁️" },
  45: { label: "Brouillard",  icone: "🌫" }, 51: { label: "Bruine",     icone: "🌦" },
  61: { label: "Pluie",       icone: "🌧" }, 65: { label: "Pluie forte",icone: "🌧" },
  71: { label: "Neige",       icone: "🌨" }, 75: { label: "Neige dense",icone: "❄️" },
  80: { label: "Averses",     icone: "🌦" }, 95: { label: "Orage",      icone: "⛈" },
}

// ── Historique localStorage ────────────────────────────────────────────────
const CLE_HISTO = "sentinel_historique"
const chargerHisto  = () => { try { return JSON.parse(localStorage.getItem(CLE_HISTO)) || [] } catch { return [] } }
const ajouterHisto  = (type) => {
  const now   = new Date()
  const heure = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  const date  = now.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
  const histo = [{ type, heure, date, id: Date.now() }, ...chargerHisto()].slice(0, 20)
  localStorage.setItem(CLE_HISTO, JSON.stringify(histo))
  return histo
}

// ── Tâches localStorage ────────────────────────────────────────────────────
const cleJour       = () => { const d = new Date(); return `sentinel_taches_${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}` }
const chargerTaches = () => { try { return JSON.parse(localStorage.getItem(cleJour())) || [] } catch { return [] } }
const sauverTaches  = (t)  => localStorage.setItem(cleJour(), JSON.stringify(t))

// ── Composant Horloge ──────────────────────────────────────────────────────
const Horloge = ({ compact = false }) => {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id) }, [])
  const heure = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  const sec   = now.toLocaleTimeString("fr-FR", { second: "2-digit" }).slice(-2)
  const date  = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
  if (compact) return <div className="u-heure-compact">{heure}<span className="u-sec-compact">:{sec}</span></div>
  return (
    <div className="u-horloge">
      <div className="u-heure">{heure}<span className="u-sec">:{sec}</span></div>
      <div className="u-date">{date.charAt(0).toUpperCase() + date.slice(1)}</div>
    </div>
  )
}

// ── Composant Météo ────────────────────────────────────────────────────────
const Meteo = () => {
  const [m, setM] = useState(null)
  useEffect(() => {
    const fetch_ = async () => {
      try {
        const r = await fetch("https://api.open-meteo.com/v1/forecast?latitude=49.02&longitude=1.15&current=temperature_2m,weathercode,windspeed_10m&timezone=Europe%2FParis")
        const d = await r.json()
        const code = d.current.weathercode
        setM({ temp: Math.round(d.current.temperature_2m), vent: Math.round(d.current.windspeed_10m), ...(METEO_CODES[code] ?? { label: "–", icone: "🌡" }) })
      } catch { /* silencieux si hors ligne */ }
    }
    fetch_()
    const id = setInterval(fetch_, 10 * 60 * 1000)
    return () => clearInterval(id)
  }, [])
  if (!m) return null
  return (
    <div className="u-meteo">
      <span className="u-meteo-icone">{m.icone}</span>
      <div>
        <span className="u-meteo-temp">{m.temp}°C</span>
        <span className="u-meteo-label">{m.label} · Évreux</span>
        <span className="u-meteo-vent">💨 {m.vent} km/h</span>
      </div>
    </div>
  )
}

// ── Composant Tâches ───────────────────────────────────────────────────────
const Taches = () => {
  const [taches, setTaches] = useState(chargerTaches)
  const [ouvert, setOuvert] = useState(false)
  const [texte,  setTexte]  = useState("")
  const ref = useRef(null)
  useEffect(() => { if (ouvert) ref.current?.focus() }, [ouvert])
  const ajouter = () => {
    const t = texte.trim(); if (!t) return
    const n = [...taches, { id: Date.now(), texte: t, faite: false }]
    setTaches(n); sauverTaches(n); setTexte(""); setOuvert(false)
  }
  const toggle = (id) => { const n = taches.map(t => t.id === id ? { ...t, faite: !t.faite } : t); setTaches(n); sauverTaches(n) }
  return (
    <div className="u-taches">
      <div className="u-taches-head">
        <span className="u-taches-titre">Tâches du jour</span>
        <button className="u-btn-plus" onClick={() => setOuvert(v => !v)}>+</button>
      </div>
      <AnimatePresence>
        {ouvert && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
            <input ref={ref} className="u-input" placeholder="Nouvelle tâche…" value={texte}
              onChange={e => setTexte(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") ajouter(); if (e.key === "Escape") setOuvert(false) }} />
          </motion.div>
        )}
      </AnimatePresence>
      {taches.length === 0 && !ouvert
        ? <p className="u-taches-vide">Aucune tâche pour aujourd'hui</p>
        : <ul className="u-taches-liste">
            <AnimatePresence>
              {taches.map(t => (
                <motion.li key={t.id} className={`u-tache${t.faite ? " u-faite" : ""}`}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  onClick={() => toggle(t.id)}>
                  <span className="u-check">{t.faite ? "✓" : "○"}</span>
                  <span>{t.texte}</span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
      }
    </div>
  )
}

// ── Composant Historique ───────────────────────────────────────────────────
const Historique = ({ histo }) => {
  if (histo.length === 0) return null
  const icones = { entree: "→", sortie: "←", alarme: "⚠" }
  const couleurs = { entree: "var(--u-success)", sortie: "var(--u-blue)", alarme: "var(--u-danger)" }
  return (
    <div className="u-histo">
      <span className="u-taches-titre">Derniers accès</span>
      <ul className="u-histo-liste">
        {histo.slice(0, 4).map(h => (
          <li key={h.id} className="u-histo-ligne">
            <span className="u-histo-icone" style={{ color: couleurs[h.type] }}>{icones[h.type]}</span>
            <span className="u-histo-label">
              {h.type === "entree" ? "Entrée" : h.type === "sortie" ? "Sortie" : "Alarme"}
            </span>
            <span className="u-histo-heure">{h.heure} · {h.date}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Composant Pavé PIN ─────────────────────────────────────────────────────
const PavePin = ({ onSuccess, onAnnuler, label }) => {
  const [saisie, setSaisie] = useState([])
  const [erreur, setErreur] = useState(false)
  const [tent,   setTent]   = useState(0)
  const add = (c) => { if (saisie.length < 4) setSaisie(p => [...p, c]) }
  const del = ()  => setSaisie(p => p.slice(0, -1))
  useEffect(() => {
    if (saisie.length < 4) return
    if (saisie.join("") === PIN_USER) { onSuccess() }
    else { setErreur(true); setTent(p => p + 1); setTimeout(() => { setSaisie([]); setErreur(false) }, 700) }
  }, [saisie, onSuccess])
  useEffect(() => {
    const fn = (e) => { if (e.key >= "0" && e.key <= "9") add(e.key); if (e.key === "Backspace") del() }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [saisie])
  return (
    <div className="u-pin">
      <p className="u-pin-label">{label}</p>
      <div className={`u-points${erreur ? " u-erreur" : ""}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`u-point${i < saisie.length ? " u-rempli" : ""}`} />
        ))}
      </div>
      {tent > 0 && !erreur && <p className="u-pin-erreur-msg">Code incorrect · {tent} tentative{tent > 1 ? "s" : ""}</p>}
      <div className="u-pave">
        {["1","2","3","4","5","6","7","8","9"].map(n => (
          <button key={n} className="u-key" onClick={() => add(n)}>{n}</button>
        ))}
        <div />
        <button className="u-key" onClick={() => add("0")}>0</button>
        <button className="u-key u-key-del" onClick={del}>⌫</button>
      </div>
      {onAnnuler && <button className="u-annuler" onClick={onAnnuler}>Annuler</button>}
    </div>
  )
}

// ── Vue principale ─────────────────────────────────────────────────────────
const VueUser = () => {
  const CLE_ARME = 'sentinel_arme'
  const lireArme = () => { try { return JSON.parse(localStorage.getItem(CLE_ARME)) === true } catch { return false } }

  const [arme, setArmeState] = useState(lireArme)

  // synchroniser avec le dashboard admin via localStorage
  const setArme = useCallback((val) => {
    const nouvelEtat = typeof val === 'function' ? val(arme) : val
    localStorage.setItem(CLE_ARME, JSON.stringify(nouvelEtat))
    setArmeState(nouvelEtat)
  }, [arme])
  const [etape,     setEtape]     = useState("veille")
  const [estDim,    setEstDim]    = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [histo,     setHisto]     = useState(chargerHisto)

  const timerRef   = useRef(null)
  const inactifRef = useRef(0)

  // ── Inactivité : dim → verrou ──────────────────────────────────────────
  const resetInactivite = useCallback(() => {
    inactifRef.current = 0
    setEstDim(false)
  }, [])

  useEffect(() => {
    const events = ["mousemove", "touchstart", "pointerdown", "keydown", "click"]
    events.forEach(e => window.addEventListener(e, resetInactivite))
    const tick = setInterval(() => {
      inactifRef.current += 1
      if (inactifRef.current === DELAI_DIM)    setEstDim(true)
      if (inactifRef.current >= DELAI_VERROU)  setEtape(e => e === "veille" ? "verrouille" : e)
    }, 1000)
    return () => { events.forEach(e => window.removeEventListener(e, resetInactivite)); clearInterval(tick) }
  }, [resetInactivite])

  // ── Countdown (entrée 60s ou sortie 30s) ──────────────────────────────
  useEffect(() => {
    if (etape !== "entree" && etape !== "delai_sortie") { clearInterval(timerRef.current); return }
    const start = etape === "entree" ? DELAI_ENTREE : DELAI_SORTIE
    setCountdown(start)
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timerRef.current)
          if (etape === "entree")        setEtape("alarme")
          if (etape === "delai_sortie")  { setArme(true); setEtape("succes_sortie"); setHisto(ajouterHisto("sortie")) }
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [etape])

  // ── Callbacks PIN ──────────────────────────────────────────────────────
  const onSuccessEntree = useCallback(() => {
    clearInterval(timerRef.current)
    setArme(false)
    setHisto(ajouterHisto("entree"))
    setEtape("succes_entree")
    setTimeout(() => setEtape("veille"), 3000)
  }, [])

  const onSuccessSortie = useCallback(() => {
    // vérifier les capteurs avant d'armer
    const ouverts = CAPTEURS.filter(c => c.ouvert)
    if (ouverts.length > 0) setEtape("confirm_arme")
    else                    setEtape("delai_sortie")
  }, [])

  const confirmerArmement = () => setEtape("delai_sortie")
  const onAnnuler = useCallback(() => { clearInterval(timerRef.current); setEtape("veille") }, [])

  const onReveiller = () => { resetInactivite(); setEtape("veille") }

  const mm = String(Math.floor(countdown / 60))
  const ss = String(countdown % 60).padStart(2, "0")
  const capteursOuverts = CAPTEURS.filter(c => c.ouvert)

  return (
    <div
      className={[
        "u-fond",
        arme            ? "u-fond-arme"    : "",
        etape === "alarme"     ? "u-fond-alarme"  : "",
        etape.startsWith("succes") ? "u-fond-succes" : "",
        estDim          ? "u-fond-dim"     : "",
      ].filter(Boolean).join(" ")}
    >
      <AnimatePresence mode="wait">

        {/* ── VERROUILLÉ ──────────────────────────── */}
        {etape === "verrouille" && (
          <motion.div key="verrou" className="u-verrou" onClick={onReveiller}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Horloge compact />
            <p className="u-verrou-hint">Appuyez pour déverrouiller</p>
          </motion.div>
        )}

        {/* ── VEILLE ──────────────────────────────── */}
        {etape === "veille" && (
          <motion.div key="veille" className="u-veille"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            {arme && <div className="u-badge-arme">🔒 SYSTÈME ARMÉ</div>}
            <Horloge />
            <Meteo />
            <Taches />
            <Historique histo={histo} />
            <div className="u-actions">
              {!arme && (
                <motion.button className="u-btn-partir" onClick={() => setEtape("sortie")}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  Partir · Armer le système
                </motion.button>
              )}
              <button className="u-btn-test" onClick={() => setEtape("entree")}>
                [ test : simuler ouverture porte ]
              </button>
            </div>
          </motion.div>
        )}

        {/* ── ENTRÉE — désarmer ───────────────────── */}
        {etape === "entree" && (
          <motion.div key="entree" className="u-auth"
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <PavePin label="Entrez votre code pour désarmer" onSuccess={onSuccessEntree} onAnnuler={onAnnuler} />
            <div className={`u-countdown${countdown <= 10 ? " u-countdown-urgent" : ""}`}>
              ⏱ {mm}:{ss}
            </div>
          </motion.div>
        )}

        {/* ── SORTIE — armer ──────────────────────── */}
        {etape === "sortie" && (
          <motion.div key="sortie" className="u-auth"
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <PavePin label="Entrez votre code pour armer le système" onSuccess={onSuccessSortie} onAnnuler={onAnnuler} />
          </motion.div>
        )}

        {/* ── CONFIRMATION CAPTEURS OUVERTS ───────── */}
        {etape === "confirm_arme" && (
          <motion.div key="confirm" className="u-auth"
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div className="u-confirm-card">
              <div className="u-confirm-icone">⚠</div>
              <p className="u-confirm-titre">
                {capteursOuverts.length} capteur{capteursOuverts.length > 1 ? "s" : ""} ouvert{capteursOuverts.length > 1 ? "s" : ""}
              </p>
              <ul className="u-confirm-liste">
                {capteursOuverts.map((c, i) => (
                  <li key={i} className="u-confirm-item">⬦ {c.nom}</li>
                ))}
              </ul>
              <p className="u-confirm-sub">Le système peut être armé malgré tout.</p>
              <div className="u-confirm-actions">
                <motion.button className="u-btn-confirmer" onClick={confirmerArmement}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  Armer quand même
                </motion.button>
                <button className="u-annuler" onClick={onAnnuler}>Annuler</button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── DÉLAI DE SORTIE ─────────────────────── */}
        {etape === "delai_sortie" && (
          <motion.div key="delai" className="u-auth"
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div className="u-delai-card">
              <motion.div
                className="u-delai-cercle"
                style={{ background: `conic-gradient(var(--u-blue) ${(countdown / DELAI_SORTIE) * 360}deg, var(--u-border) 0deg)` }}
              >
                <span className="u-delai-chiffre">{countdown}</span>
              </motion.div>
              <p className="u-delai-titre">Quittez les lieux</p>
              <p className="u-delai-sub">Le système s'arme dans {countdown} seconde{countdown > 1 ? "s" : ""}</p>
            </div>
          </motion.div>
        )}

        {/* ── SUCCÈS ENTRÉE ────────────────────────── */}
        {etape === "succes_entree" && (
          <motion.div key="s_entree" className="u-resultat"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="u-icone-succes" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 220 }}>✓</motion.div>
            <p className="u-msg-principal">Accès autorisé</p>
            <p className="u-msg-sub">Système désarmé · Bienvenue</p>
          </motion.div>
        )}

        {/* ── SUCCÈS SORTIE ────────────────────────── */}
        {etape === "succes_sortie" && (
          <motion.div key="s_sortie" className="u-resultat"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            onAnimationComplete={() => setTimeout(() => setEtape("veille"), 2500)}>
            <motion.div className="u-icone-arme" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 220 }}>🔒</motion.div>
            <p className="u-msg-principal">Système armé</p>
            <p className="u-msg-sub">Bonne journée · Restez prudent</p>
          </motion.div>
        )}

        {/* ── ALARME ──────────────────────────────── */}
        {etape === "alarme" && (
          <motion.div key="alarme" className="u-resultat"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="u-icone-alarme"
              animate={{ scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 0.7 }}>⚠</motion.div>
            <p className="u-msg-principal u-msg-alarme">Intrusion détectée</p>
            <p className="u-msg-sub" style={{ color: "var(--u-danger)" }}>Envoi de l'alerte en cours…</p>
            <button className="u-btn-reset" onClick={() => { setHisto(ajouterHisto("alarme")); setEtape("veille") }}>
              Réinitialiser
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}

export default VueUser
