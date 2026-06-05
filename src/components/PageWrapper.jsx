import { motion } from "framer-motion"

// enveloppe chaque page dans une transition framer motion
// toutes les routes passent par ici pour avoir la meme animation d'entree/sortie
const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.22, ease: "easeOut" }}
    style={{ height: "100%", overflowY: "auto" }}
  >
    {children}
  </motion.div>
)

export default PageWrapper
