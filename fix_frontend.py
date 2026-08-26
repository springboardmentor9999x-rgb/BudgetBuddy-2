import os

filepath = 'frontend/src/components/NotificationBell.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

if "import ReactMarkdown" not in content:
    content = content.replace("import { Bell,", "import ReactMarkdown from 'react-markdown';\nimport { Bell,")
    
    old_msg = """                      <p className={`text-xs ${!n.is_read ? 'text-white font-semibold' : 'text-slate-300'}`}>
                        {n.message}
                      </p>"""
    
    new_msg = """                      <div className={`text-xs ${!n.is_read ? 'text-white font-semibold' : 'text-slate-300'}`}>
                        {n.rich_text ? (
                          <div className="prose prose-invert prose-xs max-w-none whitespace-pre-wrap">
                            <ReactMarkdown>{n.rich_text}</ReactMarkdown>
                          </div>
                        ) : (
                          <p>{n.message}</p>
                        )}
                      </div>"""
    
    content = content.replace(old_msg, new_msg)
    
    # Also remove the hardcoded timestamp that is displayed below the message since we added it to rich_text.
    old_time = """                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {new Date(n.created_at).toLocaleString()}
                    </span>"""
    
    new_time = """                    {!n.rich_text && (
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    )}"""
    
    content = content.replace(old_time, new_time)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        print("Updated NotificationBell.jsx")
