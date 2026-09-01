import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function PremiumDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'premium' || user?.role === 'admin') {
      fetchInsights();
    }
  }, [user]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const [
        summaryRes, forecastRes, suggestionsRes, insightsRes, advisorRes, 
        overspendingRes, tipsRes, healthRes, anomalyRes
      ] = await Promise.all([
        api.get('/premium/ai/monthly-summary'),
        api.get('/premium/ai/forecast'),
        api.get('/premium/ai/budget-suggestions'),
        api.get('/premium/ai/expense-insights'),
        api.get('/premium/ai/saving-advisor'),
        api.get('/premium/ai/overspending-prediction'),
        api.get('/premium/ai/personalized-tips'),
        api.get('/premium/ai/budget-health'),
        api.get('/premium/ai/anomaly-detection'),
      ]);
      setData({
        summary: summaryRes.data.summary,
        forecast: forecastRes.data.forecast,
        suggestions: suggestionsRes.data.suggestion,
        insights: insightsRes.data.insight,
        advisor: advisorRes.data.advice,
        overspending: overspendingRes.data.prediction,
        tips: tipsRes.data.tips,
        health: healthRes.data.health,
        anomalies: anomalyRes.data.anomalies,
      });
      setLoading(false);
    } catch (err) {
      console.error("Error fetching AI insights", err);
      setLoading(false);
    }
  };

  const handleChat = async (e) => {
    if (e) e.preventDefault();
    if (!chatQuestion.trim()) return;

    const newHistory = [...chatHistory, { role: 'user', content: chatQuestion }];
    setChatHistory(newHistory);
    setChatQuestion('');
    setChatLoading(true);

    try {
      const res = await api.post('/premium/ai/chat', { question: chatQuestion });
      setChatHistory([...newHistory, { role: 'ai', content: res.data.answer }]);
    } catch (err) {
      setChatHistory([...newHistory, { role: 'ai', content: "Sorry, an error occurred while processing your request." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const clearChat = () => {
    setChatHistory([]);
  };

  const handleSuggestedQuestion = (question) => {
    setChatQuestion(question);
  };




  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100">BudgetBuddy Premium</h1>
            <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded border border-green-500/30 flex items-center gap-1">
              <span>🔓</span> AI Unlocked
            </span>
          </div>
          <p className="text-purple-400 text-sm">Powered by AI Financial Assistant</p>
        </div>
      </div>

      <div className="text-xs text-slate-500 bg-slate-900 p-3 rounded flex items-start gap-2">
        <span className="text-xl">ℹ️</span>
        <p>AI insights are based on your BudgetBuddy transaction history and are intended for budgeting assistance only. They may not always be accurate and should not be considered professional financial advice.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="space-y-6">
            <div className="bg-slate-900 border border-purple-900/50 rounded p-6 shadow-lg shadow-purple-900/10 max-h-60 overflow-y-auto">
              <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <span>🤖</span> AI Monthly Summary
              </h2>
              <div className="prose prose-invert prose-sm prose-p:text-slate-300">
                {data?.summary}
              </div>
            </div>

            <div className="bg-slate-900 border border-purple-900/50 rounded p-6 shadow-lg shadow-purple-900/10 max-h-60 overflow-y-auto">
              <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <span>📈</span> Next Month Forecast & Overspending
              </h2>
              <div className="prose prose-invert prose-sm prose-p:text-slate-300 mb-4">
                {data?.forecast}
              </div>
              <div className="prose prose-invert prose-sm prose-p:text-red-400">
                {data?.overspending}
              </div>
            </div>

            <div className="bg-slate-900 border border-purple-900/50 rounded p-6 shadow-lg shadow-purple-900/10 max-h-60 overflow-y-auto">
              <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <span>💡</span> Budget Suggestions & Tips
              </h2>
              <div className="prose prose-invert prose-sm prose-p:text-slate-300 mb-4">
                {data?.suggestions}
              </div>
              <div className="prose prose-invert prose-sm prose-p:text-teal-400">
                {data?.tips}
              </div>
            </div>

            <div className="bg-slate-900 border border-purple-900/50 rounded p-6 shadow-lg shadow-purple-900/10 max-h-60 overflow-y-auto">
              <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                <span>🏥</span> Budget Health & Anomalies
              </h2>
              <div className="prose prose-invert prose-sm prose-p:text-slate-300 mb-4">
                {data?.health}
              </div>
              <div className="prose prose-invert prose-sm prose-p:text-orange-400">
                {data?.anomalies}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <Link to="/reports" className="bg-slate-800 hover:bg-slate-700 p-4 rounded text-center transition-colors">
                 <span className="block text-2xl mb-2">📊</span>
                 <span className="font-semibold text-slate-300">Advanced Reports</span>
               </Link>
               <Link to="/analytics" className="bg-slate-800 hover:bg-slate-700 p-4 rounded text-center transition-colors">
                 <span className="block text-2xl mb-2">📉</span>
                 <span className="font-semibold text-slate-300">Advanced Analytics</span>
               </Link>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded p-6 flex flex-col h-[800px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>💬</span> Ask AI Assistant
              </h2>
              {chatHistory.length > 0 && (
                <button 
                  onClick={clearChat}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded transition-colors"
                >
                  Clear Conversation
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
              {chatHistory.length === 0 ? (
                <div className="text-slate-500 flex flex-col items-center justify-center h-full">
                  <span className="text-4xl mb-4">🤖</span>
                  <p className="mb-6">Ask me about your spending, savings, or budgets!</p>
                  
                  <div className="w-full max-w-sm space-y-2">
                    <p className="text-xs font-semibold text-slate-400 mb-2 text-center uppercase tracking-wider">Suggested Questions</p>
                    {[
                      "How much did I spend this month?",
                      "What is my highest expense category?",
                      "How much money is left in my food budget?",
                      "Am I overspending?",
                      "Where can I reduce my expenses?"
                    ].map((q, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleSuggestedQuestion(q)}
                        className="w-full text-left text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 p-3 rounded transition-colors border border-slate-700/50 hover:border-purple-500/30"
                      >
                        "{q}"
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] p-3 rounded-lg bg-slate-800 text-slate-300 flex items-center gap-2">
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <form onSubmit={handleChat} className="flex gap-2">
              <input 
                type="text" 
                value={chatQuestion}
                onChange={(e) => setChatQuestion(e.target.value)}
                placeholder="Ask about your finances..."
                className="flex-1 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg p-3 focus:outline-none focus:border-purple-500"
                disabled={chatLoading}
              />
              <button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-500 px-6 rounded-lg text-white font-bold transition-colors disabled:opacity-50 flex items-center justify-center"
                disabled={!chatQuestion.trim() || chatLoading}
              >
                Send
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}
