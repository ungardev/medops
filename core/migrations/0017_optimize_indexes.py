# Generated manually for performance optimization
# Migration: 0017_optimize_indexes
# Purpose: Add critical database indexes to improve query performance with NeonDB

from django.db import migrations, models


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("core", "0016_add_responsible_payer_to_chargeorder"),
    ]

    operations = [
        # =====================================================
        # APPOINTMENT INDEXES (Most Critical)
        # =====================================================
        migrations.AddIndex(
            model_name="appointment",
            index=models.Index(
                fields=["institution", "appointment_date"],
                name="appt_inst_date_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="appointment",
            index=models.Index(
                fields=["doctor", "appointment_date"],
                name="appt_doc_date_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="appointment",
            index=models.Index(
                fields=["patient", "appointment_date"],
                name="appt_pat_date_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="appointment",
            index=models.Index(
                fields=["institution", "status"],
                name="appt_inst_status_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="appointment",
            index=models.Index(
                fields=["status", "appointment_date"],
                name="appt_stat_date_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="appointment",
            index=models.Index(
                fields=["doctor_service"],
                name="appt_doc_service_idx",
            ),
        ),
        # =====================================================
        # DOCTORSERVICE INDEXES
        # =====================================================
        migrations.AddIndex(
            model_name="doctorservice",
            index=models.Index(
                fields=["doctor", "is_active"],
                name="svc_doc_active_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="doctorservice",
            index=models.Index(
                fields=["institution", "is_active"],
                name="svc_inst_active_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="doctorservice",
            index=models.Index(
                fields=["category"],
                name="svc_category_idx",
            ),
        ),
        # =====================================================
        # SERVICESCHEDULE INDEXES
        # =====================================================
        migrations.AddIndex(
            model_name="serviceschedule",
            index=models.Index(
                fields=["service", "day_of_week", "is_active"],
                name="sch_svc_day_active_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="serviceschedule",
            index=models.Index(
                fields=["institution", "is_active"],
                name="sch_inst_active_idx",
            ),
        ),
        # =====================================================
        # PATIENT INDEXES
        # =====================================================
        migrations.AddIndex(
            model_name="patient",
            index=models.Index(
                fields=["active", "created_at"],
                name="pat_active_created_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="patient",
            index=models.Index(
                fields=["is_minor"],
                name="pat_is_minor_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="patient",
            index=models.Index(
                fields=["neighborhood"],
                name="pat_neighborhood_idx",
            ),
        ),
        # =====================================================
        # WAITINGROOMENTRY INDEXES
        # =====================================================
        migrations.AddIndex(
            model_name="waitingroomentry",
            index=models.Index(
                fields=["institution", "status", "arrival_time"],
                name="wre_inst_stat_time_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="waitingroomentry",
            index=models.Index(
                fields=["patient"],
                name="wre_patient_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="waitingroomentry",
            index=models.Index(
                fields=["appointment"],
                name="wre_appointment_idx",
            ),
        ),
        # =====================================================
        # PAYMENT INDEXES
        # =====================================================
        migrations.AddIndex(
            model_name="payment",
            index=models.Index(
                fields=["institution", "status", "created_at"],
                name="pay_inst_stat_created_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="payment",
            index=models.Index(
                fields=["doctor", "status"],
                name="pay_doc_status_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="payment",
            index=models.Index(
                fields=["charge_order"],
                name="pay_charge_order_idx",
            ),
        ),
        # =====================================================
        # CHARGEORDER INDEXES
        # =====================================================
        migrations.AddIndex(
            model_name="chargeorder",
            index=models.Index(
                fields=["institution", "status", "issued_at"],
                name="co_inst_stat_issued_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="chargeorder",
            index=models.Index(
                fields=["doctor", "status"],
                name="co_doc_status_idx",
            ),
        ),
    ]
