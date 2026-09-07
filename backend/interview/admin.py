from django.contrib import admin

from .models import InterviewSession, QAExchange


class QAExchangeInline(admin.TabularInline):
    model = QAExchange
    extra = 0
    readonly_fields = ["id", "created_at"]


@admin.register(InterviewSession)
class InterviewSessionAdmin(admin.ModelAdmin):
    list_display = ["id", "candidate_label", "started_at", "ended_at", "tab_switch_count"]
    inlines = [QAExchangeInline]


@admin.register(QAExchange)
class QAExchangeAdmin(admin.ModelAdmin):
    list_display = ["question_id", "stage", "score", "session", "created_at"]
    list_filter = ["stage", "score"]
