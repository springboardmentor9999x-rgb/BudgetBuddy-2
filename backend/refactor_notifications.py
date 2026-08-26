import os
import re

ROUTERS_DIR = "app/routers"

def refactor_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add import for create_global_notif if Notification is imported and used
    if "Notification(" in content or "Notification (" in content:
        if "from app.utils.time_utils import create_global_notif" not in content:
            # Find the imports and add it
            content = content.replace("from app.models import", "from app.utils.time_utils import create_global_notif\nfrom app.models import")
    
    # Simple regex for Notification(user_id=X, type=Y, title=Z, message=W)
    # We will just replace it with create_global_notif(user_id=X, type_str=Y, title=Z, message=W)
    # Wait, regex for this is tricky because of multi-line.
    # We can just write a custom parser for simple cases.
    
    # Or, we can just replace the standard patterns in BudgetBuddy
    content = re.sub(
        r'Notification\(\s*user_id=([^\,]+),\s*type=([^\,]+),\s*title=([^\,]+),\s*message=([^\)]+)\s*\)',
        r'create_global_notif(user_id=\1, type_str=\2, title=\3, message=\4)',
        content,
        flags=re.MULTILINE
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)


for filename in os.listdir(ROUTERS_DIR):
    if filename.endswith(".py") and filename != "goals.py": # goals.py has custom rich text
        refactor_file(os.path.join(ROUTERS_DIR, filename))

print("Refactored all routers")
