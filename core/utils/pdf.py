import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from django.http import HttpResponse

def render_pdf_appointments(queryset, logo_path):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # 🔹 Marca de agua
    c.saveState()
    c.translate(width/4, height/2)
    c.setFont("Helvetica-Bold", 60)
    c.setFillGray(0.9, 0.3)
    c.drawCentredString(0, 0, "MedOps")
    c.restoreState()

    # 🔹 Logo en encabezado
    if logo_path:
        c.drawImage(logo_path, 2*cm, height-3*cm, width=4*cm, preserveAspectRatio=True)

    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width/2, height-2*cm, "Reporte de Citas")

    # 🔹 Totales
    total_expected = sum([a.expected_amount for a in queryset])
    total_paid = sum([a.total_paid() for a in queryset])
    total_balance = sum([a.balance_due() for a in queryset])

    c.setFont("Helvetica", 11)
    c.drawString(2*cm, height-4*cm, f"Total citas: {queryset.count()}")
    c.drawString(2*cm, height-4.7*cm, f"Monto esperado: {total_expected:.2f}")
    c.drawString(2*cm, height-5.4*cm, f"Total pagado: {total_paid:.2f}")
    c.drawString(2*cm, height-6.1*cm, f"Saldo pendiente: {total_balance:.2f}")

    # 🔹 Tabla de detalle (simplificada)
    y = height-7.5*cm
    c.setFont("Helvetica-Bold", 9)
    c.drawString(2*cm, y, "ID")
    c.drawString(3*cm, y, "Paciente")
    c.drawString(8*cm, y, "Fecha")
    c.drawString(12*cm, y, "Estado")
    c.drawString(15*cm, y, "Esperado")
    c.drawString(17*cm, y, "Pagado")

    c.setFont("Helvetica", 8)
    y -= 0.5*cm
    for appt in queryset:
        if y < 3*cm:  # salto de página
            c.showPage()
            y = height-3*cm
        c.drawString(2*cm, y, str(appt.id))
        c.drawString(3*cm, y, str(appt.patient))
        c.drawString(8*cm, y, appt.appointment_date.strftime("%Y-%m-%d"))
        c.drawString(12*cm, y, appt.status)
        c.drawRightString(16.5*cm, y, f"{appt.expected_amount:.2f}")
        c.drawRightString(18.5*cm, y, f"{appt.total_paid():.2f}")
        y -= 0.5*cm

    c.showPage()
    c.save()
    pdf = buffer.getvalue()
    buffer.close()
    return pdf
