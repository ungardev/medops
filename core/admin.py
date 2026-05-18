# Django core
from django.contrib import admin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from django.db.models import Sum, F, DecimalField, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
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
    DoctorInvitation,
    DoctorLicense,
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
    fields = (
        "file",
        "description",
        "category",
        "source",
        "template_version",
        "is_signed",
        "preview_file",
    )
    readonly_fields = ("source", "template_version", "is_signed", "preview_file")

    @admin.display(description="Archivo")
    def preview_file(self, obj):
        if obj.file and obj.mime_type.startswith("image/"):
            return format_html(
                '<img src="{}" width="60" height="60" style="object-fit:cover;" />',
                obj.file.url,
            )
        elif obj.file and obj.mime_type == "application/pdf":
            return format_html(
                '<a href="{}" target="_blank">Descargar PDF</a>', obj.file.url
            )
        elif obj.file:
            return format_html(
                '<a href="{}" target="_blank">Descargar</a>', obj.file.url
            )
        return "-"


class MedicalDocumentInlineForAppointment(admin.TabularInline):
    model = MedicalDocument
    extra = 0
    fields = (
        "file",
        "description",
        "category",
        "source",
        "template_version",
        "is_signed",
        "preview_file",
    )
    readonly_fields = ("source", "template_version", "is_signed", "preview_file")

    @admin.display(description="Archivo")
    def preview_file(self, obj):
        if obj.file and obj.mime_type.startswith("image/"):
            return format_html(
                '<img src="{}" width="60" height="60" style="object-fit:cover;" />',
                obj.file.url,
            )
        elif obj.file and obj.mime_type == "application/pdf":
            return format_html(
                '<a href="{}" target="_blank">Descargar PDF</a>', obj.file.url
            )
        elif obj.file:
            return format_html(
                '<a href="{}" target="_blank">Descargar</a>', obj.file.url
            )
        return "-"


class MedicalDocumentInlineForDiagnosis(admin.TabularInline):
    model = MedicalDocument
    extra = 0
    fields = (
        "file",
        "description",
        "category",
        "source",
        "template_version",
        "is_signed",
        "preview_file",
    )
    readonly_fields = ("source", "template_version", "is_signed", "preview_file")

    @admin.display(description="Archivo")
    def preview_file(self, obj):
        if obj.file and obj.mime_type.startswith("image/"):
            return format_html(
                '<img src="{}" width="60" height="60" style="object-fit:cover;" />',
                obj.file.url,
            )
        elif obj.file and obj.mime_type == "application/pdf":
            return format_html(
                '<a href="{}" target="_blank">Descargar PDF</a>', obj.file.url
            )
        elif obj.file:
            return format_html(
                '<a href="{}" target="_blank">Descargar</a>', obj.file.url
            )
        return "-"


# -------------------------
# Patient
# -------------------------
@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "national_id",
        "first_name",
        "last_name",
        "birthdate",
        "birth_place",  # 👈 NUEVO
        "birth_country",  # 👈 NUEVO
        "gender",
        "contact_info",
    )
    list_display_links = ("id", "national_id", "first_name", "last_name")
    search_fields = (
        "national_id",
        "first_name",
        "last_name",
        "contact_info",
        "birth_place",  # 👈 NUEVO
        "birth_country",  # 👈 NUEVO
    )
    ordering = ("last_name", "first_name")
    list_per_page = 25
    inlines = [MedicalDocumentInlineForPatient]


