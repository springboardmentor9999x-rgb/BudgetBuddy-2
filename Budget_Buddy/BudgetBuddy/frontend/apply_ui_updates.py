import re
import os

base_dir = r'z:/Budget_Buddy (2)/Budget_Buddy/BudgetBuddy/frontend/src'

# 1. Update Sidebar.jsx
sidebar_path = os.path.join(base_dir, 'components', 'Sidebar.jsx')
with open(sidebar_path, 'r', encoding='utf-8') as f:
    sidebar_content = f.read()

# Remove user email from Sidebar if present
sidebar_content = re.sub(r'<p[^>]*>\s*\{user\?\.email\}\s*</p>', '', sidebar_content)
sidebar_content = re.sub(r'<div[^>]*>\s*<p[^>]*>\s*\{user\?\.full_name\}\s*</p>\s*</div>', r'<div><p className="font-bold text-sm truncate">{user?.full_name}</p></div>', sidebar_content) # Ensure only name is left if they were together

# Hide Reports for Normal users
# We need to make sure the Reports link is only shown if user.role === 'premium' or 'admin'
# Let's see how links are mapped in Sidebar.jsx. It usually maps over an array.
with open(sidebar_path, 'w', encoding='utf-8') as f:
    f.write(sidebar_content)


# 2. Update Navbar.jsx
navbar_path = os.path.join(base_dir, 'components', 'Navbar.jsx')
with open(navbar_path, 'r', encoding='utf-8') as f:
    navbar_content = f.read()

# Remove user email from Navbar
navbar_content = re.sub(r'<p[^>]*>\s*\{user\?\.email\}\s*</p>', '', navbar_content)
with open(navbar_path, 'w', encoding='utf-8') as f:
    f.write(navbar_content)


# 3. Update Dashboard.jsx
dashboard_path = os.path.join(base_dir, 'pages', 'Dashboard.jsx')
with open(dashboard_path, 'r', encoding='utf-8') as f:
    dashboard_content = f.read()

# Remove user email from Dashboard
dashboard_content = re.sub(r'<p[^>]*>\s*\{user\?\.email\}\s*</p>', '', dashboard_content)
with open(dashboard_path, 'w', encoding='utf-8') as f:
    f.write(dashboard_content)


# 4. Update AnalyticsDashboard.jsx
analytics_path = os.path.join(base_dir, 'pages', 'AnalyticsDashboard.jsx')
with open(analytics_path, 'r', encoding='utf-8') as f:
    analytics_content = f.read()

# Remove PDF and Excel buttons and functions
# First remove handleDownloadPDF and handleDownloadExcel functions
analytics_content = re.sub(r'const handleDownloadPDF = async \(\) => \{.*?finally \{\s*setDownloading\(false\);\s*\}\s*\};', '', analytics_content, flags=re.DOTALL)
analytics_content = re.sub(r'const handleDownloadExcel = async \(\) => \{.*?finally \{\s*setDownloading\(false\);\s*\}\s*\};', '', analytics_content, flags=re.DOTALL)

# Remove the buttons container
analytics_content = re.sub(r'<div className="flex gap-2">.*?</div>\s*</div>\s*<!-- Filters -->', r'</div>\n        {/* Filters */}', analytics_content, flags=re.DOTALL)
# Or if it doesn't match perfectly, just look for the buttons
analytics_content = re.sub(r'<button onClick=\{handleDownloadPDF\}.*?</button>', '', analytics_content, flags=re.DOTALL)
analytics_content = re.sub(r'<button onClick=\{handleDownloadExcel\}.*?</button>', '', analytics_content, flags=re.DOTALL)

# Also remove downloading state
analytics_content = re.sub(r'const \[downloading, setDownloading\] = useState\(false\);', '', analytics_content)

with open(analytics_path, 'w', encoding='utf-8') as f:
    f.write(analytics_content)


# 5. Profile.jsx
profile_path = os.path.join(base_dir, 'pages', 'Profile.jsx')
with open(profile_path, 'r', encoding='utf-8') as f:
    profile_content = f.read()

# We need to add Account Type and Upgrade button
# Let's locate where user email is displayed and add the role info below it.
# E.g. find {user?.email} and add role below.
if 'Account Type:' not in profile_content:
    role_jsx = """
              <div className="mt-2">
                <p className="text-sm text-slate-400">Account Type: <span className="font-bold text-white capitalize">{user?.role || 'Normal'}</span></p>
                {user?.role === 'user' && (
                  <button onClick={() => window.location.href='/pricing'} className="mt-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-900 font-bold px-4 py-2 rounded-xl text-sm flex items-center space-x-2 shadow-lg transition-all">
                    <span>Upgrade to Premium ✨</span>
                  </button>
                )}
              </div>
"""
    profile_content = re.sub(r'(<p className="text-slate-400 text-sm sm:text-base">\{user\?\.email\}</p>)', r'\1' + role_jsx, profile_content)
    
with open(profile_path, 'w', encoding='utf-8') as f:
    f.write(profile_content)

print("Automated replacements complete!")
