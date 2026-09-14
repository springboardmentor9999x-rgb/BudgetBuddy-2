import os
import re

ROUTERS_DIR = "app/routers"

def refactor_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if "Notification(" not in content:
        return

    pattern = r'Notification\(\s*user_id=([^,]+),\s*type=([^,]+),\s*title=([^,]+),\s*message=([^)]+)\s*\)'
    new_content = re.sub(
        pattern,
        r'create_global_notif(user_id=\1, type_str=\2, title=\3, message=\4)',
        content
    )

    if new_content != content:
        if "from app.utils.time_utils import create_global_notif" not in new_content:
            new_content = new_content.replace("from app.models import Notification", "from app.models import Notification\nfrom app.utils.time_utils import create_global_notif")
            new_content = new_content.replace("from app.models import User", "from app.models import User\nfrom app.utils.time_utils import create_global_notif")

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Refactored {filepath}")

for filename in os.listdir(ROUTERS_DIR):
    if filename.endswith(".py") and filename != "goals.py":
        refactor_file(os.path.join(ROUTERS_DIR, filename))