# -------------------------
# Appointment
# -------------------------
class BalanceDueFilter(admin.SimpleListFilter):
    title = _("Saldo pendiente")
    parameter_name = "balance_due"

    def lookups(self, request, model_admin):
        return (
            ("with_balance", _("Con saldo pendiente")),
            ("no_balance", _("Saldadas")),
        )

    def queryset(self, request, queryset):
        qs = queryset.annotate(
            total_paid_amount=Coalesce(
                Sum("payments__amount"), Value(0, output_field=DecimalField())
            )
        )
        if self.value() == "with_balance":
            return qs.filter(expected_amount__gt=F("total_paid_amount"))
        if self.value() == "no_balance":
            return qs.filter(expected_amount__lte=F("total_paid_amount"))
        return qs


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "patient",
        "appointment_date",
        "appointment_type",
        "status",
        "expected_amount",
        "total_paid_display",
        "balance_due_display",
        "is_fully_paid",
    )
    list_display_links = ("id", "patient")
    list_filter = ("status", "appointment_date", "appointment_type", BalanceDueFilter)
    search_fields = (
        "patient__first_name",
        "patient__last_name",
        "patient__national_id",
    )
    ordering = ("-appointment_date",)
    list_per_page = 25
    inlines = [MedicalDocumentInlineForAppointment]
    readonly_fields = ("total_paid_display", "balance_due_display")

    def total_paid_display(self, obj):
        return f"{obj.total_paid():.2f}"

    total_paid_display.short_description = "Total Pagado"

    def balance_due_display(self, obj):
        return f"{obj.balance_due():.2f}"

    balance_due_display.short_description = "Saldo Pendiente"


# -------------------------
# Diagnosis / Treatment / Prescription
# -------------------------
@admin.register(Diagnosis)
class DiagnosisAdmin(admin.ModelAdmin):
    list_display = ("id", "appointment", "icd_code", "title", "description")
    list_display_links = ("id", "icd_code")
    search_fields = (
        "icd_code",
        "title",
        "description",
        "appointment__patient__national_id",
    )
    ordering = ("icd_code",)
    list_per_page = 25
    inlines = [MedicalDocumentInlineForDiagnosis]


@admin.register(Treatment)
class TreatmentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "diagnosis",
        "treatment_type",
        "plan",
        "start_date",
        "end_date",
        "status",
    )
    list_display_links = ("id", "diagnosis")
    list_filter = ("treatment_type", "status")
    ordering = ("-start_date",)
    list_per_page = 25


class PrescriptionComponentInline(admin.TabularInline):
    model = PrescriptionComponent
    extra = 1


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "diagnosis",
        "get_medication_display",
        "route",
        "frequency",
        "duration",
    )
    list_display_links = ("id", "get_medication_display")
    list_filter = ("route", "frequency")
    search_fields = (
        "medication_text",
        "medication_catalog__name",
        "medication_catalog__concentration",
        "diagnosis__appointment__patient__national_id",
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
    list_display = (
        "id",
        "appointment",
        "diagnosis",
        "test_type",
        "urgency",
        "status",
        "description",
    )
    list_filter = ("test_type", "urgency", "status")
    search_fields = (
        "appointment__patient__first_name",
        "appointment__patient__last_name",
        "diagnosis__icd_code",
    )
    ordering = ("id",)
    list_per_page = 25


# -------------------------
# MedicalReferral
# -------------------------
@admin.register(MedicalReferral)
class MedicalReferralAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "appointment",
        "diagnosis",
        "get_specialties_display",
        "urgency",
        "status",
        "reason",
    )
    list_filter = ("urgency", "status")
    search_fields = (
        "appointment__patient__first_name",
        "appointment__patient__last_name",
        "diagnosis__icd_code",
        "reason",
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
    fields = (
        "amount",
        "method",
        "status",
        "reference_number",
        "bank_name",
        "received_by",
        "received_at",
    )
    readonly_fields = ("received_at",)
    show_change_link = True


@admin.register(ChargeOrder)
class ChargeOrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "patient",
        "appointment",
        "currency",
        "total",
        "balance_due",
        "status",
        "issued_at",
    )
    list_filter = ("status", "currency", "issued_at")
    search_fields = ("patient__first_name", "patient__last_name", "appointment__id")
    ordering = ("-issued_at",)
    list_per_page = 25
    inlines = [ChargeItemInline, PaymentInlineForChargeOrder]
    readonly_fields = ("total", "balance_due", "status")

    def changelist_view(self, request, extra_context=None):
        response = super().changelist_view(request, extra_context=extra_context)

        # VERIFICAR QUE RESPONSE NO SEA NONE
        if response is not None:
            try:
                # Verificar que context_data existe
                if hasattr(response, "context_data") and response.context_data:
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
                        f"{total_amount:.2f}",
                        f"{balance:.2f}",
                    )
            except Exception:
                pass

        return response


