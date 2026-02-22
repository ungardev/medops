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
    PrescriptionComponent,
    Payment,
    MedicalDocument,
    WaitingRoomEntry,
    GeneticPredisposition,
    ChargeOrder,
    ChargeItem,
    MedicalTest,
    MedicalReferral,
    DoctorOperator,
    Specialty,
    MedicationCatalog,
    PersonalHistory,
    FamilyHistory,
    Surgery,
    Habit,
    Vaccine,
    VaccinationSchedule,
    PatientVaccination,
    # --- NUEVOS: Direcciones ---
    Country,
    State,
    Municipality,
    City,
    Parish,
    Neighborhood,
    # --- NUEVOS: Auditoría y Config ---
    Event,
    InstitutionSettings,
    # --- NUEVOS: Catálogo de Facturación ---
    BillingCategory,
    BillingItem,
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
    extra = 0
    fields = ("file", "description", "category", "source", "template_version", "is_signed", "preview_file")
    readonly_fields = ("source", "template_version", "is_signed", "preview_file")

    @admin.display(description="Archivo")
    def preview_file(self, obj):
        if obj.file and obj.mime_type.startswith("image/"):
            return format_html('<img src="{}" width="60" height="60" style="object-fit:cover;" />', obj.file.url)
        elif obj.file and obj.mime_type == "application/pdf":
            return format_html('<a href="{}" target="_blank">Descargar PDF</a>', obj.file.url)
        elif obj.file:
            return format_html('<a href="{}" target="_blank">Descargar</a>', obj.file.url)
        return "-"


class MedicalDocumentInlineForAppointment(admin.TabularInline):
    model = MedicalDocument
    extra = 0
    fields = ("file", "description", "category", "source", "template_version", "is_signed", "preview_file")
    readonly_fields = ("source", "template_version", "is_signed", "preview_file")

    @admin.display(description="Archivo")
    def preview_file(self, obj):
        if obj.file and obj.mime_type.startswith("image/"):
            return format_html('<img src="{}" width="60" height="60" style="object-fit:cover;" />', obj.file.url)
        elif obj.file and obj.mime_type == "application/pdf":
            return format_html('<a href="{}" target="_blank">Descargar PDF</a>', obj.file.url)
        elif obj.file:
            return format_html('<a href="{}" target="_blank">Descargar</a>', obj.file.url)
        return "-"


class MedicalDocumentInlineForDiagnosis(admin.TabularInline):
    model = MedicalDocument
    extra = 0
    fields = ("file", "description", "category", "source", "template_version", "is_signed", "preview_file")
    readonly_fields = ("source", "template_version", "is_signed", "preview_file")

    @admin.display(description="Archivo")
    def preview_file(self, obj):
        if obj.file and obj.mime_type.startswith("image/"):
            return format_html('<img src="{}" width="60" height="60" style="object-fit:cover;" />', obj.file.url)
        elif obj.file and obj.mime_type == "application/pdf":
            return format_html('<a href="{}" target="_blank">Descargar PDF</a>', obj.file.url)
        elif obj.file:
            return format_html('<a href="{}" target="_blank">Descargar</a>', obj.file.url)
        return "-"


# -------------------------
# Patient
# -------------------------
@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'national_id',
        'first_name',
        'last_name',
        'birthdate',
        'birth_place',        # 👈 NUEVO
        'birth_country',      # 👈 NUEVO
        'gender',
        'contact_info'
    )
    list_display_links = ('id', 'national_id', 'first_name', 'last_name')
    search_fields = (
        'national_id',
        'first_name',
        'last_name',
        'contact_info',
        'birth_place',        # 👈 NUEVO
        'birth_country'       # 👈 NUEVO
    )
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
    list_display = ('id', 'diagnosis', 'treatment_type', 'plan', 'start_date', 'end_date', 'status')
    list_display_links = ('id', 'diagnosis')
    list_filter = ('treatment_type', 'status')
    ordering = ('-start_date',)
    list_per_page = 25


class PrescriptionComponentInline(admin.TabularInline):
    model = PrescriptionComponent
    extra = 1


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ("id", "diagnosis", "get_medication_display", "route", "frequency", "duration")
    list_display_links = ("id", "get_medication_display")
    list_filter = ("route", "frequency")
    search_fields = (
        "medication_text",
        "medication_catalog__name",
        "medication_catalog__concentration",
        "diagnosis__appointment__patient__national_id"
    )
    ordering = ("id",)
    list_per_page = 25
    inlines = [PrescriptionComponentInline]

    @admin.display(description="Medicamento")
    def get_medication_display(self, obj):
        return obj.medication_catalog or obj.medication_text or "—"

