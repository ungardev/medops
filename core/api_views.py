from django.http import JsonResponse, HttpResponse
from django.utils.timezone import now
from django.utils.dateparse import parse_date
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from django.core.paginator import Paginator

from .models import Patient, Appointment, Payment, Event
import csv
from typing import cast
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.chart import BarChart, Reference, PieChart, LineChart
from openpyxl.worksheet.worksheet import Worksheet
from openpyxl.cell.cell import Cell

# --- Dashboard / métricas ---
def metrics_api(request):
    today = now().date()
    data = {
        "totalPatients": Patient.objects.count(),
        "todayAppointments": Appointment.objects.filter(appointment_date=today).count(),
        "pendingPayments": Payment.objects.filter(status="pending").count(),
        "waivedConsultations": Payment.objects.filter(status="waived").count(),
        "appointmentStatusToday": list(
            Appointment.objects.filter(appointment_date=today)
            .values("status")
            .annotate(total=Count("id"))
        ),
        "paymentMethodsTotals": list(
            Payment.objects.values("method").annotate(total=Sum("amount"))
        ),
    }
    return JsonResponse(data)

# --- Pacientes ---
def patients_api(request):
    patients = Patient.objects.all().values(
        "id",
        "first_name",
        "middle_name",
        "last_name",
        "second_last_name",
        "birthdate",
        "gender",
        "contact_info",
    )

    results = []
    for p in patients:
        full_name = " ".join(
            filter(None, [p["first_name"], p["middle_name"], p["last_name"], p["second_last_name"]])
        )
        results.append({
            "id": p["id"],
            "full_name": full_name,
            "birthdate": p["birthdate"],
            "gender": p["gender"],
            "contact_info": p["contact_info"],
        })

    return JsonResponse(results, safe=False)

# --- Citas del día ---
def daily_appointments_api(request):
    today = now().date()
    appointments = (
        Appointment.objects.filter(appointment_date=today)
        .select_related("patient")
        .order_by("arrival_time")
        .values(
            "id",
            "patient_id",
            "patient__first_name",
            "patient__last_name",
            "appointment_date",
            "arrival_time",
            "status",
        )
    )
    results = []
    for a in appointments:
        full_name = " ".join(filter(None, [a["patient__first_name"], a["patient__last_name"]]))
        results.append({
            "id": a["id"],
            "patient_id": a["patient_id"],
            "patient_name": full_name,
            "appointment_date": a["appointment_date"],
            "arrival_time": a["arrival_time"],
            "status": a["status"],
        })
    return JsonResponse(results, safe=False)

# --- Resumen de pagos ---
def payment_summary_api(request):
    summary = (
        Payment.objects.values("method", "status")
        .annotate(total_transactions=Count("id"), total_amount=Sum("amount"))
        .order_by("method", "status")
    )
    return JsonResponse(list(summary), safe=False)

# --- Consultas exoneradas ---
def waived_consultations_api(request):
    waived = (
        Payment.objects.filter(status="waived")
        .select_related("appointment__patient")
        .values(
            "id",
            "appointment_id",
            "appointment__patient__first_name",
            "appointment__patient__last_name",
            "amount",
            "method",
            "status",
        )
    )
    results = []
    for w in waived:
        full_name = " ".join(filter(None, [w["appointment__patient__first_name"], w["appointment__patient__last_name"]]))
        results.append({
            "id": w["id"],
            "appointment_id": w["appointment_id"],
            "patient_name": full_name,
            "amount": w["amount"],
            "method": w["method"],
            "status": w["status"],
        })
    return JsonResponse(results, safe=False)