# -------------------------
# Payment (visor simple)
# -------------------------
@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "charge_order",
        "appointment",
        "amount",
        "method",
        "status",
        "received_at",
    )
    list_filter = ("status", "method")
    search_fields = ("charge_order__id", "appointment__id", "reference_number")
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
        "id",
        "patient",
        "appointment",
        "diagnosis",
        "category",
        "source",
        "origin_panel",
        "description",
        "template_version",
        "is_signed",
        "uploaded_at",
        "uploaded_by",
        "generated_by",
    )
    list_filter = ("category", "source", "template_version", "is_signed", "uploaded_at")
    search_fields = (
        "description",
        "patient__first_name",
        "patient__last_name",
        "appointment__id",
        "diagnosis__icd_code",
    )
    ordering = ("-uploaded_at",)
    list_per_page = 25
    readonly_fields = ("checksum_sha256", "size_bytes", "mime_type", "uploaded_at")

    @admin.display(description="Archivo")
    def preview_file(self, obj):
        if obj.file and obj.mime_type.startswith("image/"):
            return format_html(
                '<img src="{}" width="60" height="60" style="object-fit:cover;" />',
                obj.file.url,
            )
        elif obj.file and obj.mime_type == "application/pdf":
            return format_html(
                '<a href="{}" target="_blank">Descargar PDF</a>', obj.file.url
            )
        elif obj.file:
            return format_html(
                '<a href="{}" target="_blank">Descargar</a>', obj.file.url
            )
        return "-"


