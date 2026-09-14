filepath = 'app/routers/goals.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

parts = content.split('def delete_savings_goal')
if len(parts) == 2:
    update_part = parts[0]
    update_part = update_part.replace("return {'goal': format_goal_out(goal), 'notification': notif}", "return format_goal_out(goal)")
    content = update_part + 'def delete_savings_goal' + parts[1]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        print("Fixed update_savings_goal return statement!")
