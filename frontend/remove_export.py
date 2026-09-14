import re

filepath = r'z:/Budget_Buddy (2)/Budget_Buddy/BudgetBuddy/frontend/src/pages/AnalyticsDashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the handleExport function
content = re.sub(r'const handleExport = async \(type\) => \{.*?setExporting\(\'\'\);\s*\}\s*\};', '', content, flags=re.DOTALL)

# Let's remove the export section by identifying the text "Download the report for"
# and removing its parent div structure.
# The structure is: <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800/60 shadow-xl">
export_start = content.find('Download the report')
if export_start != -1:
    div_start = content.rfind('<div className="bg-slate-900/40', 0, export_start)
    if div_start != -1:
        # Find the end of this div... it's a bit tricky, let's just find "Export Excel" and the nearest </div></div>
        export_excel = content.find('Export Excel', export_start)
        if export_excel != -1:
            end_divs = content.find('</div>', export_excel)
            if end_divs != -1:
                end_divs = content.find('</div>', end_divs + 6)
                if end_divs != -1:
                    end_divs = content.find('</div>', end_divs + 6)
                    if end_divs != -1:
                        content = content[:div_start] + content[end_divs + 6:]


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed export section")