# -------------------------
# DoctorOperator / Specialty / MedicationCatalog
# -------------------------
@admin.register(DoctorOperator)
class DoctorOperatorAdmin(admin.ModelAdmin):
    list_display = (
        "full_name",
        "national_id",
        "agregado_id",
        "license_status_badge",
        "is_verified_badge",
        "get_specialties_display",
        "active_institution",
        "created_at",
    )
    search_fields = (
        "full_name",
        "national_id",
        "agregado_id",
        "license",
        "email",
        "phone",
        "user__username",
    )
    list_filter = ("is_verified", "is_active_license", "gender", "created_at")
    autocomplete_fields = ["specialties", "institutions", "active_institution", "user"]
    ordering = ("full_name",)
    list_per_page = 25
    list_select_related = ("active_institution", "user")

    actions = [
        "approve_verification",
        "reject_verification",
        "mark_license_active",
        "mark_license_expired",
    ]

    fieldsets = (
        (
            "IDENTIDAD LEGAL MPPS VENEZUELA",
            {
                "fields": (
                    "user",
                    "full_name",
                    ("national_id", "birthdate"),
                    ("birth_country", "gender"),
                ),
                "description": "Datos oficiales de identidad para cumplimiento MPPS.",
            },
        ),
        (
            "CREDENCIALES MÉDICAS MPPS",
            {
                "fields": (
                    "colegiado_number",
                    "license",
                    ("license_expiry_date", "is_active_license"),
                ),
                "description": "Número de colegiado y licencia sanitaria vigente.",
            },
        ),
        (
            "ESPECIALIDADES Y NOMENCLATURA",
            {
                "fields": (
                    "specialties",
                    "active_institution",
                )
            },
        ),
        (
            "VERIFICACIÓN Y AUDITORÍA",
            {
                "fields": (
                    "is_verified",
                    "verification_notes",
                ),
                "description": "Control de verificación ante el Colegio de Médicos.",
            },
        ),
        (
            "CONTACTO Y COMUNICACIÓN",
            {
                "fields": (
                    ("email", "phone"),
                    ("whatsapp_business_number", "whatsapp_enabled"),
                )
            },
        ),
        (
            "PERFIL PÚBLICO (Portal Paciente)",
            {
                "fields": (("bio", "photo"),),
                "classes": ("collapse",),
            },
        ),
        (
            "DOCUMENTACIÓN LEGAL",
            {
                "fields": (("signature",),),
                "classes": ("collapse",),
            },
        ),
        (
            "NOTIFICACIONES AUTOMÁTICAS",
            {
                "fields": (("reminder_hours_before",),),
                "classes": ("collapse",),
            },
        ),
        (
            "INSTITUCIONES Y ACCESO",
            {"fields": ("institutions",)},
        ),
        (
            "AUDITORÍA DE SISTEMA",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                    "updated_by",
                ),
                "classes": ("collapse",),
            },
        ),
    )

    @admin.display(description="Especialidades")
    def get_specialties_display(self, obj):
        return ", ".join([s.name for s in obj.specialties.all()])

    @admin.display(description="Licencia", ordering="is_active_license")
    def license_status_badge(self, obj):
        if not obj.license_expiry_date:
            return format_html(
                '<span style="background:#94a3b8;color:white;padding:2px 8px;border-radius:12px;font-size:11px;">❓ SIN FECHA</span>'
            )
        from datetime import date

        today = date.today()
        delta = (obj.license_expiry_date - today).days
        if delta < 0:
            return format_html(
                '<span style="background:#dc2626;color:white;padding:2px 8px;border-radius:12px;font-size:11px;">❌ EXPIRADA</span>'
            )
        elif delta <= 90:
            return format_html(
                '<span style="background:#f59e0b;color:white;padding:2px 8px;border-radius:12px;font-size:11px;">⚠️ POR EXPIRAR</span>'
            )
        return format_html(
            '<span style="background:#22c55e;color:white;padding:2px 8px;border-radius:12px;font-size:11px;">✅ ACTIVA</span>'
        )

    @admin.display(description="Verificado", ordering="is_verified")
    def is_verified_badge(self, obj):
        if obj.is_verified:
            return format_html(
                '<span style="background:#22c55e;color:white;padding:2px 8px;border-radius:12px;font-size:11px;">✓ VERIFICADO</span>'
            )
        else:
            return format_html(
                '<span style="background:#ef4444;color:white;padding:2px 8px;border-radius:12px;font-size:11px;">⏳ PENDIENTE</span>'
            )

    @admin.action(description="Aprobar verificación del médico seleccionado")
    def approve_verification(self, request, queryset):
        for doctor in queryset.filter(is_verified=False):
            doctor.is_verified = True
            doctor.save(update_fields=["is_verified"])
            logger.info(f"Doctor {doctor.full_name} verificado por {request.user}")

    @admin.action(description="Rechazar/quitar verificación del médico seleccionado")
    def reject_verification(self, request, queryset):
        for doctor in queryset.filter(is_verified=True):
            doctor.is_verified = False
            doctor.save(update_fields=["is_verified"])
            logger.info(
                f"Verificación removida de {doctor.full_name} por {request.user}"
            )

    @admin.action(description="Marcar licencia como activa")
    def mark_license_active(self, request, queryset):
        for doctor in queryset.filter(is_active_license=False):
            doctor.is_active_license = True
            doctor.save(update_fields=["is_active_license"])
            logger.info(f"Licencia de {doctor.full_name} marcada como activa")

    @admin.action(description="Marcar licencia como expirada")
    def mark_license_expired(self, request, queryset):
        for doctor in queryset.filter(is_active_license=True):
            doctor.is_active_license = False
            doctor.save(update_fields=["is_active_license"])
            logger.info(f"Licencia de {doctor.full_name} marcada como expirada")


