"""
Feature 9 — PDF Branded Report Export
Generates a professional ESPRIT-branded PDF audit report using ReportLab.
"""

import io
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

logger = logging.getLogger(__name__)

ESPRIT_RED   = (208/255, 16/255, 18/255)
ESPRIT_DARK  = (15/255, 23/255, 42/255)
GRAY_LIGHT   = (244/255, 246/255, 249/255)
GRAY_MID     = (100/255, 116/255, 139/255)
WHITE        = (1, 1, 1)
SUCCESS_GRN  = (22/255, 163/255, 74/255)
WARN_AMB     = (217/255, 119/255, 6/255)


def _grade_color(grade: str):
    if grade and grade.startswith("A"):  return SUCCESS_GRN
    if grade and grade.startswith("B"):  return (37/255, 99/255, 235/255)
    if grade and grade.startswith("C"):  return WARN_AMB
    return ESPRIT_RED


def generate_audit_pdf(report: Dict[str, Any]) -> bytes:
    """
    Generate a branded PDF from an audit report dict.
    Returns raw PDF bytes ready to stream as a download.
    """
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import cm
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
            HRFlowable, KeepTogether,
        )
        from reportlab.lib import colors
    except ImportError:
        raise RuntimeError("reportlab not installed. Run: pip install reportlab")

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
        title="EduAudit AI Report",
        author="EduAudit AI — ESPRIT",
    )

    RL = lambda r,g,b: colors.Color(r,g,b)
    esprit_red  = RL(*ESPRIT_RED)
    esprit_dark = RL(*ESPRIT_DARK)
    gray_light  = RL(*GRAY_LIGHT)
    gray_mid    = RL(*GRAY_MID)
    white_c     = RL(*WHITE)

    styles = getSampleStyleSheet()

    def st(name, **kw):
        return ParagraphStyle(name, parent=styles["Normal"], **kw)

    s_title   = st("Title",   fontSize=22, fontName="Helvetica-Bold",   textColor=white_c,   leading=26)
    s_sub     = st("Sub",     fontSize=10, fontName="Helvetica",         textColor=white_c,   leading=14)
    s_h2      = st("H2",      fontSize=13, fontName="Helvetica-Bold",    textColor=esprit_dark, spaceBefore=12, spaceAfter=6)
    s_body    = st("Body",    fontSize=9,  fontName="Helvetica",         textColor=esprit_dark, leading=13)
    s_bullet  = st("Bullet",  fontSize=9,  fontName="Helvetica",         textColor=esprit_dark, leading=13, leftIndent=14, bulletIndent=6)
    s_caption = st("Caption", fontSize=8,  fontName="Helvetica-Oblique", textColor=gray_mid)
    s_center  = st("Center",  fontSize=10, fontName="Helvetica",         alignment=TA_CENTER)

    doc_meta = report.get("document", {})
    scores   = report.get("scores",   {})
    peda     = report.get("pedagogical_coherence", {})
    writing  = report.get("writing_quality",       {})
    grade    = scores.get("grade", "N/A")
    g_score  = scores.get("global_score", 0)
    grade_c  = RL(*_grade_color(grade))

    story = []

    # ── Header banner ──────────────────────────────────────────────────────
    banner_data = [[
        Paragraph("<b>EduAudit AI</b>", s_title),
        Paragraph(f"<b>{grade}</b>", ParagraphStyle(
            "GradeBig", fontSize=36, fontName="Helvetica-Bold",
            textColor=grade_c, alignment=TA_RIGHT)),
    ]]
    banner_tbl = Table(banner_data, colWidths=["75%", "25%"])
    banner_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), esprit_red),
        ("LEFTPADDING",  (0,0), (-1,-1), 14),
        ("RIGHTPADDING", (0,0), (-1,-1), 14),
        ("TOPPADDING",   (0,0), (-1,-1), 12),
        ("BOTTOMPADDING",(0,0), (-1,-1), 12),
        ("VALIGN",       (0,0), (-1,-1), "MIDDLE"),
    ]))
    story.append(banner_tbl)

    # Sub-header
    sub_data = [[
        Paragraph(f"<font color='white'><b>Document:</b> {doc_meta.get('filename','')[:60]}</font>", s_sub),
        Paragraph(f"<font color='white'><b>Generated:</b> {datetime.utcnow().strftime('%d %b %Y %H:%M')} UTC</font>", st("SubR", fontSize=9, fontName="Helvetica", textColor=white_c, alignment=TA_RIGHT)),
    ]]
    sub_tbl = Table(sub_data, colWidths=["65%","35%"])
    sub_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0),(-1,-1), RL(135/255,10/255,12/255)),
        ("LEFTPADDING",  (0,0),(-1,-1), 14),
        ("RIGHTPADDING", (0,0),(-1,-1), 14),
        ("TOPPADDING",   (0,0),(-1,-1), 6),
        ("BOTTOMPADDING",(0,0),(-1,-1), 6),
        ("VALIGN",       (0,0),(-1,-1), "MIDDLE"),
    ]))
    story.append(sub_tbl)
    story.append(Spacer(1, 0.4*cm))

    # ── Score summary table ──────────────────────────────────────────────
    story.append(Paragraph("Score Summary", s_h2))
    score_rows = [
        ["Criterion", "Score", "Grade"],
        ["Global Score",          f"{g_score:.1f}/10", grade],
        ["Pedagogical Coherence", f"{scores.get('pedagogical_coherence',0):.1f}/10", ""],
        ["Writing Quality",       f"{scores.get('writing_quality',0):.1f}/10", ""],
        ["LLM Model",             report.get("llm_model_used",""), ""],
        ["Processing Time",       f"{report.get('processing_time_seconds',0):.1f}s", ""],
    ]
    score_tbl = Table(score_rows, colWidths=["50%","30%","20%"])
    score_tbl.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(-1,0), esprit_dark),
        ("TEXTCOLOR",    (0,0),(-1,0), white_c),
        ("FONTNAME",     (0,0),(-1,0), "Helvetica-Bold"),
        ("FONTSIZE",     (0,0),(-1,-1), 9),
        ("ROWBACKGROUNDS",(0,1),(-1,-1), [gray_light, white_c]),
        ("GRID",         (0,0),(-1,-1), 0.25, RL(0.85,0.87,0.92)),
        ("TOPPADDING",   (0,0),(-1,-1), 5),
        ("BOTTOMPADDING",(0,0),(-1,-1), 5),
        ("LEFTPADDING",  (0,0),(-1,-1), 8),
    ]))
    story.append(score_tbl)
    story.append(Spacer(1, 0.4*cm))

    # ── Executive summary ────────────────────────────────────────────────
    story.append(Paragraph("Executive Summary", s_h2))
    story.append(HRFlowable(width="100%", thickness=1, color=esprit_red))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph(report.get("executive_summary","No summary generated."), s_body))
    story.append(Spacer(1, 0.4*cm))

    # ── Helper: bullet section ───────────────────────────────────────────
    def add_list(title, items, icon="•"):
        if not items: return
        story.append(Paragraph(title, s_h2))
        for item in items[:8]:
            story.append(Paragraph(f"{icon}  {item}", s_bullet))
        story.append(Spacer(1, 0.3*cm))

    # ── Pedagogical section ──────────────────────────────────────────────
    story.append(Paragraph("Pedagogical Coherence", s_h2))
    story.append(HRFlowable(width="100%", thickness=0.5, color=esprit_red))
    bloom = peda.get("bloom_analysis", {})
    if bloom:
        bloom_data = [
            ["Bloom Level", bloom.get("detected_level","Unknown")],
            ["Alignment Score", f"{bloom.get('alignment_score',0):.1f}/10"],
            ["Detected Verbs",  ", ".join(bloom.get("detected_verbs",[])[:6]) or "None"],
        ]
        bt = Table(bloom_data, colWidths=["40%","60%"])
        bt.setStyle(TableStyle([
            ("FONTNAME",     (0,0),(0,-1), "Helvetica-Bold"),
            ("FONTSIZE",     (0,0),(-1,-1), 8),
            ("ROWBACKGROUNDS",(0,0),(-1,-1), [gray_light, white_c, gray_light]),
            ("GRID",         (0,0),(-1,-1), 0.2, RL(0.88,0.9,0.94)),
            ("TOPPADDING",   (0,0),(-1,-1), 4),
            ("BOTTOMPADDING",(0,0),(-1,-1), 4),
            ("LEFTPADDING",  (0,0),(-1,-1), 8),
        ]))
        story.append(bt)
        story.append(Spacer(1, 0.2*cm))

    add_list("Strengths",       peda.get("strengths",[]),        "✓")
    add_list("Weaknesses",      peda.get("weaknesses",[]),       "✗")
    add_list("Recommendations", peda.get("recommendations",[]),  "→")

    # ── Writing Quality section ──────────────────────────────────────────
    story.append(Paragraph("Writing Quality", s_h2))
    story.append(HRFlowable(width="100%", thickness=0.5, color=esprit_red))
    wq_data = [
        ["Dimension",    "Score"],
        ["Clarity",      f"{writing.get('clarity_score',0):.1f}/10"],
        ["Structure",    f"{writing.get('structure_score',0):.1f}/10"],
        ["Readability",  f"{writing.get('readability_score',0):.1f}/10"],
        ["Grammar",      f"{writing.get('spelling_grammar_score',0):.1f}/10"],
    ]
    wt = Table(wq_data, colWidths=["60%","40%"])
    wt.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(-1,0), esprit_dark),
        ("TEXTCOLOR",    (0,0),(-1,0), white_c),
        ("FONTNAME",     (0,0),(-1,0), "Helvetica-Bold"),
        ("FONTSIZE",     (0,0),(-1,-1), 8),
        ("ROWBACKGROUNDS",(0,1),(-1,-1), [gray_light, white_c]),
        ("GRID",         (0,0),(-1,-1), 0.2, RL(0.88,0.9,0.94)),
        ("TOPPADDING",   (0,0),(-1,-1), 4),
        ("BOTTOMPADDING",(0,0),(-1,-1), 4),
        ("LEFTPADDING",  (0,0),(-1,-1), 8),
    ]))
    story.append(wt)
    story.append(Spacer(1, 0.2*cm))
    add_list("Strengths",       writing.get("strengths",[]),       "✓")
    add_list("Recommendations", writing.get("recommendations",[]), "→")

    # ── Priority recommendations ─────────────────────────────────────────
    add_list("Top Priority Recommendations", report.get("priority_recommendations",[]), "★")

    # ── Footer ───────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.5*cm))
    story.append(HRFlowable(width="100%", thickness=1, color=esprit_red))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph(
        "EduAudit AI  ·  ESPRIT — Se former autrement  ·  Honoris United Universities",
        st("Footer", fontSize=7, fontName="Helvetica-Oblique", textColor=gray_mid, alignment=TA_CENTER)
    ))

    doc.build(story)
    return buf.getvalue()
