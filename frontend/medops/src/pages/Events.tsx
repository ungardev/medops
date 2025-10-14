import React, { useEffect, useState } from "react"

export default function Events() {
    const [events, setEvents] = useState<any[]>([])

    useEffect(() => {
        fetch("/api/events/")
            .then(res => res.json())
            .then(data => setEvents(data))
    }, [])

    return (
        <div>
            <h1>Eventos</h1>
            <ul>
                {events.map((ev, idx) => (
                    <li key={idx}>{ev.descripcion}</li>
                ))}
            </ul>
        </div>
    )
}
