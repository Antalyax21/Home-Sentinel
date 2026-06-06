// Centralise la lecture/écriture des paramètres persistants
// Toutes les constantes sont ici — plus jamais hardcodées dans les composants

const CLE = "sentinel_settings"

export const DEFAULTS = {
  pinUser:      "1234",
  pinAdmin:     "123456",
  delaiEntree:  60,   // secondes avant alarme si code non saisi à l'entrée
  delaiSortie:  30,   // secondes pour quitter après armement
  delaiDim:     45,   // secondes d'inactivité avant assombrissement
  delaiVerrou:  60,   // secondes d'inactivité avant verrouillage
  saltRounds:   10,   // bcrypt cost factor
}

export const lireSettings = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(CLE))
    return { ...DEFAULTS, ...stored }
  } catch {
    return { ...DEFAULTS }
  }
}

export const sauverSettings = (partial) => {
  const current = lireSettings()
  const next = { ...current, ...partial }
  localStorage.setItem(CLE, JSON.stringify(next))
  return next
}
