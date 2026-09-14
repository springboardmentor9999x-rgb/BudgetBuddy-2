import re

path = r'z:/Budget_Buddy (2)/Budget_Buddy/BudgetBuddy/frontend/src/pages/AnalyticsDashboard.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# I want to replace any visible "Monthly" text in the User Analytics section.
# We found:
# Monthly Income
# Monthly Expenses
# Monthly category breakdown

content = re.sub(r'>\s*Monthly Income\s*<', '>{user?.role === "user" ? "Income" : "Monthly Income"}<', content)
content = re.sub(r'>\s*Monthly Expenses\s*<', '>{user?.role === "user" ? "Expenses" : "Monthly Expenses"}<', content)
content = re.sub(r'>\s*Monthly category breakdown\s*<', '>{user?.role === "user" ? "Category breakdown" : "Monthly category breakdown"}<', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
