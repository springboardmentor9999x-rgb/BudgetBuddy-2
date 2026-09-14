import re
import sys

path = r'z:/Budget_Buddy (2)/Budget_Buddy/BudgetBuddy/frontend/src/pages/AnalyticsDashboard.jsx'
with open(path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        # basic AI keywords
        lower_line = line.lower()
        if 'ai' in lower_line or 'insight' in lower_line or 'predict' in lower_line or 'recommend' in lower_line or 'suggest' in lower_line:
            if 'main' not in lower_line and 'contain' not in lower_line and 'remain' not in lower_line and 'detail' not in lower_line and 'fail' not in lower_line:
                print(f'{i+1}: {line.strip()}')