# --- Auditoría: lista + filtros + paginación (JSON) ---
def event_log_api(request):
    events = Event.objects.all().order_by("-timestamp")

    # Filtros
    entity = request.GET.get("entity")
    action = request.GET.get("action")
    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")

    if entity:
        events = events.filter(entity=entity)
    if action:
        events = events.filter(action__icontains=action)
    if start_date:
        events = events.filter(timestamp__date__gte=parse_date(start_date))
    if end_date:
        events = events.filter(timestamp__date__lte=parse_date(end_date))

    # Exportar CSV
    if request.GET.get("export") == "csv":
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="event_log.csv"'
        writer = csv.writer(response)
        writer.writerow(["Timestamp", "Entity", "Entity ID", "Action", "Metadata"])
        for e in events:
            writer.writerow([e.timestamp, e.entity, e.entity_id, e.action, e.metadata])
        return response

    # Exportar XLSX
    if request.GET.get("export") == "xlsx":
        wb = Workbook()
        ws = cast(Worksheet, wb.active)
        ws.title = "Event Log"

        headers = ["Timestamp", "Entity", "Entity ID", "Action", "Metadata"]
        ws.append(headers)

        # Estilo de encabezados
        for col_num, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col_num)
            cell.font = Font(bold=True, color="FFFFFF")
            cell.fill = PatternFill(start_color="4F81BD", end_color="4F81BD", fill_type="solid")

        # Datos
        for e in events:
            ws.append([
                e.timestamp.strftime("%d/%m/%Y %H:%M"),
                e.entity,
                e.entity_id,
                e.action,
                str(e.metadata)
            ])

        # Autoajuste de columnas
        for col_cells in ws.iter_cols(min_row=1, max_row=ws.max_row, min_col=1, max_col=ws.max_column):
            max_length = 0
            first_cell: Cell = col_cells[0]  # type: ignore
            col_letter = get_column_letter(first_cell.column)
            for cell in col_cells:
                if cell.value:
                    max_length = max(max_length, len(str(cell.value)))
            ws.column_dimensions[col_letter].width = max_length + 2

        # Filtros automáticos
        ws.auto_filter.ref = ws.dimensions

        # Crear hoja de resumen con gráficos
        summary_ws = cast(Worksheet, wb.create_sheet(title="Resumen"))

        # Conteo por entidad
        summary_ws.append(["Entidad", "Total"])
        entity_counts = {}
        for e in events:
            entity_counts[e.entity] = entity_counts.get(e.entity, 0) + 1
        for ent, total in entity_counts.items():
            summary_ws.append([ent, total])

        chart1 = BarChart()
        chart1.title = "Eventos por Entidad"
        chart1.x_axis.title = "Entidad"
        chart1.y_axis.title = "Total de eventos"
        data1 = Reference(summary_ws, min_col=2, min_row=1, max_row=len(entity_counts) + 1)
        categories1 = Reference(summary_ws, min_col=1, min_row=2, max_row=len(entity_counts) + 1)
        chart1.add_data(data1, titles_from_data=True)
        chart1.set_categories(categories1)
        summary_ws.add_chart(chart1, "D5")

        # Conteo por acción
        start_row = len(entity_counts) + 3
        summary_ws.cell(row=start_row, column=1, value="Acción")
        summary_ws.cell(row=start_row, column=2, value="Total")

        action_counts = {}
        for e in events:
            action_counts[e.action] = action_counts.get(e.action, 0) + 1
        for idx, (act, total) in enumerate(action_counts.items(), start=start_row + 1):
            summary_ws.cell(row=idx, column=1, value=act)
            summary_ws.cell(row=idx, column=2, value=total)

        chart2 = BarChart()
        chart2.title = "Eventos por Acción"
        chart2.x_axis.title = "Acción"
        chart2.y_axis.title = "Total de eventos"
        data2 = Reference(summary_ws, min_col=2, min_row=start_row, max_row=start_row + len(action_counts))
        categories2 = Reference(summary_ws, min_col=1, min_row=start_row + 1, max_row=start_row + len(action_counts))
        chart2.add_data(data2, titles_from_data=True)
        chart2.set_categories(categories2)
        summary_ws.add_chart(chart2, "D20")

        # Pie chart de acciones
        pie = PieChart()
        pie.title = "Distribución de Acciones"
        pie.add_data(data2, titles_from_data=True)
        pie.set_categories(categories2)
        summary_ws.add_chart(pie, "L20")

        # Timeline (línea)
        timeline_counts = {}
        for e in events:
            day = e.timestamp.date()
            timeline_counts[day] = timeline_counts.get(day, 0) + 1

        timeline_start = start_row + len(action_counts) + 3
        summary_ws.cell(row=timeline_start, column=1, value="Fecha")
        summary_ws.cell(row=timeline_start, column=2, value="Total")

        for idx, (day, total) in enumerate(sorted(timeline_counts.items()), start=timeline_start + 1):
            summary_ws.cell(row=idx, column=1, value=day.strftime("%d/%m/%Y"))
            summary_ws.cell(row=idx, column=2, value=total)

        chart3 = LineChart()
        chart3.title = "Evolución de Eventos por Día"
        chart3.x_axis.title = "Fecha"
        chart3.y_axis.title = "Eventos"
        data3 = Reference(summary_ws, min_col=2, min_row=timeline_start, max_row=timeline_start + len(timeline_counts))
        categories3 = Reference(summary_ws, min_col=1, min_row=timeline_start + 1, max_row=timeline_start + len(timeline_counts))
        chart3.add_data(data3, titles_from_data=True)
        chart3.set_categories(categories3)
        summary_ws.add_chart(chart3, "D35")

        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = 'attachment; filename="event_log.xlsx"'
        wb.save(response)
        return response

    # Paginar JSON
    paginator = Paginator(events, 25)
    page_number = request.GET.get("page")
    page_obj = paginator.get_page(page_number)

    data = {
        "results": [
            {
                "timestamp": e.timestamp,
                "entity": e.entity,
                "entity_id": e.entity_id,
                "action": e.action,
                "metadata": e.metadata,
            }
            for e in page_obj
        ],
        "page": page_obj.number,
        "num_pages": paginator.num_pages,
        "count": paginator.count,
        "filters": {
            "entity": entity or "",
            "action": action or "",
            "start_date": start_date or "",
            "end_date": end_date or "",
        },
    }
    return JsonResponse(data, safe=False)

# --- Auditoría: agregados para gráficos ---
def audit_dashboard_api(request):
    entity_data = list(
        Event.objects.values("entity")
        .annotate(total=Count("id"))
        .order_by("-total")
    )
    action_data = list(
        Event.objects.values("action")
        .annotate(total=Count("id"))
        .order_by("-total")
    )
    timeline_data = list(
        Event.objects.annotate(day=TruncDate("timestamp"))
        .values("day")
        .annotate(total=Count("id"))
        .order_by("day")
    )
    return JsonResponse(
        {
            "entity_data": entity_data,
            "action_data": action_data,
            "timeline_data": timeline_data,
        }
    )
