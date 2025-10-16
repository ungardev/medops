document.addEventListener("DOMContentLoaded", function () {
    const methodData = JSON.parse(document.getElementById("method-data").textContent);
    const statusData = JSON.parse(document.getElementById("status-data").textContent);
    const timelineData = JSON.parse(document.getElementById("timeline-data").textContent);

    // === Gráfico circular por método ===
    new Chart(document.getElementById('methodChart'), {
        type: 'pie',
        data: {
            labels: methodData.map(d => d.method),
            datasets: [{
                data: methodData.map(d => d.amount),
                backgroundColor: ['#1E88E5','#43A047','#FBC02D','#E53935'] // azul, verde, amarillo, rojo
            }]
        }
    });

    // === Gráfico de barras por estado ===
    new Chart(document.getElementById('statusChart'), {
        type: 'bar',
        data: {
            labels: statusData.map(d => d.status),
            datasets: [{
                label: 'Monto total',
                data: statusData.map(d => d.amount),
                backgroundColor: '#1E88E5' // azul corporativo
            }]
        }
    });

    // === Serie acumulada para timeline ===
    let cumulative = 0;
    const cumulativeAmounts = timelineData.map(d => {
        cumulative += d.amount || 0;
        return cumulative;
    });

    // === Gráfico de línea temporal con doble eje Y ===
    new Chart(document.getElementById('timelineChart'), {
        type: 'line',
        data: {
            labels: timelineData.map(d => d.day),
            datasets: [
                {
                    label: 'Monto diario',
                    data: timelineData.map(d => d.amount),
                    borderColor: '#1E88E5',
                    backgroundColor: 'rgba(30, 136, 229, 0.2)',
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'yDaily'
                },
                {
                    label: 'Monto acumulado',
                    data: cumulativeAmounts,
                    borderColor: '#43A047',
                    backgroundColor: 'rgba(67, 160, 71, 0.1)',
                    fill: false,
                    tension: 0.2,
                    yAxisID: 'yCumulative'
                }
            ]
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: { unit: 'day' }
                },
                yDaily: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    title: { display: true, text: 'Monto diario' }
                },
                yCumulative: {
                    type: 'linear',
                    position: 'right',
                    beginAtZero: true,
                    grid: { drawOnChartArea: false },
                    title: { display: true, text: 'Monto acumulado' }
                }
            }
        }
    });
});

// === Función global para exportar gráficos como PNG ===
function downloadChart(canvasId, filename) {
    const canvas = document.getElementById(canvasId);
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png', 1.0); // calidad máxima
    link.download = filename;
    link.click();
}

// === Función global para exportar todos los gráficos en un ZIP ===
async function downloadAllCharts() {
    const zip = new JSZip();

    const charts = [
        { id: 'methodChart', filename: 'metodos.png' },
        { id: 'statusChart', filename: 'estados.png' },
        { id: 'timelineChart', filename: 'timeline.png' }
    ];

    charts.forEach(chart => {
        const canvas = document.getElementById(chart.id);
        if (canvas) {
            const dataURL = canvas.toDataURL('image/png', 1.0);
            const base64Data = dataURL.split(',')[1];
            zip.file(chart.filename, base64Data, { base64: true });
        }
    });

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "dashboard_charts.zip");
}

// === Función global para exportar el dashboard consolidado en PDF con estilo corporativo ===
async function downloadDashboardPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    // === Encabezado corporativo ===
    const logo = new Image();
    logo.src = "/static/core/img/medops-logo.png"; // ruta a tu logo

    logo.onload = function () {
        // Logo en la esquina superior izquierda
        pdf.addImage(logo, "PNG", 15, 10, 30, 15);

        // Título centrado
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(18);
        pdf.setTextColor(30, 136, 229); // azul corporativo
        pdf.text("Reporte - Dashboard de Pagos", 105, 20, { align: "center" });

        // Línea divisoria
        pdf.setDrawColor(180, 180, 180);
        pdf.line(15, 28, 195, 28);

        // === Gráficos ===
        const methodCanvas = document.getElementById("methodChart");
        const statusCanvas = document.getElementById("statusChart");
        const timelineCanvas = document.getElementById("timelineChart");

        const methodImg = methodCanvas.toDataURL("image/png", 1.0);
        const statusImg = statusCanvas.toDataURL("image/png", 1.0);
        const timelineImg = timelineCanvas.toDataURL("image/png", 1.0);

        pdf.setFontSize(12);
        pdf.setTextColor(67, 160, 71); // verde corporativo para subtítulos

        // Distribución por Método
        pdf.text("Distribución por Método", 20, 40);
        pdf.addImage(methodImg, "PNG", 20, 45, 80, 60);

        // Distribución por Estado
        pdf.text("Distribución por Estado", 110, 40);
        pdf.addImage(statusImg, "PNG", 110, 45, 80, 60);

        // Evolución Temporal
        pdf.text("Evolución Temporal", 20, 115);
        pdf.addImage(timelineImg, "PNG", 20, 120, 170, 80);

        // === Pie de página ===
        pdf.setFontSize(10);
        pdf.setTextColor(109, 109, 109); // gris neutro
        pdf.text("Generado automáticamente por MedOps", 105, 290, { align: "center" });

        // Descargar
        pdf.save("dashboard_pagos.pdf");
    };
}
