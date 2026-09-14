import sys
path = r"z:/Budget_Buddy (2)/Budget_Buddy/BudgetBuddy/frontend/src/pages/AnalyticsDashboard.jsx"
with open(path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        low = line.lower()
        if 'export' in low or 'pdf' in low or 'monthly' in low or 'excel' in low or 'admin' in low or 'role' in low:
            print(f"{i+1}: {line.strip()}")
