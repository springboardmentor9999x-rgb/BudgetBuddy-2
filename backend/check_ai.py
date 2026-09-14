import sys
path = r'z:/Budget_Buddy (2)/Budget_Buddy/BudgetBuddy/backend/app/routers/analytics.py'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'ai' in line.lower() or 'insight' in line.lower() or 'recommend' in line.lower() or 'predict' in line.lower():
        if 'detail' not in line.lower() and 'remain' not in line.lower() and 'email' not in line.lower():
            print(f"{i+1}: {line.strip()}")
