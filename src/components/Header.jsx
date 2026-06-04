import { useState, useEffect } from "react"


const Header = ({ title }) => {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    setInterval(() => {
      setTime(new Date())
    }, 1000)
  }, [])
  return (

    <div className="header">{title}
      <p>{time.toLocaleTimeString("fr-FR")}</p>
    </div>

  )
}

export default Header