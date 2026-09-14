import io
import datetime
from typing import Dict, Any, List
from calendar import month_name
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from app.database import get_db
from app.models import User, Account, Income, Expense, Budget, SavingsGoal, Notification
from app import security
from app.routers.budgets import calculate_budget_metrics

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])


def fetch_monthly_data(user_id: int, month: int, year: int, db: Session) -> Dict[str, Any]:
    # 1. Incomes for target month/year
    inc_sum = (
        db.query(func.sum(Income.amount))
        .filter(
            Income.user_id == user_id,
            extract("month", Income.date) == month,
            extract("year", Income.date) == year
        )
        .scalar() or 0.0
    )

    # 2. Expenses for target month/year
    exp_sum = (
        db.query(func.sum(Expense.amount))
        .filter(
            Expense.user_id == user_id,
            extract("month", Expense.date) == month,
            extract("year", Expense.date) == year
        )
        .scalar() or 0.0
    )

    remaining = float(inc_sum) - float(exp_sum)

    # 3. Category Expenses
    cat_rows = (
        db.query(Expense.category, func.sum(Expense.amount).label("total_amount"))
        .filter(
            Expense.user_id == user_id,
            extract("month", Expense.date) == month,
            extract("year", Expense.date) == year
        )
        .group_by(Expense.category)
        .order_by(func.sum(Expense.amount).desc())
        .all()
    )

    category_spending = [
        {
            "category": r.category,
            "amount": float(r.total_amount),
            "percentage": round((float(r.total_amount) / float(exp_sum) * 100), 1) if exp_sum > 0 else 0.0
        }
        for r in cat_rows
    ]

    # 4. Category Budgets for target month/year
    budgets = (
        db.query(Budget)
        .filter(Budget.user_id == user_id, Budget.month == month, Budget.year == year)
        .all()
    )
    budget_status = [
        calculate_budget_metrics(b, db).model_dump()
        for b in budgets
    ]

    # 5. Savings Goals
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id).all()
    savings_goals = [
        {
            "id": g.id,
            "title": g.title,
            "goal_type": g.goal_type,
            "target": float(g.target_amount),
            "current": float(g.current_amount),
            "remaining": max(0.0, float(g.target_amount - g.current_amount)),
            "percentage": round((g.current_amount / g.target_amount * 100), 1) if g.target_amount > 0 else 0.0,
            "status": g.status
        }
        for g in goals
    ]

    # 6. Notifications for user
    notifs = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            extract("month", Notification.created_at) == month,
            extract("year", Notification.created_at) == year
        )
        .order_by(Notification.created_at.desc())
        .all()
    )
    notifications = [
        {
            "id": n.id,
            "message": n.message,
            "type": n.type,
            "created_at": n.created_at.strftime("%Y-%m-%d %H:%M")
        }
        for n in notifs
    ]

    return {
        "month": month,
        "year": year,
        "month_name": month_name[month],
        "total_income": float(inc_sum),
        "total_expenses": float(exp_sum),
        "remaining_balance": remaining,
        "category_spending": category_spending,
        "budget_status": budget_status,
        "savings_goals": savings_goals,
        "notifications": notifications
    }


@router.get("/monthly")
def get_monthly_report(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000, le=2100),
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
) -> Dict[str, Any]:
    return fetch_monthly_data(current_user.id, month, year, db)