# -------------------------
# MedicalTest
# -------------------------
@admin.register(MedicalTest)
class MedicalTestAdmin(admin.ModelAdmin):
    list_display = ("id", "appointment", "diagnosis", "test_type", "urgency", "status", "description")
    list_filter = ("test_type", "urgency", "status")
    search_fields = ("appointment__patient__first_name", "appointment__patient__last_name", "diagnosis__icd_code")
    ordering = ("id",)
    list_per_page = 25


# -------------------------
# MedicalReferral
# -------------------------
@admin.register(MedicalReferral)
class MedicalReferralAdmin(admin.ModelAdmin):
    list_display = ("id", "appointment", "diagnosis", "get_specialties_display", "urgency", "status", "reason")
    list_filter = ("urgency", "status")
    search_fields = (
        "appointment__patient__first_name",
        "appointment__patient__last_name",
        "diagnosis__icd_code",
        "reason"
    )
    autocomplete_fields = ["appointment", "diagnosis", "specialties"]
    ordering = ("id",)
    list_per_page = 25

    @admin.display(description="Especialidades referidas")
    def get_specialties_display(self, obj):
        return ", ".join([s.name for s in obj.specialties.all()])


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
    list_display = (
        "id", "patient", "appointment", "diagnosis",
        "category", "source", "origin_panel",
        "description", "template_version", "is_signed",
        "uploaded_at", "uploaded_by", "generated_by"
    )
    list_filter = ("category", "source", "template_version", "is_signed", "uploaded_at")
    search_fields = (
        "description", "patient__first_name", "patient__last_name",
        "appointment__id", "diagnosis__icd_code"
    )
    ordering = ("-uploaded_at",)
    list_per_page = 25
    readonly_fields = ("checksum_sha256", "size_bytes", "mime_type", "uploaded_at")

    @admin.display(description="Archivo")
    def preview_file(self, obj):
        if obj.file and obj.mime_type.startswith("image/"):
            return format_html('<img src="{}" width="60" height="60" style="object-fit:cover;" />', obj.file.url)
        elif obj.file and obj.mime_type == "application/pdf":
            return format_html('<a href="{}" target="_blank">Descargar PDF</a>', obj.file.url)
        elif obj.file:
            return format_html('<a href="{}" target="_blank">Descargar</a>', obj.file.url)
        return "-"


# -------------------------
# DoctorOperator / Specialty / MedicationCatalog
# -------------------------
@admin.register(DoctorOperator)
class DoctorOperatorAdmin(admin.ModelAdmin):
    list_display = ("full_name", "colegiado_id", "get_specialties_display", "email", "phone")
    search_fields = ("full_name", "colegiado_id", "email", "phone")
    autocomplete_fields = ["specialties"]
    ordering = ("full_name",)
    list_per_page = 25

    @admin.display(description="Especialidades")
    def get_specialties_display(self, obj):
        return ", ".join([s.name for s in obj.specialties.all()])


@admin.register(Specialty)
class SpecialtyAdmin(admin.ModelAdmin):
    list_display = ("code", "name")
    search_fields = ("code", "name")
    ordering = ("name",)
    list_per_page = 50


@admin.register(MedicationCatalog)
class MedicationCatalogAdmin(admin.ModelAdmin):
    list_display = ["name", "presentation", "concentration", "route", "unit"]
    search_fields = ["name", "concentration"]
    list_filter = ["presentation", "route", "unit"]
    ordering = ["name"]


@admin.register(PersonalHistory)
class PersonalHistoryAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "type", "date", "created_at")
    list_filter = ("type", "date")
    search_fields = ("patient__first_name", "patient__last_name", "description")
    ordering = ("-date",)
    list_per_page = 25


@admin.register(FamilyHistory)
class FamilyHistoryAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "condition", "relative", "created_at")
    list_filter = ("relative",)
    search_fields = ("patient__first_name", "patient__last_name", "condition", "relative")
    ordering = ("-created_at",)
    list_per_page = 25


@admin.register(Surgery)
class SurgeryAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "name", "date", "hospital", "created_at")
    list_filter = ("date",)
    search_fields = ("patient__first_name", "patient__last_name", "name", "hospital")
    ordering = ("-date",)
    list_per_page = 25


@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "type", "created_at")
    list_filter = ("type",)
    search_fields = ("patient__first_name", "patient__last_name", "description")
    ordering = ("-created_at",)
    list_per_page = 25


@admin.register(Vaccine)
class VaccineAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "country")
    search_fields = ("code", "name")
    list_filter = ("country",)
    ordering = ("code",)
    list_per_page = 50


@admin.register(VaccinationSchedule)
class VaccinationScheduleAdmin(admin.ModelAdmin):
    list_display = ("vaccine", "dose_number", "recommended_age_months", "country")
    list_filter = ("country", "vaccine")
    search_fields = ("vaccine__code", "vaccine__name")
    ordering = ("recommended_age_months", "dose_number")
    list_per_page = 50


