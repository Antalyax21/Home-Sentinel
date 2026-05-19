import { useState, useEffect } from 'react'


function DoorSensors () {
    const [isOpen, setIsOpen] = useState(false)

     useEffect (() => {    // Simulation d'un appel API en setTimOut pour recup le statut (plus tard avec le Raspberry + fetch  avec vrai appel reseau)
        setTimeout(() => {
            setIsOpen(true)
        }, 2000)
    }, []) 
        

    return ( <section>
        Door Sensors 
        {isOpen ? "Ouvert" : "Fermer"}
        <button onClick={()=> setIsOpen(!isOpen)}>Ouvrir</button>

    </section>
       

    )
}
export default DoorSensors