@router.get("/export/pdf")
def export_monthly_report_pdf(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000, le=2100),
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
):
    data = fetch_monthly_data(current_user.id, month, year, db)
    month_str = month_name[month]

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#0F172A')
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#475569')
    )
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=12,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155')
    )
    header_table_cell = ParagraphStyle(
        'HeaderCell',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.white
    )

    story = []

    # Title Banner
    story.append(Paragraph("BudgetBuddy", title_style))
    story.append(Paragraph(f"Monthly Financial Report — {month_str} {year}", subtitle_style))
    story.append(Paragraph(f"User: {current_user.full_name} ({current_user.email}) | Generated: {datetime.datetime.utcnow().strftime('%Y-%m-%d')}", body_style))
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#3B82F6'), spaceAfter=15))

    # 1. Summary Box Table
    story.append(Paragraph("1. Executive Summary", section_heading))
    summary_data = [
        [
            Paragraph("Total Income", header_table_cell),
            Paragraph("Total Expenses", header_table_cell),
            Paragraph("Remaining Balance", header_table_cell)
        ],
        [
            f"₹{data['total_income']:,.2f}",
            f"₹{data['total_expenses']:,.2f}",
            f"₹{data['remaining_balance']:,.2f}"
        ]
    ]
    summary_table = Table(summary_data, colWidths=[180, 180, 180])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#F8FAFC')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, 1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 15))

    # 2. Category Spending
    story.append(Paragraph("2. Category-Wise Expenses", section_heading))
    if not data["category_spending"]:
        story.append(Paragraph("No expenses recorded for this month.", body_style))
    else:
        cat_data = [[
            Paragraph("Category", header_table_cell),
            Paragraph("Amount Spent", header_table_cell),
            Paragraph("Share %", header_table_cell)
        ]]
        for c in data["category_spending"]:
            cat_data.append([
                Paragraph(c["category"], body_style),
                f"₹{c['amount']:,.2f}",
                f"{c['percentage']}%"
            ])
        cat_table = Table(cat_data, colWidths=[240, 150, 150])
        cat_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563EB')),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(cat_table)
    story.append(Spacer(1, 15))

    # 3. Budget Status
    story.append(Paragraph("3. Category Budget Status", section_heading))
    if not data["budget_status"]:
        story.append(Paragraph("No category budgets configured for this month.", body_style))
    else:
        b_data = [[
            Paragraph("Category", header_table_cell),
            Paragraph("Limit", header_table_cell),
            Paragraph("Spent", header_table_cell),
            Paragraph("Usage %", header_table_cell),
            Paragraph("Status", header_table_cell)
        ]]
        for b in data["budget_status"]:
            status_str = "EXCEEDED" if b["is_exceeded"] else "ON TRACK"
            b_data.append([
                Paragraph(b["category"], body_style),
                f"₹{b['monthly_limit']:,.2f}",
                f"₹{b['spent_amount']:,.2f}",
                f"{b['utilization_percentage']}%",
                status_str
            ])
        b_table = Table(b_data, colWidths=[150, 100, 100, 90, 100])
        b_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0284C7')),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(b_table)
    story.append(Spacer(1, 15))

    # 4. Savings Goals Progress
    story.append(Paragraph("4. Savings Goals Overview", section_heading))
    if not data["savings_goals"]:
        story.append(Paragraph("No active or completed savings goals.", body_style))
    else:
        g_data = [[
            Paragraph("Goal Title", header_table_cell),
            Paragraph("Type", header_table_cell),
            Paragraph("Target", header_table_cell),
            Paragraph("Saved", header_table_cell),
            Paragraph("Progress", header_table_cell),
            Paragraph("Status", header_table_cell)
        ]]
        for g in data["savings_goals"]:
            g_data.append([
                Paragraph(g["title"], body_style),
                g["goal_type"].replace('_', ' ').capitalize(),
                f"₹{g['target']:,.2f}",
                f"₹{g['current']:,.2f}",
                f"{g['percentage']}%",
                g["status"].replace('_', ' ').capitalize()
            ])
        g_table = Table(g_data, colWidths=[130, 80, 90, 90, 75, 75])
        g_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0D9488')),
            ('ALIGN', (2, 0), (4, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(g_table)
    story.append(Spacer(1, 15))

    # 5. System Notifications
    story.append(Paragraph("5. Monthly Alerts & Notifications", section_heading))
    if not data["notifications"]:
        story.append(Paragraph("No alerts generated for this month.", body_style))
    else:
        n_data = [[
            Paragraph("Date", header_table_cell),
            Paragraph("Type", header_table_cell),
            Paragraph("Notification Message", header_table_cell)
        ]]
        for n in data["notifications"]:
            n_data.append([
                n["created_at"],
                n["type"].replace('_', ' ').capitalize(),
                Paragraph(n["message"], body_style)
            ])
        n_table = Table(n_data, colWidths=[110, 110, 320])
        n_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#475569')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(n_table)

    # Build PDF
    doc.build(story)
    buffer.seek(0)

    filename = f"BudgetBuddy_Report_{month_str}_{year}.pdf"
    headers = {
        'Content-Disposition': f'attachment; filename="{filename}"'
    }
    return StreamingResponse(buffer, media_type="application/pdf", headers=headers)


@router.get("")
def get_financial_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(security.get_current_user)
) -> Dict[str, Any]:
    now = datetime.datetime.utcnow()

    # 1. Total Lifetime Income & Expenses
    total_income = (
        db.query(func.sum(Income.amount))
        .filter(Income.user_id == current_user.id)
        .scalar() or 0.0
    )

    total_expenses = (
        db.query(func.sum(Expense.amount))
        .filter(Expense.user_id == current_user.id)
        .scalar() or 0.0
    )

    net_savings = float(total_income) - float(total_expenses)
    overall_savings_rate = round((net_savings / float(total_income)) * 100, 1) if total_income > 0 else 0.0

    # 2. Monthly Trend Data (Last 6 Months)
    monthly_trends = []
    for i in range(5, -1, -1):
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1

        inc_sum = (
            db.query(func.sum(Income.amount))
            .filter(
                Income.user_id == current_user.id,
                extract("month", Income.date) == m,
                extract("year", Income.date) == y
            )
            .scalar() or 0.0
        )

        exp_sum = (
            db.query(func.sum(Expense.amount))
            .filter(
                Expense.user_id == current_user.id,
                extract("month", Expense.date) == m,
                extract("year", Expense.date) == y
            )
            .scalar() or 0.0
        )

        sav = float(inc_sum) - float(exp_sum)
        s_rate = round((sav / float(inc_sum)) * 100, 1) if inc_sum > 0 else 0.0

        monthly_trends.append({
            "month_key": f"{y}-{m:02d}",
            "month_label": f"{month_name[m][:3]} {y}",
            "income": float(inc_sum),
            "expense": float(exp_sum),
            "savings": sav,
            "savings_rate": s_rate
        })

    # 3. Category Expense Breakdown
    cat_rows = (
        db.query(
            Expense.category,
            func.sum(Expense.amount).label("total_amount"),
            func.count(Expense.id).label("tx_count")
        )
        .filter(Expense.user_id == current_user.id)
        .group_by(Expense.category)
        .order_by(func.sum(Expense.amount).desc())
        .all()
    )

    category_expenses = []
    top_expense_category = "N/A"
    if cat_rows:
        top_expense_category = cat_rows[0].category
        for r in cat_rows:
            amt = float(r.total_amount)
            pct = round((amt / float(total_expenses)) * 100, 1) if total_expenses > 0 else 0.0
            category_expenses.append({
                "category": r.category,
                "amount": amt,
                "percentage": pct,
                "count": r.tx_count
            })

    # 4. Income Source Breakdown
    src_rows = (
        db.query(
            Income.source,
            func.sum(Income.amount).label("total_amount"),
            func.count(Income.id).label("tx_count")
        )
        .filter(Income.user_id == current_user.id)
        .group_by(Income.source)
        .order_by(func.sum(Income.amount).desc())
        .all()
    )

    income_sources = []
    top_income_source = "N/A"
    if src_rows:
        top_income_source = src_rows[0].source
        for r in src_rows:
            amt = float(r.total_amount)
            pct = round((amt / float(total_income)) * 100, 1) if total_income > 0 else 0.0
            income_sources.append({
                "source": r.source,
                "amount": amt,
                "percentage": pct,
                "count": r.tx_count
            })

    # 5. Account Cash Flow Breakdown
    accounts = db.query(Account).filter(Account.user_id == current_user.id).all()
    account_flows = []
    for acc in accounts:
        acc_inc = (
            db.query(func.sum(Income.amount))
            .filter(Income.user_id == current_user.id, Income.account_id == acc.id)
            .scalar() or 0.0
        )
        acc_exp = (
            db.query(func.sum(Expense.amount))
            .filter(Expense.user_id == current_user.id, Expense.account_id == acc.id)
            .scalar() or 0.0
        )

        account_flows.append({
            "account_id": acc.id,
            "bank_name": acc.bank_name,
            "account_name": acc.account_name,
            "account_type": acc.account_type,
            "current_balance": float(acc.current_balance),
            "total_income": float(acc_inc),
            "total_expense": float(acc_exp),
            "net_flow": float(acc_inc) - float(acc_exp)
        })

    active_months_count = max(len([m for m in monthly_trends if m["income"] > 0 or m["expense"] > 0]), 1)
    avg_monthly_income = round(float(total_income) / active_months_count, 2)
    avg_monthly_expense = round(float(total_expenses) / active_months_count, 2)

    return {
        "kpis": {
            "total_income": float(total_income),
            "total_expenses": float(total_expenses),
            "net_savings": net_savings,
            "savings_rate": overall_savings_rate,
            "top_expense_category": top_expense_category,
            "top_income_source": top_income_source,
            "avg_monthly_income": avg_monthly_income,
            "avg_monthly_expense": avg_monthly_expense
        },
        "monthly_trends": monthly_trends,
        "category_expenses": category_expenses,
        "income_sources": income_sources,
        "account_flows": account_flows
    }
