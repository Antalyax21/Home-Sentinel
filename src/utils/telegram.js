// utilitaire centralise pour envoyer des messages telegram
// tous les endroits de l'app qui ont besoin de telegram passent par ici
// quand le backend fastapi sera pret, on remplacera juste ce fichier

export const envoyerTelegram = async (message) => {
  const token  = import.meta.env.VITE_TELEGRAM_TOKEN
  const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    })
  } catch {
    console.warn("telegram non joignable")
  }
}
