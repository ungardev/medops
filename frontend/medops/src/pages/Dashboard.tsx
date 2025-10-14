import { useEffect, useState } from "react"
import { apiFetch } from "../api/client"

interface Metrics {
    totalPatients: number
    todayAppointments: number
    pendingPayments: number
}

export default function Dashboard() {
    const [metrics, setMetrics] = useState<Metrics | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        apiFetch<Metrics>("metrics/")
            .then((data) => {
                setMetrics(data)
                setLoading(false)
            })
            .catch((err: any) => {
                setError(err.message)
                setLoading(false)
            })
    }, [])

    if (loading) return <p>Cargando métricas...</p>
    if (error) return <p>Error: {error}</p>

    return (
        <div>
            <h1>Dashboard</h1>
            <ul>
                <li>Total de pacientes: {metrics?.totalPatients}</li>
                <li>Citas de hoy: {metrics?.todayAppointments}</li>
                <li>Pagos pendientes: {metrics?.pendingPayments}</li>
            </ul>
        </div>
    )
}
