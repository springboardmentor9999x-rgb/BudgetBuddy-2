import re

path = r'z:/Budget_Buddy (2)/Budget_Buddy/BudgetBuddy/backend/app/routers/reports.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'get_current_active_user' not in content:
    content = content.replace('from app.security import get_current_premium_user', 'from app.security import get_current_premium_user, get_current_active_user')

pattern = r'(@router\.get\(\"/export/excel\"\).*?)get_current_premium_user'
content = re.sub(pattern, r'\g<1>get_current_active_user', content, flags=re.DOTALL)

# Let's also check if any other endpoints like /monthly or /summary or /analytics/xxx need updating!
# Wait! /analytics router in `backend/app/routers/analytics.py` - we should make sure that the analytics endpoints are accessible by free users too!
# Because if `/analytics/summary` is only for Premium, Free users will just see errors.

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated reports.py")
