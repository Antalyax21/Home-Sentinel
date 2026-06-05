// gestion des notifications navigateur (API Web Notification)
// on demande la permission une seule fois a l'ouverture de l'app

export const demanderPermission = async () => {
  if (!("Notification" in window)) return
  if (Notification.permission === "default") {
    await Notification.requestPermission()
  }
}

// envoie une notif navigateur si la permission est accordee
export const envoyerNotification = (titre, corps) => {
  if (!("Notification" in window)) return
  if (Notification.permission !== "granted") return
  new Notification(titre, { body: corps, icon: "/favicon.ico" })
}