@admin.register(PatientVaccination)
class PatientVaccinationAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "vaccine", "dose_number", "date_administered", "center")
    list_filter = ("vaccine", "dose_number")
    search_fields = (
        "patient__first_name",
        "patient__last_name",
        "vaccine__code",
        "vaccine__name",
        "center",
        "lot",
    )
    ordering = ("-date_administered",)
    list_per_page = 25


@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)
    ordering = ("name",)
    list_per_page = 50


@admin.register(State)
class StateAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "country")
    list_filter = ("country",)
    search_fields = ("name", "country__name")
    ordering = ("country__name", "name")
    list_per_page = 50


@admin.register(Municipality)
class MunicipalityAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "state")
    list_filter = ("state__country", "state")
    search_fields = ("name", "state__name")
    ordering = ("state__name", "name")
    list_per_page = 50


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "state")
    list_filter = ("state__country", "state")
    search_fields = ("name", "state__name")
    ordering = ("state__name", "name")
    list_per_page = 50


@admin.register(Parish)
class ParishAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "municipality")
    list_filter = ("municipality__state", "municipality")
    search_fields = ("name", "municipality__name")
    ordering = ("municipality__name", "name")
    list_per_page = 50


@admin.register(Neighborhood)
class NeighborhoodAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "parish")
    list_filter = ("parish__municipality", "parish")
    search_fields = ("name", "parish__name")
    ordering = ("parish__name", "name")
    list_per_page = 50


# =====================================================
# EVENTOS - AUDITORÍA DEL SISTEMA
# =====================================================
@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("id", "timestamp", "institution", "entity", "entity_id", "action", "severity", "is_read")
    list_filter = ("severity", "entity", "institution", "is_read")
    search_fields = ("entity", "entity_id", "action", "actor_name")
    ordering = ("-timestamp",)
    list_per_page = 50
    readonly_fields = ("timestamp", "institution", "actor_user", "actor_name", "entity", "entity_id", "action", "metadata", "severity", "notify")


# =====================================================
# INSTITUTION SETTINGS - CONFIGURACIÓN DE SEDE
# =====================================================
@admin.register(InstitutionSettings)
class InstitutionSettingsAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "tax_id", "phone", "active_gateway", "is_active")
    list_filter = ("is_active", "active_gateway")
    search_fields = ("name", "tax_id", "phone")
    ordering = ("name",)
    list_per_page = 25
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Identidad", {
            "fields": ("name", "tax_id", "logo", "phone", "address", "neighborhood")
        }),
        ("Pasarela de Pagos", {
            "fields": ("active_gateway", "gateway_api_key", "gateway_secret_key", "gateway_webhook_secret")
        }),
        ("Configuración P2C Mercantil", {
            "classes": ("collapse",),
            "fields": ("mercantil_client_id", "mercantil_secret_key", "mercantil_test_mode")
        }),
        ("Estado", {
            "fields": ("is_active", "created_at", "updated_at", "created_by", "updated_by")
        }),
    )
# =====================================================
# CATÁLOGO DE FACTURACIÓN - BILLING CATALOG
# =====================================================
class BillingItemInline(admin.TabularInline):
    model = BillingItem
    extra = 0
    fields = ("code", "name", "unit_price", "is_active")
    readonly_fields = ("code", "name", "unit_price")
    show_change_link = True


@admin.register(BillingCategory)
class BillingCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "code_prefix", "name", "institution", "is_active", "sort_order", "items_count")
    list_filter = ("institution", "is_active")
    search_fields = ("name", "code_prefix")
    ordering = ("institution", "sort_order", "name")
    list_per_page = 50
    inlines = [BillingItemInline]
    
    @admin.display(description="Items")
    def items_count(self, obj):
        return obj.items.count()


@admin.register(BillingItem)
class BillingItemAdmin(admin.ModelAdmin):
    list_display = ("id", "code", "name", "category", "unit_price", "currency", "is_active", "institution")
    list_filter = ("institution", "category", "is_active", "currency")
    search_fields = ("code", "name", "description")
    ordering = ("institution", "category__sort_order", "sort_order", "code")
    list_per_page = 50
    list_editable = ("unit_price", "is_active")
    readonly_fields = ("created_at", "updated_at", "created_by")
    
    fieldsets = (
        ("Identificación", {
            "fields": ("institution", "category", "code", "name", "description")
        }),
        ("Precio", {
            "fields": ("unit_price", "currency")
        }),
        ("Metadatos", {
            "fields": ("estimated_duration", "sort_order", "is_active")
        }),
        ("Auditoría", {
            "classes": ("collapse",),
            "fields": ("created_at", "updated_at", "created_by")
        }),
    )


# Personalización del panel de administración
admin.site.site_header = "MedOps Clinical System"
admin.site.site_title = "MedOps Admin"
admin.site.index_title = "Panel de Control"
