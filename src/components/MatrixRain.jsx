import { useEffect, useRef } from "react"
import { gsap } from "gsap"

// pluie matricielle en fond sur l'ecran verrou
// utilise le ticker gsap pour un framerate stable et propre
const MatrixRain = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const taille  = 16
    const chars   = "01アイウエオカキクケコサシスセソABCDEF0123456789><|_-+={}[]"
    const cols    = Math.floor(canvas.width / taille)
    const drops   = Array.from({ length: cols }, () => Math.random() * -50)

    const draw = () => {
      // fond semi-transparent pour l'effet de trainee
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)]

        // tete de colonne plus lumineuse
        ctx.fillStyle = i % 7 === 0 ? "#ffffff" : "#00ff88"
        ctx.font      = `${taille}px Courier New`
        ctx.fillText(char, i * taille, y * taille)

        // repart depuis le haut de facon aleatoire
        if (y * taille > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i] += 0.5
      })
    }

    gsap.ticker.fps(30) // 30fps suffit pour cet effet, economise la batterie
    gsap.ticker.add(draw)

    return () => {
      gsap.ticker.remove(draw)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        opacity: 0.12,
        pointerEvents: "none",
      }}
    />
  )
}

export default MatrixRain
