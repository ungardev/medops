# Django core
from django.contrib import admin
from django.utils.html import format_html
from django.urls import path, reverse
from django.template.response import TemplateResponse
from django.utils.dateparse import parse_date
from django.http import HttpResponse
from django.db.models import Sum, Count, Avg
from datetime import datetime, date, timedelta
import matplotlib.pyplot as plt
from rangefilter.filters import DateRangeFilter, DateTimeRangeFilter, DateRangeFilterBuilder


# App models
from .models import (
    Patient,
    Appointment,
    Diagnosis,
    Treatment,
    Prescription,
    Payment,
    MedicalDocument,
)

# Librerías estándar
import csv
from io import BytesIO

# Excel
from openpyxl import Workbook
from openpyxl.utils import get_column_letter
from openpyxl.styles import Font

# PDF
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import (
    Table,
    TableStyle,
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image,
)
from reportlab.lib.styles import getSampleStyleSheet



# Inline para documentos en Patient
class MedicalDocumentInlineForPatient(admin.TabularInline):
    model = MedicalDocument
    extra = 1
    fields = ("file", "description", "category", "preview_file")
    readonly_fields = ("preview_file",)

    @admin.display(description="Archivo")
    def preview_file(self, obj):
        if obj.file and obj.file.name.lower().endswith((".png", ".jpg", ".jpeg")):
            return format_html('<img src="{}" width="60" height="60" style="object-fit:cover;" />', obj.file.url)
        elif obj.file:
            return format_html('<a href="{}" target="_blank">Descargar</a>', obj.file.url)
        return "-"


# Inline para documentos en Appointment
class MedicalDocumentInlineForAppointment(admin.TabularInline):
    model = MedicalDocument
    extra = 1
    fields = ("file", "description", "category", "preview_file")
    readonly_fields = ("preview_file",)

    @admin.display(description="Archivo")
    def preview_file(self, obj):
        if obj.file and obj.file.name.lower().endswith((".png", ".jpg", ".jpeg")):
            return format_html('<img src="{}" width="60" height="60" style="object-fit:cover;" />', obj.file.url)
        elif obj.file:
            return format_html('<a href="{}" target="_blank">Descargar</a>', obj.file.url)
        return "-"


# Inline para documentos en Diagnosis
class MedicalDocumentInlineForDiagnosis(admin.TabularInline):
    model = MedicalDocument
    extra = 1
    fields = ("file", "description", "category", "preview_file")
    readonly_fields = ("preview_file",)

    @admin.display(description="Archivo")
    def preview_file(self, obj):
        if obj.file and obj.file.name.lower().endswith((".png", ".jpg", ".jpeg")):
            return format_html('<img src="{}" width="60" height="60" style="object-fit:cover;" />', obj.file.url)
        elif obj.file:
            return format_html('<a href="{}" target="_blank">Descargar</a>', obj.file.url)
        return "-"


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('id', 'national_id', 'first_name', 'last_name', 'birthdate', 'gender', 'contact_info')
    list_display_links = ('id', 'national_id', 'first_name', 'last_name')
    search_fields = ('national_id', 'first_name', 'last_name', 'contact_info')
    ordering = ('last_name', 'first_name')
    list_per_page = 25
    inlines = [MedicalDocumentInlineForPatient]


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'appointment_date', 'status')
    list_display_links = ('id', 'patient')
    list_filter = ('status', 'appointment_date')
    search_fields = ('patient__first_name', 'patient__last_name', 'patient__national_id')
    ordering = ('-appointment_date',)
    list_per_page = 25
    inlines = [MedicalDocumentInlineForAppointment]


@admin.register(Diagnosis)
class DiagnosisAdmin(admin.ModelAdmin):
    list_display = ('id', 'appointment', 'code', 'description')
    list_display_links = ('id', 'code')
    search_fields = ('code', 'description', 'appointment__patient__national_id')
    ordering = ('code',)
    list_per_page = 25
    inlines = [MedicalDocumentInlineForDiagnosis]


