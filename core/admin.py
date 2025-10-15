from django.contrib import admin
from django.utils.html import format_html
from .models import Patient, Appointment, Diagnosis, Treatment, Prescription, Payment, MedicalDocument


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('id', 'first_name', 'last_name', 'birthdate', 'gender', 'contact_info')
    list_display_links = ('id', 'first_name', 'last_name')
    search_fields = ('first_name', 'last_name', 'contact_info')
    ordering = ('last_name', 'first_name')
    list_per_page = 25


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'appointment_date', 'status')
    list_display_links = ('id', 'patient')
    list_filter = ('status', 'appointment_date')
    search_fields = ('patient__first_name', 'patient__last_name')
    ordering = ('-appointment_date',)
    list_per_page = 25


@admin.register(Diagnosis)
class DiagnosisAdmin(admin.ModelAdmin):
    list_display = ('id', 'appointment', 'code', 'description')
    list_display_links = ('id', 'code')
    search_fields = ('code', 'description')
    ordering = ('code',)
    list_per_page = 25


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
    search_fields = ('medication',)
    ordering = ('medication',)
    list_per_page = 25


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient_name', 'appointment', 'amount', 'method', 'status')
    list_display_links = ('id', 'appointment')
    list_filter = ('method', 'status', 'appointment__appointment_date')
    search_fields = ('appointment__patient__first_name', 'appointment__patient__last_name')
    ordering = ('-appointment__appointment_date',)
    list_per_page = 25

    @admin.display(description="Paciente")
    def patient_name(self, obj):
        return f"{obj.appointment.patient.first_name} {obj.appointment.patient.last_name}"


# Nuevo: MedicalDocument
@admin.register(MedicalDocument)
class MedicalDocumentAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'appointment', 'diagnosis', 'description', 'category', 'uploaded_at', 'preview_file')
    list_display_links = ('id', 'description')
    list_filter = ('category', 'uploaded_at')
    search_fields = ('description', 'category', 'patient__first_name', 'patient__last_name')
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
