import sys
import re

path = r'z:/Budget_Buddy (2)/Budget_Buddy/BudgetBuddy/frontend/src/pages/AnalyticsDashboard.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'useAuth' not in content:
    content = content.replace("import api from '../api/axios';", "import api from '../api/axios';\nimport { useAuth } from '../context/AuthContext';")

if 'const { user } = useAuth();' not in content:
    content = content.replace("export default function AnalyticsDashboard() {", "export default function AnalyticsDashboard() {\n  const { user } = useAuth();\n")

content = content.replace(">Monthly Income<", ">{user?.role === 'user' ? 'Income' : 'Monthly Income'}<")
content = content.replace(">Monthly Expenses<", ">{user?.role === 'user' ? 'Expenses' : 'Monthly Expenses'}<")
content = content.replace(">Monthly category breakdown<", ">{user?.role === 'user' ? 'Category breakdown' : 'Monthly category breakdown'}<")

pdf_btn = """              <button
                onClick={() => handleExport('pdf')}
                disabled={exporting === 'pdf'}
                className="flex items-center px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm font-semibold transition-colors border border-blue-500/30"
              >
                {exporting === 'pdf' ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Export PDF
                  </>
                )}
              </button>"""

excel_btn = """              <button
                onClick={() => handleExport('excel')}
                disabled={exporting === 'excel'}
                className="flex items-center px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg text-sm font-semibold transition-colors border border-emerald-500/30"
              >
                {exporting === 'excel' ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export Excel
                  </>
                )}
              </button>"""

if pdf_btn in content and "user?.role !== 'premium'" not in content:
    content = content.replace(pdf_btn, f"{{ user?.role === 'admin' && (\n{pdf_btn}\n)}}")

if excel_btn in content and "user?.role !== 'premium'" not in content:
    content = content.replace(excel_btn, f"{{ (user?.role === 'user' || user?.role === 'admin') && (\n{excel_btn}\n)}}")

export_div_pattern = r'<div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl mb-8">.*?</button>\s*</div>\s*</div>'
match = re.search(export_div_pattern, content, re.DOTALL)
if match:
    export_div_content = match.group(0)
    if "user?.role !== 'premium'" not in export_div_content:
        new_export_div = f"{{user?.role !== 'premium' && (\n{export_div_content}\n)}}"
        content = content.replace(export_div_content, new_export_div)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done AnalyticsDashboard.jsx")
