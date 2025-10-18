// payment_report.js

document.addEventListener("DOMContentLoaded", function () {
    try {
        const methodDataEl = document.getElementById("method-data");
        const statusDataEl = document.getElementById("status-data");

        if (!methodDataEl || !statusDataEl) {
            console.warn("⚠️ No se encontraron datos para los gráficos.");
            return;
        }

        let methodData = [];
        let statusData = [];

        // 🔹 Parseo seguro con logs
        try {
            methodData = JSON.parse(methodDataEl.textContent || "[]");
            console.log("📊 Datos por método:", methodData);
        } catch (e) {
            console.error("❌ Error parseando methodData:", e, methodDataEl.textContent);
        }

        try {
            statusData = JSON.parse(statusDataEl.textContent || "[]");
            console.log("📊 Datos por estado:", statusData);
        } catch (e) {
            console.error("❌ Error parseando statusData:", e, statusDataEl.textContent);
        }

        // 🔹 Paleta de colores reutilizable
        const palette = ['#4CAF50', '#2196F3', '#FFC107', '#FF5722', '#9C27B0', '#00BCD4', '#8BC34A'];

        // 🔹 Gráfico por Método (Pie)
        const ctxMethod = document.getElementById('chartMethod');
        if (ctxMethod && methodData.length > 0) {
            new Chart(ctxMethod.getContext('2d'), {
                type: 'pie',
                data: {
                    labels: methodData.map(item => item.method),
                    datasets: [{
                        label: 'Total por Método',
                        data: methodData.map(item => parseFloat(item.total_amount)),
                        backgroundColor: palette.slice(0, methodData.length)
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // 👈 permite controlar tamaño
                    plugins: {
                        legend: { position: 'bottom' },
                        title: { display: true, text: 'Totales por Método' },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    let value = context.raw || 0;
                                    return `${context.label}: ${value.toLocaleString()}`;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            console.warn("⚠️ No hay datos para el gráfico de métodos.");
        }

        // 🔹 Gráfico por Estado (Bar)
        const ctxStatus = document.getElementById('chartStatus');
        if (ctxStatus && statusData.length > 0) {
            new Chart(ctxStatus.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: statusData.map(item => item.status),
                    datasets: [{
                        label: 'Total por Estado',
                        data: statusData.map(item => parseFloat(item.total_amount)),
                        backgroundColor: statusData.map((_, i) => palette[i % palette.length])
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // 👈 evita que se estire raro
                    plugins: {
                        legend: { display: false },
                        title: { display: true, text: 'Totales por Estado' },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    let value = context.raw || 0;
                                    return `${context.label}: ${value.toLocaleString()}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        } else {
            console.warn("⚠️ No hay datos para el gráfico de estados.");
        }
    } catch (err) {
        console.error("❌ Error general al renderizar gráficos:", err);
    }
});