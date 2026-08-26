import os

ROUTERS_DIR = "app/routers"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    new_lines = []
    changed = False
    in_notif = False
    for line in lines:
        if "notif = Notification(" in line or "existing_alert = db.query(Notification)" in line:
            if "existing_alert = db.query(Notification)" not in line:
                in_notif = True
                new_lines.append(line.replace("Notification(", "create_global_notif("))
                changed = True
            else:
                new_lines.append(line)
        elif in_notif and "type=" in line:
            new_lines.append(line.replace("type=", "type_str="))
        elif in_notif and ")" in line:
            new_lines.append(line)
            if line.strip() == ")" or line.strip() == ")," or line.strip() == "):" or " )" in line:
                pass
            if line.strip().endswith(")"):
                in_notif = False
        else:
            new_lines.append(line)
            
    if changed:
        content = "".join(new_lines)
        if "from app.utils.time_utils import create_global_notif" not in content:
            content = content.replace("from app.models import Notification", "from app.models import Notification\nfrom app.utils.time_utils import create_global_notif")
            content = content.replace("from app.models import User, Account", "from app.models import User, Account, Notification\nfrom app.utils.time_utils import create_global_notif")
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Refactored {filepath}")

for filename in os.listdir(ROUTERS_DIR):
    if filename.endswith(".py") and filename != "goals.py":
        process_file(os.path.join(ROUTERS_DIR, filename))
