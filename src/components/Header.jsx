import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const Header = ({ title, arme, onToggleArme }) => {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={`header${arme ? " header-arme" : ""}`}>
      <span>{title}</span>

      {/* badge état armé centré */}
      <AnimatePresence mode="wait">
        {arme ? (
          <motion.div
            key="arme"
            className="header-badge header-badge-arme"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            ⚠ SYSTÈME ARMÉ
          </motion.div>
        ) : (
          <motion.div
            key="desarme"
            className="header-badge header-badge-desarme"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            DÉSARMÉ
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <motion.button
          className={arme ? "btn-lockdown-actif" : "btn-lockdown"}
          onClick={onToggleArme}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {arme ? "DÉSARMER" : "LOCKDOWN"}
        </motion.button>
        <p style={{ fontSize: 13, opacity: 0.7 }}>{time.toLocaleTimeString("fr-FR")}</p>
      </div>
    </div>
  )
}

export default Header
