import sys

app_path = r'z:/Budget_Buddy (2)/Budget_Buddy/BudgetBuddy/frontend/src/App.jsx'
with open(app_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '''          {/* Premium & Admin Only Routes */}
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute allowedRoles={['premium', 'admin']}>
                <AnalyticsDashboard />
              </ProtectedRoute>
            } 
          />''',
    '''          {/* Accessible to all authenticated users */}
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <AnalyticsDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Premium & Admin Only Routes */}'''
)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done App.jsx")

sidebar_path = r'z:/Budget_Buddy (2)/Budget_Buddy/BudgetBuddy/frontend/src/components/Sidebar.jsx'
with open(sidebar_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Modify the navigation for Premium users and admins to remove Advanced Analytics, 
# and add Analytics globally, but conditionally name it.

# Find the block where `navItems.push(` for 'Advanced Analytics' happens.
# I'll just do simple string replacements.

content = content.replace(
    """    {
      label: 'Savings Goals',
      path: '/goals',
      icon: Target,
    },
  ];""",
    """    {
      label: 'Savings Goals',
      path: '/goals',
      icon: Target,
    },
    {
      label: user?.role === 'premium' || user?.role === 'admin' ? 'Advanced Analytics' : 'Analytics',
      path: '/analytics',
      icon: BarChart3,
    },
  ];"""
)

content = content.replace(
    """  if (user?.role === 'premium' || user?.role === 'admin') {
    navItems.push(
      {
        label: 'Advanced Analytics',
        path: '/analytics',
        icon: BarChart3,
      },
      {
        label: 'Premium Reports',
        path: '/reports',
        icon: BarChart3,
      }
    );
  }""",
    """  if (user?.role === 'premium' || user?.role === 'admin') {
    navItems.push(
      {
        label: 'Premium Reports',
        path: '/reports',
        icon: BarChart3,
      }
    );
  }"""
)

with open(sidebar_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done Sidebar.jsx")
