# Generated manually for AIAnalysis model — Centro de Diagnóstico Inteligente

from decimal import Decimal

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0021_add_diagnostic_document_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="AIAnalysis",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "model_used",
                    models.CharField(
                        choices=[
                            ("gemini-2.5-flash", "Gemini 2.5 Flash"),
                            ("gemini-3.5-flash", "Gemini 3.5 Flash"),
                            ("gemini-3.1-flash-lite", "Gemini 3.1 Flash Lite"),
                        ],
                        max_length=50,
                    ),
                ),
                (
                    "analysis_mode",
                    models.CharField(
                        choices=[
                            ("summary", "Resumen Clínico"),
                            ("full", "Análisis Completo"),
                            ("icd_suggestion", "Sugerencia ICD-11"),
                            ("lab_interpretation", "Interpretación de Lab"),
                        ],
                        max_length=30,
                    ),
                ),
                (
                    "clinical_summary",
                    models.TextField(
                        blank=True,
                        help_text="Resumen ejecutivo del documento en lenguaje natural",
                        null=True,
                    ),
                ),
                (
                    "interpretation",
                    models.TextField(
                        blank=True,
                        help_text="Interpretación clínica de valores de laboratorio",
                        null=True,
                    ),
                ),
                (
                    "suggested_icd_codes",
                    models.JSONField(
                        blank=True,
                        default=list,
                        help_text="Lista de códigos ICD-11 sugeridos con justificación",
                    ),
                ),
                (
                    "abnormal_lab_flags",
                    models.JSONField(
                        blank=True,
                        default=list,
                        help_text="Banderas de valores anormales",
                    ),
                ),
                (
                    "drug_mentions",
                    models.JSONField(
                        blank=True,
                        default=list,
                        help_text="Medicamentos mencionados en el documento",
                    ),
                ),
                (
                    "raw_response",
                    models.JSONField(
                        blank=True,
                        default=dict,
                        help_text="Respuesta cruda del modelo LLM para auditoría",
                    ),
                ),
                (
                    "reasoning_trace",
                    models.TextField(
                        blank=True,
                        help_text="Traza de razonamiento del modelo para transparencia",
                        null=True,
                    ),
                ),
                (
                    "confidence_score",
                    models.FloatField(
                        blank=True,
                        help_text="Puntuación de confianza del análisis (0-1)",
                        null=True,
                    ),
                ),
                ("tokens_used", models.PositiveIntegerField(default=0)),
                (
                    "estimated_cost_usd",
                    models.DecimalField(
                        blank=True,
                        decimal_places=6,
                        default=Decimal("0.000000"),
                        max_digits=8,
                    ),
                ),
                ("latency_ms", models.PositiveIntegerField(default=0)),
                ("prompt_tokens", models.PositiveIntegerField(default=0)),
                ("completion_tokens", models.PositiveIntegerField(default=0)),
                (
                    "performed_at",
                    models.DateTimeField(auto_now_add=True),
                ),
                (
                    "document",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ai_analyses",
                        to="core.medicaldocument",
                    ),
                ),
                (
                    "patient",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ai_analyses",
                        to="core.patient",
                    ),
                ),
                (
                    "performed_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="ai_analyses_performed",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Análisis de IA",
                "verbose_name_plural": "Análisis de IA",
                "ordering": ["-performed_at"],
            },
            bases=(models.Model,),
        ),
        migrations.AddIndex(
            model_name="AIAnalysis",
            index=models.Index(
                fields=["document", "-performed_at"],
                name="ai_analyses_doc_perf_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="AIAnalysis",
            index=models.Index(
                fields=["patient", "-performed_at"],
                name="ai_analyses_pat_perf_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="AIAnalysis",
            index=models.Index(
                fields=["model_used"],
                name="ai_analyses_model_idx",
            ),
        ),
    ]