@admin.register(Treatment)
class TreatmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'diagnosis', 'plan', 'start_date', 'end_date')
    list_display_links = ('id', 'diagnosis')
    ordering = ('-start_date',)
    list_per_page = 25


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ('id', 'diagnosis', 'medication', 'dosage', 'duration')
    list_display_links = ('id', 'medication')
    search_fields = ('medication', 'diagnosis__appointment__patient__national_id')
    ordering = ('medication',)
    list_per_page = 25


class QuickDateRangeFilter(admin.SimpleListFilter):
    title = "Rango rápido"
    parameter_name = "quick_range"

    def lookups(self, request, model_admin):
        # 👇 Debe devolver lista o tupla de tuplas
        return [
            ("today", "Hoy"),
            ("last_7_days", "Últimos 7 días"),
            ("this_month", "Este mes"),
            ("this_year", "Este año"),
        ]

    def queryset(self, request, queryset):
        value = self.value()
        if not value:
            return queryset

        field = "appointment__appointment_date"
        today = date.today()

        if value == "today":
            return queryset.filter(**{
                f"{field}__gte": today,
                f"{field}__lte": today,
            })

        if value == "last_7_days":
            start = today - timedelta(days=7)
            return queryset.filter(**{
                f"{field}__gte": start,
                f"{field}__lte": today,
            })

        if value == "this_month":
            start = today.replace(day=1)
            return queryset.filter(**{
                f"{field}__gte": start,
                f"{field}__lte": today,
            })

        if value == "this_year":
            start = date(today.year, 1, 1)
            return queryset.filter(**{
                f"{field}__gte": start,
                f"{field}__lte": today,
            })

        return queryset


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'patient_name', 'appointment', 'amount', 'method',
        'status', 'reference_number', 'bank_name', 'received_by', 'received_at'
    )
    list_display_links = ('id', 'appointment')

    # Calendario + atajos rápidos
    list_filter = (
        'method',
        'status',
        ('appointment__appointment_date', DateRangeFilter),  # Si es DateField
        QuickDateRangeFilter,
    )

    search_fields = (
        'appointment__patient__first_name',
        'appointment__patient__last_name',
        'appointment__patient__national_id'
    )
    ordering = ('-appointment__appointment_date',)
    list_per_page = 25

    @admin.display(description="Paciente")
    def patient_name(self, obj):
        return f"{obj.appointment.patient.national_id} - {obj.appointment.patient.first_name} {obj.appointment.patient.last_name}"

    # 🔹 URLs personalizadas
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('report/', self.admin_site.admin_view(self.report_view), name="payment-report"),
            path('export-csv/', self.admin_site.admin_view(self.export_csv), name="payment-export-csv"),
            path('export-xlsx/', self.admin_site.admin_view(self.export_xlsx), name="payment-export-xlsx"),
            path('export-pdf/', self.admin_site.admin_view(self.export_pdf), name="payment-export-pdf"),
        ]
        return custom_urls + urls
    
    # 🔹 Vista de reporte con filtros y resumen
    def report_view(self, request):
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")

        payments = Payment.objects.all()
        if start_date:
            payments = payments.filter(received_at__date__gte=parse_date(start_date))
        if end_date:
            payments = payments.filter(received_at__date__lte=parse_date(end_date))

        totals_by_method = (
            payments.values('method')
            .annotate(total_amount=Sum('amount'), count=Count('id'))
            .order_by('method')
        )
        totals_by_status = (
            payments.values('status')
            .annotate(total_amount=Sum('amount'), count=Count('id'))
            .order_by('status')
        )

        total_revenue = payments.aggregate(total=Sum('amount'))['total'] or 0
        total_payments = payments.count()
        avg_per_payment = payments.aggregate(avg=Avg('amount'))['avg'] or 0

        context = dict(
            self.admin_site.each_context(request),
            totals_by_method=list(totals_by_method),
            totals_by_status=list(totals_by_status),
            title="Reporte Financiero de Pagos",
            start_date=start_date or "",
            end_date=end_date or "",
            total_revenue=total_revenue,
            total_payments=total_payments,
            avg_per_payment=avg_per_payment,
        )
        return TemplateResponse(request, "admin/payment_report.html", context)

    # 🔹 Exportador CSV
    def export_csv(self, request):
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")

        payments = Payment.objects.all()
        if start_date:
            payments = payments.filter(received_at__date__gte=parse_date(start_date))
        if end_date:
            payments = payments.filter(received_at__date__lte=parse_date(end_date))

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="payments.csv"'

        writer = csv.writer(response)
        writer.writerow([
            "ID", "Paciente", "Cita", "Monto", "Método", "Estado",
            "Referencia", "Banco", "Recibido por", "Fecha registro"
        ])
        for p in payments:
            writer.writerow([
                p.pk,
                f"{p.appointment.patient.national_id} - {p.appointment.patient.first_name} {p.appointment.patient.last_name}",
                p.appointment.id,
                p.amount,
                p.method,
                p.status,
                p.reference_number or "",
                p.bank_name or "",
                p.received_by or "",
                p.received_at.strftime("%Y-%m-%d %H:%M") if p.received_at else ""
            ])
        return response

    # 🔹 Exportador Excel (XLSX) con hoja de resumen
    def export_xlsx(self, request):
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")

        payments = Payment.objects.all()
        if start_date:
            payments = payments.filter(received_at__date__gte=parse_date(start_date))
        if end_date:
            payments = payments.filter(received_at__date__lte=parse_date(end_date))

        wb = Workbook()
        ws = wb.active  # type: ignore[attr-defined]
        ws.title = "Pagos"  # type: ignore[attr-defined]

        headers = [
            "ID", "Paciente", "Cita", "Monto", "Método", "Estado",
            "Referencia", "Banco", "Recibido por", "Fecha registro"
        ]
        ws.append(headers)  # type: ignore[attr-defined]

        # Encabezados en negrita
        for col_num, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col_num)  # type: ignore[attr-defined]
            cell.font = Font(bold=True)

        # Filas de datos
        for p in payments:
            ws.append([  # type: ignore[attr-defined]
                p.pk,
                f"{p.appointment.patient.national_id} - {p.appointment.patient.first_name} {p.appointment.patient.last_name}",
                p.appointment.id,
                float(p.amount),
                p.method,
                p.status,
                p.reference_number or "",
                p.bank_name or "",
                p.received_by or "",
                p.received_at.strftime("%Y-%m-%d %H:%M") if p.received_at else ""
            ])

        # Ajustar ancho de columnas
        for col_idx in range(1, len(headers) + 1):
            max_length = 0
            for col_cells in ws.iter_cols(min_col=col_idx, max_col=col_idx, min_row=1, max_row=ws.max_row):  # type: ignore[attr-defined]
                for cell in col_cells:
                    if cell.value:
                        max_length = max(max_length, len(str(cell.value)))
            ws.column_dimensions[get_column_letter(col_idx)].width = max_length + 2  # type: ignore[attr-defined]

        # 🔹 Hoja de resumen
        ws_summary = wb.create_sheet(title="Resumen")  # type: ignore[attr-defined]

        # Totales por método
        totals_by_method = (
            payments.values('method')
            .annotate(total_amount=Sum('amount'), count=Count('id'))
            .order_by('method')
        )
        ws_summary.append(["Totales por Método"])  # type: ignore[attr-defined]
        ws_summary.append(["Método", "Cantidad", "Monto Total"])  # type: ignore[attr-defined]
        for row in totals_by_method:
            ws_summary.append([row['method'], row['count'], float(row['total_amount'] or 0)])  # type: ignore[attr-defined]
        ws_summary.append([])  # type: ignore[attr-defined]

        # Totales por estado
        totals_by_status = (
            payments.values('status')
            .annotate(total_amount=Sum('amount'), count=Count('id'))
            .order_by('status')
        )
        ws_summary.append(["Totales por Estado"])  # type: ignore[attr-defined]
        ws_summary.append(["Estado", "Cantidad", "Monto Total"])  # type: ignore[attr-defined]
        for row in totals_by_status:
            ws_summary.append([row['status'], row['count'], float(row['total_amount'] or 0)])  # type: ignore[attr-defined]
        ws_summary.append([])  # type: ignore[attr-defined]

        # Totales generales
        total_revenue = payments.aggregate(total=Sum('amount'))['total'] or 0
        total_payments = payments.count()
        avg_per_payment = payments.aggregate(avg=Avg('amount'))['avg'] or 0

        ws_summary.append(["Totales Generales"])  # type: ignore[attr-defined]
        ws_summary.append(["Total Recaudado", total_revenue])  # type: ignore[attr-defined]
        ws_summary.append(["Número de Pagos", total_payments])  # type: ignore[attr-defined]
        ws_summary.append(["Promedio por Pago", round(avg_per_payment, 2)])  # type: ignore[attr-defined]

        # Encabezados en negrita en la hoja de resumen
        for row in ws_summary.iter_rows(min_row=2, max_row=2, max_col=3):  # type: ignore[attr-defined]
            for cell in row:
                cell.font = Font(bold=True)

        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response['Content-Disposition'] = 'attachment; filename="payments.xlsx"'
        wb.save(response)  # type: ignore[attr-defined]
        return response
    
    # 🔹 Exportador PDF
    def export_pdf(self, request):
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")
        
        payments = Payment.objects.all()
        if start_date:
            payments = payments.filter(received_at__date__gte=parse_date(start_date))
        if end_date:
            payments = payments.filter(received_at__date__lte=parse_date(end_date))

        # 🔹 Creamos un buffer en memoria
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        # 🔹 Título
        p.setFont("Helvetica-Bold", 14)
        p.drawString(50, height - 50, "Reporte Financiero de Pagos")

        # 🔹 Totales generales
        total_revenue = payments.aggregate(total=Sum('amount'))['total'] or 0
        total_payments = payments.count()
        avg_per_payment = payments.aggregate(avg=Avg('amount'))['avg'] or 0

        p.setFont("Helvetica", 10)
        p.drawString(50, height - 80, f"Total Recaudado: {total_revenue}")
        p.drawString(50, height - 95, f"Número de Pagos: {total_payments}")
        p.drawString(50, height - 110, f"Promedio por Pago: {round(avg_per_payment, 2)}")

        # 🔹 Encabezados de tabla
        y = height - 150
        p.setFont("Helvetica-Bold", 10)
        p.drawString(50, y, "ID")
        p.drawString(100, y, "Paciente")
        p.drawString(250, y, "Monto")
        p.drawString(320, y, "Método")
        p.drawString(400, y, "Estado")

        # 🔹 Filas de pagos
        p.setFont("Helvetica", 9)
        y -= 20
        for pay in payments[:40]:  # límite de 40 filas por página
            p.drawString(50, y, str(pay.pk))
            p.drawString(100, y, f"{pay.appointment.patient.first_name} {pay.appointment.patient.last_name}")
            p.drawString(250, y, str(pay.amount))
            p.drawString(320, y, pay.method)
            p.drawString(400, y, pay.status)
            y -= 15
            if y < 50:  # salto de página
                p.showPage()
                y = height - 50
                p.setFont("Helvetica", 9)

        p.showPage()
        p.save()

        # 🔹 Escribimos el buffer en la respuesta
        pdf = buffer.getvalue()
        buffer.close()

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="payments.pdf"'
        response.write(pdf)
        return response


    # 🔹 Botones extra en la lista de pagos
    def changelist_view(self, request, extra_context=None):
        if extra_context is None:
            extra_context = {}
        report_url = reverse("admin:payment-report")
        export_csv_url = reverse("admin:payment-export-csv")
        export_xlsx_url = reverse("admin:payment-export-xlsx")
        export_pdf_url = reverse("admin:payment-export-pdf")
        extra_context['report_button'] = format_html(
            '<a class="button" href="{}" style="margin-left:10px;">📊 Ver Reporte Financiero</a>'
            '<a class="button" href="{}" style="margin-left:10px;">⬇️ Exportar CSV</a>'
            '<a class="button" href="{}" style="margin-left:10px;">📑 Exportar Excel</a>'
            '<a class="button" href="{}" style="margin-left:10px;">🖨️ Exportar PDF</a>',
            report_url, export_csv_url, export_xlsx_url, export_pdf_url
        )
        return super().changelist_view(request, extra_context=extra_context)
    
    def export_as_xlsx(self, request):
        wb = Workbook()
        ws = wb.active  # type: ignore
        ws.title = "Pagos"  # type: ignore

        headers = ["ID", "Paciente", "Método", "Estado", "Monto", "Fecha"]
        ws.append(headers)  # type: ignore

        for p in Payment.objects.all():  # type: ignore
            created_at = getattr(p, "created_at", None)
            created_str = (
                created_at.strftime("%Y-%m-%d %H:%M") if created_at else ""
            )

            ws.append([  # type: ignore
                getattr(p, "id", ""),
                str(getattr(p, "patient", "")) if getattr(p, "patient", None) else "",
                getattr(p, "method", ""),
                getattr(p, "status", ""),
                float(getattr(p, "amount", 0)),
                created_str,
            ])

        for col_num, column_title in enumerate(headers, 1):
            col_letter = get_column_letter(col_num)
            ws.column_dimensions[col_letter].width = max(15, len(column_title) + 2)  # type: ignore

        output = BytesIO()
        wb.save(output)  # type: ignore
        output.seek(0)

        response = HttpResponse(
            output.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = 'attachment; filename="payments.xlsx"'
        return response

    def export_as_pdf(self, request, queryset=None):
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)

        styles = getSampleStyleSheet()
        elements = []

        # Logo y título
        logo_path = "static/img/logo.png"
        try:
            logo = Image(logo_path, width=80, height=40)
        except Exception:
            logo = Paragraph(" ", styles["Normal"])

        title = Paragraph("Reporte de Pagos", styles["Title"])
        header_table = Table([[title, logo]], colWidths=[400, 100])
        header_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (0, 0), (0, 0), "CENTER"),
            ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ]))
        elements.append(header_table)

        # Fecha de generación
        fecha_str = datetime.now().strftime("%d/%m/%Y %H:%M")
        elements.append(Paragraph(f"Generado el: {fecha_str}", styles["Normal"]))
        elements.append(Spacer(1, 20))

        # Encabezados de tabla principal
        headers = ["ID", "Paciente", "Método", "Estado", "Monto", "Fecha"]
        data = [headers]

        total_amount = 0.0
        method_totals = {}

        # 🔹 Usar queryset filtrado si existe, sino todos
        payments = queryset if queryset is not None else Payment.objects.all()

        for payment in payments:
            created_at = getattr(payment, "created_at", None)
            created_str = created_at.strftime("%Y-%m-%d %H:%M") if created_at else ""

            amount = float(getattr(payment, "amount", 0))
            total_amount += amount

            method = getattr(payment, "method", "Desconocido")
            method_totals[method] = method_totals.get(method, 0.0) + amount

            row = [
                str(getattr(payment, "id", "")),
                str(getattr(payment, "patient", "")) if getattr(payment, "patient", None) else "",
                method,
                getattr(payment, "status", ""),
                f"{amount:.2f}",
                created_str,
            ]
            data.append(row)

        # Totales generales
        data.append(["", "", "", "TOTAL", f"{total_amount:.2f}", ""])

        # Tabla principal
        table = Table(data, colWidths=[40, 120, 80, 80, 80, 100])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#004080")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 10),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#00A676")),
            ("TEXTCOLOR", (0, -1), (-1, -1), colors.white),
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 20))

        # Desglose por método
        elements.append(Paragraph("Totales por método de pago", styles["Heading2"]))
        breakdown_data = [["Método", "Total"]]
        for method, subtotal in method_totals.items():
            breakdown_data.append([method, f"{subtotal:.2f}"])

        breakdown_table = Table(breakdown_data, colWidths=[200, 100])
        breakdown_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#004080")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(breakdown_table)
        elements.append(Spacer(1, 20))

        # 🔹 Gráficos en la misma fila
        if method_totals:
            methods = list(method_totals.keys())
            subtotals = list(method_totals.values())

            # Gráfico de barras
            fig, ax = plt.subplots(figsize=(4, 3))
            ax.bar(methods, subtotals, color="#004080")
            ax.set_title("Totales por método de pago", color="#004080")
            ax.set_ylabel("Monto", color="#004080")
            plt.xticks(rotation=30, ha="right")
            img_buffer = BytesIO()
            plt.savefig(img_buffer, format="PNG", bbox_inches="tight")
            plt.close(fig)
            img_buffer.seek(0)
            bar_chart = Image(img_buffer, width=250, height=180)

            # Gráfico circular
            fig, ax = plt.subplots(figsize=(4, 3))
            corporate_palette = ["#004080", "#00A676", "#FF8C42", "#D72638", "#7ED321"]
            ax.pie(
                subtotals,
                labels=methods,
                autopct="%1.1f%%",
                startangle=90,
                colors=corporate_palette[:len(methods)]
            )
            ax.set_title("Proporción por método de pago", color="#004080")
            img_buffer = BytesIO()
            plt.savefig(img_buffer, format="PNG", bbox_inches="tight")
            plt.close(fig)
            img_buffer.seek(0)
            pie_chart = Image(img_buffer, width=250, height=180)

            # Colocar ambos en la misma fila
            charts_table = Table([[bar_chart, pie_chart]], colWidths=[270, 270])
            charts_table.setStyle(TableStyle([
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]))
            elements.append(charts_table)

        # Pie de página
        def add_footer(canvas, doc):
            canvas.saveState()
            footer_text = f"Clínica MedOps — Página {doc.page}"
            canvas.setFont("Helvetica", 8)
            canvas.drawCentredString(letter[0] / 2.0, 20, footer_text)
            canvas.restoreState()

        doc.build(elements, onFirstPage=add_footer, onLaterPages=add_footer)

        buffer.seek(0)
        response = HttpResponse(buffer, content_type="application/pdf")
        response["Content-Disposition"] = 'attachment; filename="payments.pdf"'
        return response
    
    # 🔹 Acción de exportación
    
    @admin.action(description="Exportar pagos seleccionados a PDF")
    def export_selected_as_pdf(self, request, queryset):
        return self.export_as_pdf(request, queryset)



@admin.register(MedicalDocument)
class MedicalDocumentAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'appointment', 'diagnosis', 'description', 'category', 'uploaded_at', 'preview_file')
    list_display_links = ('id', 'description')
    list_filter = ('category', 'uploaded_at')
    search_fields = ('description', 'category', 'patient__first_name', 'patient__last_name', 'patient__national_id')
    ordering = ('-uploaded_at',)
    list_per_page = 25

    @admin.display(description="Archivo")
    def preview_file(self, obj):
        if obj.file and obj.file.name.lower().endswith((".png", ".jpg", ".jpeg")):
            return format_html('<img src="{}" width="80" height="80" style="object-fit:cover;" />', obj.file.url)
        elif obj.file:
            return format_html('<a href="{}" target="_blank">Descargar</a>', obj.file.url)
        return "-"

# Personalización del panel de administración
admin.site.site_header = "MedOps Clinical System"
admin.site.site_title = "MedOps Admin"
admin.site.index_title = "Panel de Control"