@admin.register(DoctorInvitation)
class DoctorInvitationAdmin(admin.ModelAdmin):
    list_display = (
        "full_name",
        "national_id",
        "colegiado_number",
        "email",
        "institution",
        "specialty",
        "status_badge",
        "expires_at",
        "created_at",
    )
    list_filter = ("is_used", "institution", "specialty", "created_at")
    search_fields = (
        "full_name",
        "national_id",
        "colegiado_number",
        "email",
        "institution__name",
    )
    readonly_fields = (
        "token",
        "created_at",
        "used_at",
    )
    autocomplete_fields = ["specialty", "institution", "invited_by", "used_by"]
    ordering = ("-created_at",)
    list_per_page = 25

    fieldsets = (
        (
            "IDENTIFICACIÓN LEGAL DEL MÉDICO",
            {
                "fields": (
                    "full_name",
                    "national_id",
                    "colegiado_number",
                    "license_number",
                ),
                "description": "Datos oficiales para verificación ante el MPPS y Colegio de Médicos.",
            },
        ),
        (
            "DATOS DE CONTACTO",
            {
                "fields": (
                    "email",
                    "institution",
                    "specialty",
                )
            },
        ),
        (
            "Token y Expiración",
            {
                "fields": (
                    "token",
                    "expires_at",
                ),
                "description": "El token se genera automáticamente al guardar. La invitación expira en 7 días.",
            },
        ),
        (
            "Estado de Uso",
            {
                "fields": (
                    "is_used",
                    "used_at",
                    "used_by",
                )
            },
        ),
        (
            "Auditoría",
            {
                "fields": (
                    "invited_by",
                    "created_at",
                )
            },
        ),
    )

    @admin.display(description="Estado", ordering="is_used")
    def status_badge(self, obj):
        if obj.is_used:
            return format_html(
                '<span style="background:#22c55e;color:white;padding:2px 8px;border-radius:12px;font-size:11px;">UTILIZADA</span>'
            )
        elif obj.is_expired():
            return format_html(
                '<span style="background:#ef4444;color:white;padding:2px 8px;border-radius:12px;font-size:11px;">EXPIRADA</span>'
            )
        else:
            return format_html(
                '<span style="background:#3b82f6;color:white;padding:2px 8px;border-radius:12px;font-size:11px;">PENDIENTE</span>'
            )

    @admin.display(description="Email", boolean=True)
    def sent_email_icon(self, obj):
        return True

    def save_model(self, request, obj, form, change):
        is_new = obj.pk is None

        if is_new:
            obj.token = DoctorInvitation.generate_token()
            obj.invited_by = request.user
            from django.utils import timezone

            if not obj.expires_at:
                obj.expires_at = timezone.now() + timezone.timedelta(days=7)

        super().save_model(request, obj, form, change)

        if is_new and obj.email:
            self._send_invitation_email(obj)

    def _send_invitation_email(self, invitation):
        from django.conf import settings
        from django.core.mail import send_mail
        from django.utils.html import format_html

        SITE_URL = getattr(settings, "SITE_URL", "https://medopz.com")
        activation_url = f"{SITE_URL}/doctor/activate?token={invitation.token}"

        gender_prefix = (
            "Dr."
            if (hasattr(invitation, "gender") and invitation.gender == "M")
            else "Dra."
        )

        specialty_text = ""
        if invitation.specialty:
            specialty_text = (
                f"\n• <strong>Especialidad:</strong> {invitation.specialty.name}"
            )

        institution_address = ""
        if invitation.institution:
            if invitation.institution.address:
                institution_address = (
                    f"\n• <strong>Dirección:</strong> {invitation.institution.address}"
                )
            if invitation.institution.tax_id:
                institution_address += (
                    f"\n• <strong>RIF:</strong> {invitation.institution.tax_id}"
                )

        subject = f"[MEDOPZ] Invitación para unirse como Médico Operador - {invitation.full_name}"

        html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }}
        .data-box {{ background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #1e40af; }}
        .data-row {{ margin: 8px 0; }}
        .label {{ font-weight: bold; color: #475569; }}
        .value {{ color: #1e293b; }}
        .button {{ display: inline-block; background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
        .footer {{ text-align: center; padding: 20px; color: #64748b; font-size: 12px; }}
        .warning {{ background: #fef3c7; padding: 10px; border-radius: 6px; color: #92400e; font-size: 13px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 MEDOPZ</h1>
            <p style="margin: 0; font-size: 18px;">Sistema Operativo de Salud Inteligente</p>
        </div>
        <div class="content">
            <p>Estimado <strong>{gender_prefix} {invitation.full_name}</strong>,</p>
            
            <p>El <strong>{invitation.institution.name}</strong> le ha extendido una invitación para unirse a <strong>MEDOPZ</strong>, el Sistema Operativo de Salud Inteligente de Venezuela.</p>
            
            <div class="data-box">
                <h3 style="margin-top: 0; color: #1e40af;">📋 DATOS DE SU INVITACIÓN</h3>
                <div class="data-row">
                    <span class="label">Institución Convocante:</span>
                    <span class="value">{invitation.institution.name}</span>
                </div>
                {institution_address}
                <div class="data-row">
                    <span class="label">Número de Colegiado:</span>
                    <span class="value">{invitation.colegiado_number}</span>
                </div>
                {specialty_text}
            </div>
            
            <p style="text-align: center;">
                <a href="{activation_url}" class="button">ACTIVAR MI CUENTA</a>
            </p>
            
            <div class="warning">
                ⚠️ <strong>IMPORTANTE:</strong> Este enlace expira en <strong>7 días</strong>. Si no solicitó esta invitación, ignore este mensaje.
            </div>
            
            <p>Una vez active su cuenta, nuestro equipo de administración verificará sus credenciales médicas antes de habilitar el acceso completo al sistema.</p>
        </div>
        <div class="footer">
            <p>© {invitation.institution.name} — Todos los derechos reservados</p>
            <p>MEDOPZ | Sistema de Salud Inteligente</p>
            <p>¿Necesita ayuda? Contacte a soporte: support@medopz.com</p>
        </div>
    </div>
</body>
</html>
        """.strip()

        plain_message = f"""
{gender_prefix} {invitation.full_name},

El {invitation.institution.name} le ha extendido una invitación para unirse a MEDOPZ, el Sistema Operativo de Salud Inteligente.

📋 DATOS DE SU INVITACIÓN:
──────────────────────────────────────
• Institución: {invitation.institution.name}
{institution_address.replace("<strong>", "").replace("</strong>", "")}
• Número de Colegiado: {invitation.colegiado_number}
{specialty_text.replace("<strong>", "").replace("</strong>", "")}
──────────────────────────────────────

Para activar su cuenta, visite el siguiente enlace:
{activation_url}

⚠️ IMPORTANTE: Este enlace expira en 7 días.

Una vez active su cuenta, nuestro equipo de administración verificará sus credenciales médicas antes de habilitar el acceso completo al sistema.

Si no solicitó esta invitación, ignore este mensaje.

—
MEDOPZ | Sistema de Salud Inteligente
support@medopz.com
        """.strip()

        try:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[invitation.email],
                html_message=html_message,
                fail_silently=False,
            )
            logger.info(f"Email de invitación profesional enviado a {invitation.email}")
        except Exception as e:
            logger.error(
                f"Error enviando email de invitación a {invitation.email}: {e}"
            )


@admin.register(DoctorLicense)
class DoctorLicenseAdmin(admin.ModelAdmin):
    list_display = (
        "doctor",
        "is_verified_badge",
        "license_expiry_date",
        "verification_date",
        "verified_by",
        "created_at",
    )
    list_filter = ("is_verified_by_admin", "verification_date", "created_at")
    search_fields = ("doctor__full_name", "doctor__colegiado_number", "doctor__email")
    readonly_fields = (
        "created_at",
        "updated_at",
        "verification_date",
        "verified_by",
    )
    autocomplete_fields = ["doctor", "verified_by"]
    ordering = ("-created_at",)
    list_per_page = 25

    fieldsets = (
        (
            "MÉDICO Y DOCUMENTACIÓN",
            {
                "fields": (
                    "doctor",
                    "license_file",
                    "license_expiry_date",
                    "colegiado_card_file",
                    "university_diploma_file",
                ),
                "description": "Documentos legales para verificación ante el MPPS.",
            },
        ),
        (
            "VERIFICACIÓN ADMINISTRATIVA",
            {
                "fields": (
                    "is_verified_by_admin",
                    "verification_date",
                    "verified_by",
                    "verification_notes",
                ),
                "description": "Solo los administradores pueden marcar como verificado.",
            },
        ),
        (
            "DOCUMENTOS ADICIONALES",
            {
                "fields": ("additional_docs",),
                "classes": ("collapse",),
            },
        ),
        (
            "AUDITORÍA",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                ),
                "classes": ("collapse",),
            },
        ),
    )

    @admin.display(description="Verificado", ordering="is_verified_by_admin")
    def is_verified_badge(self, obj):
        if obj.is_verified_by_admin:
            return format_html(
                '<span style="background:#22c55e;color:white;padding:2px 8px;border-radius:12px;font-size:11px;">✓ VERIFICADO</span>'
            )
        else:
            return format_html(
                '<span style="background:#ef4444;color:white;padding:2px 8px;border-radius:12px;font-size:11px;">⏳ PENDIENTE</span>'
            )

    def save_model(self, request, obj, form, change):
        if obj.is_verified_by_admin and not obj.verification_date:
            obj.verification_date = timezone.now()
            obj.verified_by = request.user
        super().save_model(request, obj, form, change)


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
    search_fields = (
        "patient__first_name",
        "patient__last_name",
        "condition",
        "relative",
    )
    ordering = ("-created_at",)
    list_per_page = 25


@admin.register(Surgery)
class SurgeryAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "patient",
        "name",
        "scheduled_date",
        "status",
        "surgeon",
        "hospital",
        "created_at",
    )
    list_filter = ("status", "surgery_type", "risk_level", "hospital")
    search_fields = (
        "patient__first_name",
        "patient__last_name",
        "name",
        "hospital",
        "surgeon__first_name",
    )
    ordering = ("-scheduled_date",)
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
    list_display = (
        "id",
        "patient",
        "vaccine",
        "dose_number",
        "date_administered",
        "center",
    )
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
    list_display = (
        "id",
        "timestamp",
        "institution",
        "entity",
        "entity_id",
        "action",
        "severity",
        "is_read",
    )
    list_filter = ("severity", "entity", "institution", "is_read")
    search_fields = ("entity", "entity_id", "action", "actor_name")
    ordering = ("-timestamp",)
    list_per_page = 50
    readonly_fields = (
        "timestamp",
        "institution",
        "actor_user",
        "actor_name",
        "entity",
        "entity_id",
        "action",
        "metadata",
        "severity",
        "notify",
    )


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
        (
            "Identidad",
            {"fields": ("name", "tax_id", "logo", "phone", "address", "neighborhood")},
        ),
        (
            "Pasarela de Pagos",
            {
                "fields": (
                    "active_gateway",
                    "gateway_api_key",
                    "gateway_api_secret",
                )
            },
        ),
        (
            "Liquidación de Fondos",
            {
                "fields": (
                    "settlement_bank_name",
                    "settlement_account_id",
                )
            },
        ),
        (
            "Modo Sandbox",
            {"fields": ("is_gateway_test_mode",)},
        ),
        (
            "Estado",
            {
                "fields": (
                    "is_active",
                    "created_at",
                    "updated_at",
                    "updated_by",
                )
            },
        ),
    )


# Personalización del panel de administración
admin.site.site_header = "MEDOPZ Clinical System"
admin.site.site_title = "MEDOPZ Admin"
admin.site.index_title = "Panel de Control"
