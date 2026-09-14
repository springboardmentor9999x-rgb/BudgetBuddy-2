import re

filepath = r'z:/Budget_Buddy (2)/Budget_Buddy/BudgetBuddy/frontend/src/pages/AdminDashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# We will look for the section where user stats are displayed (the div containing "Total Users", "Normal", "Premium", "Admin")
# and we will inject a new <div className="mt-8"> containing the User Accounts Analytics pie chart.
# The summary cards section is right before "SYSTEM FINANCIAL TOTALS"

search_str = 'SYSTEM FINANCIAL TOTALS'
idx = content.find(search_str)

if idx != -1:
    # Find the end of the previous section, which is just before SYSTEM FINANCIAL TOTALS
    div_end = content.rfind('</div>', 0, idx)
    
    if div_end != -1:
        # We will insert a new chart block for User Accounts Distribution
        chart_jsx = """

            {/* ======================================================
                USER ACCOUNTS ANALYTICS (PIE CHART)
                ====================================================== */}
            <div className="mb-8 p-6 rounded-2xl border border-slate-700 bg-slate-800 shadow-sm">
                <h3 className="text-xl font-bold text-slate-100 mb-6 border-b border-slate-700 pb-2">
                    User Accounts Analytics
                </h3>
                <div className="h-64 sm:h-80 w-full">
                    <CategoryPieChart 
                        data={[
                            { name: 'Normal Users', value: systemAnalytics.users?.normal || 0 },
                            { name: 'Premium Users', value: systemAnalytics.users?.premium || 0 },
                            { name: 'Admins', value: systemAnalytics.users?.admin || 0 }
                        ].filter(item => item.value > 0)} 
                    />
                </div>
            </div>

"""
        # We need to make sure we don't insert it inside another div incorrectly.
        # But inserting it right before "SYSTEM FINANCIAL TOTALS" section is safe.
        insert_idx = content.rfind('{/* ======================================================\n          SYSTEM FINANCIAL TOTALS', 0, idx)
        if insert_idx == -1:
            insert_idx = content.rfind('{/*', 0, idx)
        
        if insert_idx != -1:
            content = content[:insert_idx] + chart_jsx + content[insert_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("User Accounts Analytics Chart Added!")
