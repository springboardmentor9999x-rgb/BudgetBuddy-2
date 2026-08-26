filepath = 'tests/test_goals.py'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('res_c1.json()["current_amount"]', 'res_c1.json()["goal"]["current_amount"]')
content = content.replace('res_c1.json()["progress_percentage"]', 'res_c1.json()["goal"]["progress_percentage"]')

content = content.replace('res_c2.json()["current_amount"]', 'res_c2.json()["goal"]["current_amount"]')
content = content.replace('res_c2.json()["status"]', 'res_c2.json()["goal"]["status"]')
content = content.replace('res_c2.json()["progress_percentage"]', 'res_c2.json()["goal"]["progress_percentage"]')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
