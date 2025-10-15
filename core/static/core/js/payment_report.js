// payment_report.js

document.addEventListener("DOMContentLoaded", function () {
    try {
        const methodDataEl = document.getElementById("method-data");
        const statusDataEl = document.getElementById("status-data");

        if (!methodDataEl || !statusDataEl) {
            console.warn("No se encontraron datos para los gráficos.");
            return;
        }

        const methodData = JSON.parse(methodDataEl.textContent);
        const statusData = JSON.parse(statusDataEl.textContent);

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
                        data: methodData.map(item => item.total_amount),
                        backgroundColor: palette.slice(0, methodData.length)
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom' },
                        title: { display: true, text: 'Totales por Método' }
                    }
                }
            });
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
                        data: statusData.map(item => item.total_amount),
                        backgroundColor: palette[1]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false },
                        title: { display: true, text: 'Totales por Estado' }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }
    } catch (err) {
        console.error("Error al renderizar gráficos:", err);
    }
});
