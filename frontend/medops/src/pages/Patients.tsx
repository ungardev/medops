import { useEffect, useState } from "react"
import { apiFetch } from "../api/client"

interface Patient {
    id: number
    name: string
    age: number
    diagnosis: string
}

export default function Patients() {
    const [patients, setPatients] = useState<Patient[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        apiFetch<Patient[]>("patients/")
            .then(data => {
                setPatients(data)
                setLoading(false)
            })
            .catch(err => {
                setError(err.message)
                setLoading(false)
            })
    }, [])

    if (loading) return <p>Cargando pacientes...</p>
    if (error) return <p>Error: {error}</p>

    return (
        <div>
            <h1>Pacientes</h1>
            <ul>
                {patients.map(p => (
                    <li key={p.id}>
                        {p.name} — {p.age} años — {p.diagnosis}
                    </li>
                ))}
            </ul>
        </div>
    )
}
