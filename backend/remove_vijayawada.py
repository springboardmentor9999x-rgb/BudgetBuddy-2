filepath = 'app/routers/goals.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('return f"**{time_str}**\\n**{date_str}**\\n**Time in Vijayawada East**"', 'return f"**{time_str}**\\n**{date_str}**"')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
