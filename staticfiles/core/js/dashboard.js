document.addEventListener("DOMContentLoaded", () => {
    // --- Inicialización de gráficos vacíos ---
    let entityChart, actionChart, timelineChart;

    const entityCtx = document.getElementById("entityChart");
    const actionCtx = document.getElementById("actionChart");
    const timelineCtx = document.getElementById("timelineChart");

    if (entityCtx) {
        const entityData = JSON.parse(entityCtx.dataset.entities);
        entityChart = new Chart(entityCtx, {
            type: 'bar',
            data: {
                labels: entityData.map(e => e.entity),
                datasets: [{
                    label: 'Eventos',
                    data: entityData.map(e => e.total),
                    backgroundColor: '#4F81BD'
                }]
            }
        });
    }

    if (actionCtx) {
        const actionData = JSON.parse(actionCtx.dataset.actions);
        actionChart = new Chart(actionCtx, {
            type: 'pie',
            data: {
                labels: actionData.map(a => a.action),
                datasets: [{
                    data: actionData.map(a => a.total),
                    backgroundColor: [
                        '#4F81BD',
                        '#C0504D',
                        '#9BBB59',
                        '#8064A2',
                        '#F79646',
                        '#2C4D75'
                    ]
                }]
            }
        });
    }

    if (timelineCtx) {
        const timelineData = JSON.parse(timelineCtx.dataset.timeline);
        timelineChart = new Chart(timelineCtx, {
            type: 'line',
            data: {
                labels: timelineData.map(t => t.day),
                datasets: [{
                    label: 'Eventos por día',
                    data: timelineData.map(t => t.total),
                    borderColor: '#4F81BD',
                    fill: false,
                    tension: 0.1
                }]
            }
        });
    }

    // --- Filtro dinámico con fetch ---
    const form = document.getElementById("auditFilterForm");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const start = form.audit_start.value;
            const end = form.audit_end.value;

            try {
                const url = `/api/events/stats/?start=${start}&end=${end}`;
                const res = await fetch(url);
                const data = await res.json();

                // Actualizar gráfico de entidades
                if (entityChart) {
                    entityChart.data.labels = data.entity_data.map(e => e.entity);
                    entityChart.data.datasets[0].data = data.entity_data.map(e => e.total);
                    entityChart.update();
                }

                // Actualizar gráfico de acciones
                if (actionChart) {
                    actionChart.data.labels = data.action_data.map(a => a.action);
                    actionChart.data.datasets[0].data = data.action_data.map(a => a.total);
                    actionChart.update();
                }

                // Actualizar gráfico de línea
                if (timelineChart) {
                    timelineChart.data.labels = data.timeline_data.map(t => t.day);
                    timelineChart.data.datasets[0].data = data.timeline_data.map(t => t.total);
                    timelineChart.update();
                }
            } catch (error) {
                console.error("Error al actualizar gráficos:", error);
            }
        });
    }
});
