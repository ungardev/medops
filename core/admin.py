# Django core
from django.contrib import admin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from django.db.models import Sum, F, DecimalField, Value
from django.db.models.functions import Coalesce
import logging

# App models
from .models import (
    Patient,
    Appointment,
    Diagnosis,
    Treatment,
    Prescription,
    Payment,
    MedicalDocument,
    WaitingRoomEntry,
    GeneticPredisposition,
    ChargeOrder,
    ChargeItem
)

logger = logging.getLogger("core")


# -------------------------
# Waiting Room
# -------------------------
@admin.register(WaitingRoomEntry)
class WaitingRoomEntryAdmin(admin.ModelAdmin):
    list_display = ("patient", "status", "priority", "arrival_time", "order")
    list_filter = ("status", "priority")
    search_fields = ("patient__first_name", "patient__last_name")


# -------------------------
# Inlines de documentos
# -------------------------
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


# -------------------------
# Patient
# -------------------------
@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('id', 'national_id', 'first_name', 'last_name', 'birthdate', 'gender', 'contact_info')
    list_display_links = ('id', 'national_id', 'first_name', 'last_name')
    search_fields = ('national_id', 'first_name', 'last_name', 'contact_info')
    ordering = ('last_name', 'first_name')
    list_per_page = 25
    inlines = [MedicalDocumentInlineForPatient]


# -------------------------
# Appointment
# -------------------------
class BalanceDueFilter(admin.SimpleListFilter):
    title = _('Saldo pendiente')
    parameter_name = 'balance_due'

    def lookups(self, request, model_admin):
        return (('with_balance', _('Con saldo pendiente')), ('no_balance', _('Saldadas')))

    def queryset(self, request, queryset):
        qs = queryset.annotate(
            total_paid_amount=Coalesce(Sum("payments__amount"), Value(0, output_field=DecimalField()))
        )
        if self.value() == "with_balance":
            return qs.filter(expected_amount__gt=F("total_paid_amount"))
        if self.value() == "no_balance":
            return qs.filter(expected_amount__lte=F("total_paid_amount"))
        return qs


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("id","patient","appointment_date","appointment_type","status",
                    "expected_amount","total_paid_display","balance_due_display","is_fully_paid")
    list_display_links = ("id", "patient")
    list_filter = ("status", "appointment_date", "appointment_type", BalanceDueFilter)
    search_fields = ("patient__first_name","patient__last_name","patient__national_id")
    ordering = ("-appointment_date",)
    list_per_page = 25
    inlines = [MedicalDocumentInlineForAppointment]
    readonly_fields = ("total_paid_display", "balance_due_display")

    def total_paid_display(self, obj): return f"{obj.total_paid():.2f}"
    total_paid_display.short_description = "Total Pagado"

    def balance_due_display(self, obj): return f"{obj.balance_due():.2f}"
    balance_due_display.short_description = "Saldo Pendiente"

# -------------------------
# Diagnosis / Treatment / Prescription
# -------------------------
@admin.register(Diagnosis)
class DiagnosisAdmin(admin.ModelAdmin):
    list_display = ('id', 'appointment', 'icd_code', 'title', 'description')
    list_display_links = ('id', 'icd_code')
    search_fields = ('icd_code', 'title', 'description', 'appointment__patient__national_id')
    ordering = ('icd_code',)
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


# -------------------------
# ChargeOrder (centro financiero)
# -------------------------
class ChargeItemInline(admin.TabularInline):
    model = ChargeItem
    extra = 0
    fields = ("code", "description", "qty", "unit_price", "subtotal")
    readonly_fields = ("subtotal",)


class PaymentInlineForChargeOrder(admin.TabularInline):
    model = Payment
    extra = 0
    fields = ("amount","method","status","reference_number","bank_name","received_by","received_at")
    readonly_fields = ("received_at",)
    show_change_link = True


@admin.register(ChargeOrder)
class ChargeOrderAdmin(admin.ModelAdmin):
    list_display = ("id","patient","appointment","currency","total","balance_due","status","issued_at")
    list_filter = ("status","currency","issued_at")
    search_fields = ("patient__first_name","patient__last_name","appointment__id")
    ordering = ("-issued_at",)
    list_per_page = 25
    inlines = [ChargeItemInline, PaymentInlineForChargeOrder]
    readonly_fields = ("total","balance_due","status")

    def changelist_view(self, request, extra_context=None):
        response = super().changelist_view(request, extra_context=extra_context)
        try:
            qs = response.context_data["cl"].queryset
            total_amount = qs.aggregate(total=Sum("total"))["total"] or 0
            balance = qs.aggregate(total=Sum("balance_due"))["total"] or 0
            response.context_data["summary"] = format_html(
                """
                <div class="financial-summary">
                    <strong>Resumen de Órdenes:</strong>
                    <span class="financial-badge expected">Total emitido: {}</span>
                    <span class="financial-badge balance">Saldo pendiente: {}</span>
                </div>
                """,
                f"{total_amount:.2f}", f"{balance:.2f}",
            )
        except Exception: 
            pass
        return response


# -------------------------
# Payment (visor simple)
# -------------------------
@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id","charge_order","appointment","amount","method","status","received_at")
    list_filter = ("status","method")
    search_fields = ("charge_order__id","appointment__id","reference_number")
    ordering = ("-received_at",)
    list_per_page = 25
    readonly_fields = ("received_at",)


# -------------------------
# Genetic Predisposition
# -------------------------
@admin.register(GeneticPredisposition)
class GeneticPredispositionAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "description")
    search_fields = ("name", "description")
    ordering = ("name",)
    list_per_page = 25


# -------------------------
# Medical Document (visor global)
# -------------------------
@admin.register(MedicalDocument)
class MedicalDocumentAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "appointment", "diagnosis", "category", "description", "uploaded_at", "uploaded_by")
    list_filter = ("category", "uploaded_at")
    search_fields = ("description", "patient__first_name", "patient__last_name", "appointment__id")
    ordering = ("-uploaded_at",)
    list_per_page = 25


# Personalización del panel de administración
admin.site.site_header = "MedOps Clinical System"
admin.site.site_title = "MedOps Admin"
admin.site.index_title = "Panel de Control"
