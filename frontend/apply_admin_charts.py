import re

filepath = r'z:/Budget_Buddy (2)/Budget_Buddy/BudgetBuddy/frontend/src/pages/AdminDashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports for charts if not present
if 'CategoryPieChart' not in content:
    imports = """
import {
  CategoryPieChart,
  ExpenseLineChart
} from '../components/Charts';
"""
    content = content.replace("import api from '../api/axios';", "import api from '../api/axios';\n" + imports)

# Replace the HTML bars with CategoryPieChart
# The original code looks like:
# {systemAnalytics.spending_by_category?.length > 0 ? (
#    <div className="space-y-4">
#       {systemAnalytics.spending_by_category.map((cat, idx) => ( ... ))}
#    </div>
# ) : ( ... )}
# Let's find the section for spending_by_category
cat_start = content.find('{systemAnalytics.spending_by_category?.length > 0 ? (')
if cat_start != -1:
    cat_end = content.find(') : (', cat_start)
    if cat_end != -1:
        new_cat_jsx = """{systemAnalytics.spending_by_category?.length > 0 ? (
                        <div className="h-64 sm:h-80 w-full">
                          <CategoryPieChart 
                            data={systemAnalytics.spending_by_category.map(c => ({
                              name: c.category || c.name || 'Unknown',
                              value: c.amount || c.value || 0
                            }))} 
                          />
                        </div>
                      """
        content = content[:cat_start] + new_cat_jsx + content[cat_end:]

# Replace monthly trend
# {systemAnalytics.monthly_trend?.length > 0 ? (
#    <div className="space-y-3">
#       {systemAnalytics.monthly_trend.map((m, idx) => ( ... ))}
#    </div>
# ) : ( ... )}
trend_start = content.find('{systemAnalytics.monthly_trend?.length > 0 ? (')
if trend_start != -1:
    trend_end = content.find(') : (', trend_start)
    if trend_end != -1:
        new_trend_jsx = """{systemAnalytics.monthly_trend?.length > 0 ? (
                        <div className="h-64 sm:h-80 w-full">
                          <ExpenseLineChart 
                            data={systemAnalytics.monthly_trend.map(m => ({
                              date: m.month || m.date || 'Unknown',
                              amount: m.total_expenses || m.amount || 0
                            }))} 
                          />
                        </div>
                      """
        content = content[:trend_start] + new_trend_jsx + content[trend_end:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated AdminDashboard.jsx with charts")
