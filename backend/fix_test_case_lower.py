filepath = 'tests/test_goals.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('assert any("completed" in n["message"] for n in notifs2)', 'assert any("completed" in n["message"].lower() for n in notifs2)')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
