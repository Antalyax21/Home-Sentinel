import { useEffect, useRef } from "react"
import { gsap } from "gsap"

// compteur anime avec gsap : part de 0 et monte jusqu'a la valeur cible
// donne l'impression que les stats "chargent" a chaque affichage de page
const StatCompteur = ({ valeur, style, className }) => {
  const ref = useRef(null)

  useEffect(() => {
    const obj = { val: 0 }
    gsap.to(obj, {
      val: valeur,
      duration: 1.2,
      ease: "power3.out",
      onUpdate: () => {
        if (ref.current) ref.current.textContent = Math.round(obj.val)
      },
    })
  }, [valeur])

  return <span ref={ref} style={style} className={className}>0</span>
}

export default StatCompteur
