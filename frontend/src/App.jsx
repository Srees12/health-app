import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

function App() {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [alert, setAlert] = useState(null);
  const socketRef = useRef(null);

  // --- 1. Connect to WebSocket (Real-time Alerts) ---
  useEffect(() => {
    // IMPORTANT: Replace this with your actual WebSocket URL from Render!
    const WS_URL = import.meta.env.VITE_WS_URL || 'wss://YOUR_WS_NAME.onrender.com';
    
    socketRef.current = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true,
    });

    socketRef.current.on('connect', () => {
      console.log('🔗 Connected to Emergency WebSocket');
    });

    socketRef.current.on('emergency_broadcast', (data) => {
      console.log(' EMERGENCY ALERT:', data);
      setAlert(data.alert);
      // Auto-hide alert after 10 seconds
      setTimeout(() => setAlert(null), 10000);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  // --- 2. Handle Symptom Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) return;

    setLoading(true);
    // IMPORTANT: Replace this with your actual API URL from Render!
    const API_URL = import.meta.env.VITE_API_URL || 'https://YOUR_API_NAME.onrender.com';

    try {
      const response = await fetch(`${API_URL}/triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: symptoms }),
      });
      const data = await response.json();

      // Add to history list
      const newEntry = {
        id: Date.now(),
        symptoms: symptoms,
        risk: data.risk,
        action: data.action,
        timestamp: new Date().toLocaleTimeString(),
      };
      setHistory([newEntry, ...history]);
      setSymptoms('');
    } catch (error) {
      console.error('Error submitting triage:', error);
      alert('Failed to connect to the server. Make sure your API is running.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {/* --- LIVE ALERT BANNER --- */}
      {alert && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-4 shadow-2xl animate-pulse">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-3xl"></span>
              <div>
                <p className="font-bold text-xl">HIGH RISK EMERGENCY TRIGGERED!</p>
                <p className="text-sm opacity-90">{alert}</p>
              </div>
            </div>
            <button onClick={() => setAlert(null)} className="bg-red-800 px-4 py-2 rounded-lg hover:bg-red-700">
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto pt-10">
        {/* --- HEADER --- */}
        <div className="text-center mb-12">
          <div className="inline-block bg-blue-500/10 backdrop-blur-sm rounded-2xl px-6 py-2 border border-blue-500/20 mb-4">
            <span className="text-blue-400 font-mono text-sm"> AI-POWERED HEALTHCARE</span>
          </div>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-teal-400 to-blue-500 bg-clip-text text-transparent">
            Symptom Triage Assistant
          </h1>
          <p className="text-slate-400 mt-4 text-lg">Describe your symptoms, and our AI will guide you immediately.</p>
        </div>

        <div className="grid md:grid-cols-5 gap-8">
          {/* --- LEFT COLUMN: Input Form --- */}
          <div className="md:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-6 border border-slate-700 shadow-xl">
              <form onSubmit={handleSubmit}>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  How are you feeling?
                </label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="w-full h-40 bg-slate-900 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="e.g., I have severe chest pain and I feel dizzy..."
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 bg-gradient-to-r from-blue-600 to-teal-500 hover:scale-105 transform transition duration-200 text-white font-bold py-4 px-6 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </span>
                  ) : (
                    ' Submit for Triage'
                  )}
                </button>
              </form>
              <div className="mt-4 text-xs text-slate-500 text-center">
                 Connected to Cloud Backend • WebSocket Active
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: History --- */}
          <div className="md:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-300">📋 Triage History</h2>
              <span className="text-sm bg-slate-800 px-3 py-1 rounded-full text-slate-400">{history.length} reports</span>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scroll">
              {history.length === 0 ? (
                <div className="bg-slate-800/30 rounded-2xl p-10 text-center border border-dashed border-slate-700">
                  <p className="text-slate-500">No triages yet.</p>
                  <p className="text-slate-600 text-sm">Submit your symptoms to see results here.</p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-slate-800/60 backdrop-blur-sm p-5 rounded-2xl border transition-all hover:scale-[1.02] ${
                      item.risk === 'HIGH' ? 'border-red-500/50 shadow-red-500/20 shadow-lg' : 'border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-slate-200 font-medium">"{item.symptoms}"</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              item.risk === 'HIGH'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-green-500/20 text-green-400 border border-green-500/30'
                            }`}
                          >
                            RISK: {item.risk}
                          </span>
                          <span className="text-slate-400 text-sm">{item.action}</span>
                        </div>
                      </div>
                      <span className="text-slate-500 text-xs bg-slate-900 px-2 py-1 rounded-lg">{item.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="mt-16 text-center text-slate-600 text-sm border-t border-slate-800 pt-8">
          Built with  • Unified Healthcare Platform • Cloud Deployed
        </div>
      </div>
    </div>
  );
}

export default App;
