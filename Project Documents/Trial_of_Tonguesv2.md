# Trial_of_Tonguesv2

```jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, User, Send, Award, AlertCircle, 
  MessageSquare, ChevronRight, RefreshCw,
  Trophy, Star, Briefcase, XCircle, CheckCircle
} from 'lucide-react';

// --- DATA: REALM MANAGERS ---
const NPC_DATA = {
  ag: { name: "Elder Thorne", title: "High Warden of Aethelwood", realm: "Agriculture", avatar: "🌿" },
  arch: { name: "Master Mason Kael", title: "Architect of the Monolith", realm: "Architecture", avatar: "🏰" },
  arts: { name: "Lyra Moonwhisper", title: "Grand Bard of the Spire", realm: "Arts & Comm", avatar: "🎭" },
  bus: { name: "Exarch Vane", title: "Chief Strategist of the Citadel", realm: "Business", avatar: "⚖️" },
  edu: { name: "Archivist Elara", title: "Sage of Ascension", realm: "Education", avatar: "📜" },
  it: { name: "Technomancer Zero", title: "Core Overseer of the Nexus", realm: "IT", avatar: "💾" },
  law: { name: "Captain Hekton", title: "Iron Guard Commander", realm: "Law & Safety", avatar: "🛡️" },
  stem: { name: "Doctor Althea", title: "Prime Alchemist", realm: "STEM", avatar: "🧪" },
  default: { name: "Guild Proctor", title: "The High Council Liaison", realm: "The Horizon", avatar: "👑" }
};

// --- DATA: SOFT SKILL CHECKS ---
const SOFT_SKILLS = [
  {
    id: 1,
    scenario: "The Guild Manager pauses, leaving a long, uncomfortable silence to test your nerve. What is your physical response?",
    options: [
      { text: "Maintain steady, pleasant eye contact and wait patiently.", score: 10, feedback: "You showed professional composure." },
      { text: "Pull out your glowing crystal (phone) to pass the time.", score: -15, feedback: "You appeared distracted and disrespectful." },
      { text: "Nervously start rambling to fill the silence.", score: -5, feedback: "You showed a lack of confidence." }
    ]
  },
  {
    id: 2,
    scenario: "The Manager mentions a complex Guild regulation that you don't fully understand.",
    options: [
      { text: "Nod and pretend you know exactly what they mean.", score: -10, feedback: "You lacked integrity by pretending." },
      { text: "Politely ask them to clarify the regulation.", score: 10, feedback: "You showed active listening and honesty." },
      { text: "Change the subject back to how great your skills are.", score: -5, feedback: "You avoided the topic entirely." }
    ]
  },
  {
    id: 3,
    scenario: "The Manager finishes speaking and formally stands up from their desk.",
    options: [
      { text: "Stand up, give a firm handshake (or Realm equivalent), and thank them.", score: 10, feedback: "Excellent professional closing." },
      { text: "Say 'Peace out' and walk away immediately.", score: -15, feedback: "Far too casual for a formal Guild Master." },
      { text: "Wait awkwardly in your seat for them to tell you to leave.", score: -5, feedback: "You lacked initiative and awareness." }
    ]
  }
];

const App = () => {
  // State management
  const [realmId, setRealmId] = useState('it'); 
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [favor, setFavor] = useState(50); // 0-100 Reputation Meter (Needs ~70 to pass)
  
  // Phase management
  const [phase, setPhase] = useState('intro'); // 'intro', 'active', 'finished'
  const [turn, setTurn] = useState(0); 
  const [pendingRoll, setPendingRoll] = useState(null);
  
  const scrollRef = useRef(null);
  const npc = NPC_DATA[realmId] || NPC_DATA.default;

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pendingRoll]);

  // --- API INTEGRATION ---
  const apiKey = ""; 
  const model = "gemini-2.5-flash-preview-09-2025";

  const callGemini = async (userPrompt, chatHistory) => {
    const systemPrompt = `
      You are ${npc.name}, the ${npc.title} of the ${npc.realm} Guild. 
      You are conducting a strict, formal 3-question job interview for a Traveler.
      
      RULES:
      - Stay strictly in character as a high-fantasy guild leader. 
      - Keep responses to 2 or 3 short sentences.
      - DO NOT ask the user to rephrase or try again if they use slang/poor grammar. Judge them silently, react narratively with disappointment, and move on.
      
      INTERVIEW FLOW:
      - If this is the start: Introduce yourself and ask Question 1 ("Why do you seek to serve this Guild?").
      - If they answer Question 1: React to their answer, then ask Question 2 ("Tell me about a time you solved a problem using your unique skills.").
      - If they answer Question 2: React to their answer, then ask Question 3 ("How do you handle disputes with fellow Travelers?").
      - If they answer Question 3: React to their answer, then state EXACTLY: "The interview is concluded. I will now weigh your merits." Do not ask any more questions.
    `;

    let retries = 0;
    const maxRetries = 5;

    while (retries < maxRetries) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              ...chatHistory,
              { role: "user", parts: [{ text: userPrompt }] }
            ],
            systemInstruction: { parts: [{ text: systemPrompt }] }
          })
        });

        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text;
      } catch (err) {
        retries++;
        await new Promise(res => setTimeout(res, Math.pow(2, retries) * 1000));
        if (retries === maxRetries) return "The Etheric connection is weak. Please retry your ritual.";
      }
    }
  };

  const startInterview = async () => {
    setPhase('active');
    setIsLoading(true);
    const initialText = await callGemini("Begin the interview.", []);
    setMessages([{ role: "model", text: initialText }]);
    setTurn(1);
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");
    
    // Add User Message to Chat
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    // AI Grammar/Professionalism Check
    let favorDelta = 0;
    if (userMessage.length > 20) favorDelta += 5; 
    if (userMessage[0] === userMessage[0].toUpperCase()) favorDelta += 2; 
    if (/[.!?]$/.test(userMessage)) favorDelta += 2; 
    if (userMessage.toLowerCase().includes("idk") || userMessage.toLowerCase().includes("lol") || userMessage.toLowerCase().includes("gonna")) favorDelta -= 15;
    
    setFavor(prev => Math.min(100, Math.max(0, prev + favorDelta)));

    // Clean history for API (filter out 'action' logs)
    const history = messages
      .filter(m => m.role === 'user' || m.role === 'model')
      .map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

    // Get AI Response
    const response = await callGemini(userMessage, history);
    setMessages(prev => [...prev, { role: "model", text: response }]);
    setIsLoading(false);

    // Trigger Soft Skill Roll between turns
    if (turn <= 3) {
      setPendingRoll(SOFT_SKILLS[turn - 1]);
    }
  };

  const handleRollSelection = (option) => {
    // Apply score
    setFavor(prev => Math.min(100, Math.max(0, prev + option.score)));
    
    // Add visual feedback to chat
    setMessages(prev => [...prev, { 
      role: "action", 
      text: `Action Taken: ${option.text}`,
      feedback: option.feedback,
      score: option.score
    }]);

    setPendingRoll(null);
    setTurn(prev => prev + 1);

    // If that was the 3rd turn, end the interview
    if (turn === 3) {
      setTimeout(() => {
        setPhase('finished');
      }, 1500);
    }
  };

  const passThreshold = 70;
  const hasPassed = favor >= passThreshold;

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#94a3b8] p-4 flex flex-col items-center font-sans">
      
      {/* HEADER: Reputation & Identity */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-6 bg-[#11141d] border border-[#d97706]/30 p-4 rounded-xl shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-[#f59e0b]/10 border border-[#f59e0b] rounded-full flex items-center justify-center text-2xl">
            {npc.avatar}
          </div>
          <div>
            <h3 className="text-[#f1f5f9] font-bold uppercase tracking-widest text-sm" style={{ fontFamily: 'Cinzel, serif' }}>
              {npc.name}
            </h3>
            <p className="text-[#f59e0b] text-xs font-semibold">{npc.title}</p>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="flex items-center space-x-2 mb-1">
            <Award className="w-4 h-4 text-[#f59e0b]" />
            <span className="text-xs uppercase font-bold text-[#f1f5f9]">Guild Favor</span>
          </div>
          <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div 
              className={`h-full transition-all duration-500 ${favor >= 70 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-[#d97706] to-[#f59e0b]'}`}
              style={{ width: `${favor}%` }}
            />
          </div>
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="w-full max-w-2xl flex-1 flex flex-col bg-[#0f111a] border-x-2 border-t-2 border-[#1e293b] rounded-t-2xl shadow-2xl relative overflow-hidden">
        
        {/* Background Texture */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#f59e0b 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        {phase === 'intro' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center z-10">
            <Briefcase className="w-16 h-16 text-[#f59e0b] mb-4 animate-pulse" />
            <h2 className="text-3xl text-[#f1f5f9] mb-4" style={{ fontFamily: 'Cinzel, serif' }}>The Trial of Tongues</h2>
            <p className="max-w-md text-[#94a3b8] mb-8 italic">
              "To join a Great Realm, you must possess professional clarity. Your words and actions will be judged silently. Do not fail."
            </p>
            <button 
              onClick={startInterview}
              className="px-12 py-4 bg-[#f59e0b] text-[#0a0c10] font-black rounded-lg hover:bg-[#d97706] transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.3)] uppercase tracking-widest"
            >
              Step into the Chamber
            </button>
          </div>
        )}

        {phase === 'active' && (
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 z-10">
            {messages.map((m, i) => {
              if (m.role === 'action') {
                return (
                  <div key={i} className="flex justify-center my-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-[#1e293b]/80 border border-[#334155] px-6 py-3 rounded-xl text-center max-w-[80%]">
                      <p className="text-[#94a3b8] text-xs uppercase tracking-widest mb-1">Soft Skill Check</p>
                      <p className="text-[#f1f5f9] text-sm italic mb-2">"{m.text}"</p>
                      <p className={`text-xs font-bold ${m.score > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {m.feedback} ({m.score > 0 ? '+' : ''}{m.score} Favor)
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl relative ${
                    m.role === 'user' 
                    ? 'bg-[#1e293b] text-[#f1f5f9] rounded-tr-none border border-[#334155]' 
                    : 'bg-[#11141d] text-[#f1f5f9] border border-[#f59e0b]/30 rounded-tl-none border-l-4 border-l-[#f59e0b]'
                  }`}>
                    <p className="text-sm leading-relaxed tracking-wide">
                      {m.text}
                    </p>
                  </div>
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#11141d] p-4 rounded-2xl border border-[#f59e0b]/20 flex space-x-2">
                  <div className="w-2 h-2 bg-[#f59e0b] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="w-2 h-2 bg-[#f59e0b] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-[#f59e0b] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}

            {/* SOFT SKILL ROLL MODAL (Inline) */}
            {pendingRoll && (
              <div className="mt-8 bg-[#0a0c10] border-2 border-emerald-600/50 rounded-xl p-5 shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-in slide-in-from-bottom-4 fade-in duration-500">
                <div className="flex items-center space-x-2 mb-3">
                  <Star className="w-5 h-5 text-emerald-500" />
                  <h4 className="text-emerald-500 font-bold uppercase tracking-wider text-sm">Charisma Check</h4>
                </div>
                <p className="text-[#f1f5f9] mb-4">{pendingRoll.scenario}</p>
                <div className="space-y-3">
                  {pendingRoll.options.map((opt, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleRollSelection(opt)}
                      className="w-full text-left p-3 rounded-lg bg-[#11141d] border border-[#1e293b] hover:border-emerald-500 hover:bg-[#1e293b] text-[#94a3b8] hover:text-[#f1f5f9] transition-all flex justify-between items-center group"
                    >
                      <span className="text-sm pr-4">{opt.text}</span>
                      <ChevronRight className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FINAL EVALUATION SCREEN */}
        {phase === 'finished' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center z-10 animate-in zoom-in fade-in duration-700">
            {hasPassed ? (
              <>
                <CheckCircle className="w-20 h-20 text-emerald-500 mb-6" />
                <h2 className="text-3xl text-emerald-400 mb-2 font-bold" style={{ fontFamily: 'Cinzel, serif' }}>Guild Accepted</h2>
                <p className="text-[#f1f5f9] mb-6 max-w-md">
                  You have proven yourself. Your communication was clear, and your composure under pressure was worthy of a true Traveler.
                </p>
              </>
            ) : (
              <>
                <XCircle className="w-20 h-20 text-red-500 mb-6" />
                <h2 className="text-3xl text-red-400 mb-2 font-bold" style={{ fontFamily: 'Cinzel, serif' }}>Trial Failed</h2>
                <p className="text-[#f1f5f9] mb-6 max-w-md">
                  Your conduct did not meet the standards of the Guild. Whether through poor grammar, lack of professionalism, or improper etiquette, you must refine your skills.
                </p>
              </>
            )}
            
            <div className="bg-[#11141d] p-6 rounded-xl border border-[#1e293b] w-full max-w-sm mb-8">
              <h4 className="text-xs uppercase tracking-widest text-slate-500 mb-2">Final Evaluation</h4>
              <div className="text-4xl font-black text-[#f1f5f9] mb-1">{favor}<span className="text-xl text-slate-600">/100</span></div>
              <p className={`text-sm font-bold ${hasPassed ? 'text-emerald-500' : 'text-red-500'}`}>
                {hasPassed ? 'Threshold Met (70+)' : 'Threshold Not Met'}
              </p>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-[#1e293b] border border-[#334155] text-[#f1f5f9] rounded-lg hover:bg-[#334155] transition-all flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{hasPassed ? 'Return to Hub' : 'Schedule Another Interview'}</span>
            </button>
          </div>
        )}
      </div>

      {/* INPUT BAR */}
      <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-[#11141d] border-2 border-[#1e293b] p-4 rounded-b-2xl shadow-xl flex items-center space-x-3 z-20 relative">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={phase !== 'active' || isLoading || pendingRoll !== null}
          placeholder={
            phase === 'finished' ? "The trial has concluded." :
            pendingRoll ? "Make your choice above..." :
            phase === 'active' ? "Type your professional response..." : 
            "Wait for the Proctor to begin..."
          }
          className="flex-1 bg-transparent border-none focus:ring-0 text-[#f1f5f9] placeholder-slate-600 font-medium disabled:opacity-50"
        />
        <button 
          type="submit"
          disabled={phase !== 'active' || isLoading || !input.trim() || pendingRoll !== null}
          className="w-12 h-12 flex items-center justify-center bg-[#f59e0b] text-[#0a0c10] rounded-xl hover:bg-[#d97706] disabled:bg-slate-800 disabled:text-slate-500 transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* FOOTER: HUD INFO */}
      <div className="mt-6 flex items-center space-x-6 text-[10px] uppercase font-bold tracking-widest text-slate-600">
        <div className="flex items-center space-x-2">
          <Shield className="w-3 h-3" />
          <span>Protocol: Professional</span>
        </div>
        <div className="flex items-center space-x-2">
          <Trophy className="w-3 h-3" />
          <span>Phase: {phase}</span>
        </div>
      </div>

    </div>
  );
};

export default App;
```
