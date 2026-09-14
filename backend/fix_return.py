filepath = 'app/routers/goals.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# I only want to replace the return statement inside `contribute_to_goal`.
# The function ends with:
#     db.commit()
#     db.refresh(goal)
#     return format_goal_out(goal)

old_str = """    db.commit()
    db.refresh(goal)
    return format_goal_out(goal)"""

new_str = """    db.commit()
    db.refresh(goal)
    return {'goal': format_goal_out(goal), 'notification': notif}"""

content = content.replace(old_str, new_str)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
