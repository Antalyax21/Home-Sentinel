import { useState, useEffect } from "react"
import { lireSettings } from "../utils/settings"

const Verrou = ({ onSuccess }) => {
  const pinAdmin = lireSettings().pinAdmin
  const longueur = pinAdmin.length

  const [saisie,     setSaisie]     = useState([])
  const [erreur,     setErreur]     = useState(false)
  const [tentatives, setTentatives] = useState(0)

  const ajouterChiffre = (chiffre) => {
    if (saisie.length < longueur) setSaisie(prev => [...prev, chiffre])
  }

  // efface le dernier chiffre
  const effacer = () => setSaisie(prev => prev.slice(0, -1))

  useEffect(() => {
    if (saisie.length === longueur) {
      const codeEntre = saisie.join("")
      if (codeEntre === pinAdmin) {
        // bon code → acces a l'app
        onSuccess()
      } else {
        // mauvais code → anim shake + reset apres 800ms
        setErreur(true)
        setTentatives(prev => prev + 1)
        setTimeout(() => {
          setSaisie([])
          setErreur(false)
        }, 800)
      }
    }
  }, [saisie, onSuccess])

  // supporte aussi le clavier physique
  useEffect(() => {
    const gererClavier = (e) => {
      if (e.key >= "0" && e.key <= "9") ajouterChiffre(e.key)
      if (e.key === "Backspace") effacer()
    }
    window.addEventListener("keydown", gererClavier)
    return () => window.removeEventListener("keydown", gererClavier)
  }, [saisie])

  return (
    <div className="verrou-fond">
      <div className="verrou-boite">

        <h1 className="verrou-titre">HOME SENTINEL</h1>
        <p className="verrou-sous-titre">Entrez votre code PIN</p>

        {/* 6 cercles → remplis au fur et a mesure de la saisie */}
        <div className={`verrou-points${erreur ? " verrou-erreur" : ""}`}>
          {Array.from({ length: longueur }).map((_, i) => (
            <div
              key={i}
              className={`verrou-point${i < saisie.length ? " verrou-point-rempli" : ""}`}
            />
          ))}
        </div>

        {/* message d'erreur avec le nb de tentatives */}
        {tentatives > 0 && !erreur && (
          <p className="verrou-message-erreur">
            Code incorrect · {tentatives} tentative{tentatives > 1 ? "s" : ""}
          </p>
        )}

        {/* pave numerique 3x3 + 0 et effacer */}
        <div className="verrou-pave">
          {["1","2","3","4","5","6","7","8","9"].map(n => (
            <button key={n} className="verrou-touche" onClick={() => ajouterChiffre(n)}>
              {n}
            </button>
          ))}
          <div />
          <button className="verrou-touche" onClick={() => ajouterChiffre("0")}>0</button>
          <button className="verrou-touche verrou-touche-effacer" onClick={effacer}>⌫</button>
        </div>

      </div>
    </div>
  )
}

export default Verrou
