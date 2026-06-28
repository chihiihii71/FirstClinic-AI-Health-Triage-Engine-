"use client";
import React, { useState, useEffect, useRef } from "react";
import { 
  HeartPulse, 
  Activity, 
  Thermometer, 
  Wind, 
  Stethoscope, 
  Brain, 
  ArrowLeft, 
  Send, 
  PlusCircle, 
  Trash2 
} from "lucide-react";

const API_BASE_URL = "https://huggingface.co/spaces/Jaoooooo9/firstclinic-ai-triage-engine";

export default function Home() {
  // --- STATE ---
  const [currentView, setCurrentView] = useState("chat"); // 'chat' or 'form'
  
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! I can help you with general health questions, or you can enter your vital signs for a specific risk assessment." },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [vitalsActive, setVitalsActive] = useState(false);

  // Vitals Data
  const [vitals, setVitals] = useState({
    Patient_ID: "Guest",
    Respiratory_Rate: "",    
    Oxygen_Saturation: "",   
    O2_Scale: 0,             
    Systolic_BP: "",         
    Heart_Rate: "",          
    Temperature: "",         
    Consciousness: "Alert",
    On_Oxygen: "",           
  });

  const messagesEndRef = useRef(null);

  // --- EFFECTS ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (currentView === "chat") {
      scrollToBottom();
    }
  }, [messages, currentView]);

  // --- HANDLERS ---
  const handleVitalChange = (e) => {
    const { name, value } = e.target;
    setVitals((prev) => ({
      ...prev,
      [name]: value, 
    }));
  };

  const clearVitals = () => {
    setVitalsActive(false);
    setVitals({
      Patient_ID: "Guest",
      Respiratory_Rate: "",
      Oxygen_Saturation: "",
      O2_Scale: 0,
      Systolic_BP: "",
      Heart_Rate: "",
      Temperature: "",
      Consciousness: "Alert",
      On_Oxygen: "",
    });
    setMessages(prev => [...prev, { sender: "bot", text: "I've cleared your vital signs data. We are back to general conversation." }]);
  };

  const sendMessage = async (e, isVitalsAnalysis = false) => {
    if (e) e.preventDefault();
    if (!isVitalsAnalysis && !input.trim()) return;

    let userInput = input;
    let payloadVitals = null;

    const processedVitals = {
      ...vitals,
      Respiratory_Rate: Number(vitals.Respiratory_Rate) || 0,
      Oxygen_Saturation: Number(vitals.Oxygen_Saturation) || 0,
      Systolic_BP: Number(vitals.Systolic_BP) || 0,
      Heart_Rate: Number(vitals.Heart_Rate) || 0,
      Temperature: Number(vitals.Temperature) || 0,
      On_Oxygen: Number(vitals.On_Oxygen) || 0,
    };

    if (isVitalsAnalysis) {
      userInput = "I have updated my vital signs. Please analyze my health risk.";
      payloadVitals = processedVitals;
      setVitalsActive(true);  
      setCurrentView("chat"); // Switch back to chat page immediately
    } else {
      if (vitalsActive) {
        payloadVitals = processedVitals;
      } else {
        payloadVitals = null;
      }
    }

    const newMessage = { sender: "user", text: userInput };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userInput,
          vitals: payloadVitals, 
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned status: ${response.status}`);
      }

      const data = await response.json();
      const botMessage = { sender: "bot", text: data.reply };
      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        sender: "bot",
        text: "Sorry, I can't reach the server right now. Make sure the backend is running!",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDER HELPERS ---

  // 1. THE CHAT VIEW (Exactly Green Code Layout)
  const renderChatView = () => (
    <>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700 flex-shrink-0">
        <div className="flex flex-col">
          <h1 className="text-xl sm:text-2xl font-bold text-blue-400 flex items-center gap-2">
            🏥 Health Chatbot
          </h1>
          {vitalsActive ? (
            <span className="text-xs text-green-400 animate-pulse">● Personalized Mode (Vitals Active)</span>
          ) : (
            <span className="text-xs text-gray-400">● General Mode</span>
          )}
        </div>
        
        <div className="flex gap-2">
          {vitalsActive && (
             <button
             onClick={clearVitals}
             className="flex items-center gap-1 text-xs bg-red-900/30 text-red-300 px-3 py-2 rounded-lg hover:bg-red-900/50 border border-red-800/50 transition"
           >
             <Trash2 size={14} /> Clear
           </button>
          )}
          <button
            onClick={() => setCurrentView("form")}
            className="flex items-center gap-2 text-xs sm:text-sm px-4 py-2 rounded-lg font-medium transition border bg-blue-600 border-blue-500 hover:bg-blue-500 text-white"
          >
            <PlusCircle size={16} /> Add Vitals
          </button>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-700/30 rounded-xl border border-gray-700 scrollbar-thin scrollbar-thumb-gray-600">
          <div className="space-y-4">
              {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`p-3.5 max-w-[85%] rounded-2xl shadow-sm leading-relaxed ${
                  msg.sender === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-gray-700 text-gray-100 rounded-bl-none border border-gray-600"
                  }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  </div>
              </div>
              ))}
              {isLoading && (
              <div className="flex justify-start">
                  <div className="bg-gray-700/50 p-3 rounded-2xl rounded-bl-none">
                  <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                  </div>
              </div>
              )}
              <div ref={messagesEndRef} />
          </div>
      </div>
     
     {/* INPUT AREA */}
     <form onSubmit={(e) => sendMessage(e, false)} className="flex space-x-3 items-center bg-gray-800 pt-2 flex-shrink-0">
       <div className="relative flex-1">
         <input
           type="text"
           className="w-full p-3.5 pl-4 rounded-xl bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400 shadow-inner transition"
           value={input}
           onChange={(e) => setInput(e.target.value)}
           placeholder={vitalsActive ? "Ask about your diagnosis, diet, or lifestyle..." : "Type a message to start chatting..."}
           disabled={isLoading}
         />
       </div>
       <button
         type="submit"
         className="bg-blue-500 p-3.5 rounded-xl hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition shadow-lg flex items-center justify-center min-w-[60px]"
         disabled={isLoading || !input.trim()}
       >
         <Send size={20} />
       </button>
     </form>
    </>
  );

  // 2. THE FORM VIEW (Dedicated "Page")
  const renderFormView = () => (
    <div className="flex flex-col h-full animate-fadeIn">
      {/* Form Header */}
      <div className="flex items-center gap-3 mb-6 border-b border-gray-700 pb-4">
        <button 
          onClick={() => setCurrentView("chat")}
          className="p-2 hover:bg-gray-700 rounded-full transition text-gray-400 hover:text-white"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-blue-400">Update Vital Signs</h2>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          
          {/* Input Group Component for cleaner code */}
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <Activity size={14} /> Systolic BP
            </label>
            <input 
              type="number" 
              name="Systolic_BP" 
              value={vitals.Systolic_BP} 
              onChange={handleVitalChange} 
              placeholder="e.g. 120" 
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" 
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <HeartPulse size={14} /> Heart Rate
            </label>
            <input 
              type="number" 
              name="Heart_Rate" 
              value={vitals.Heart_Rate} 
              onChange={handleVitalChange} 
              placeholder="e.g. 80" 
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" 
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <Thermometer size={14} /> Temperature (°C)
            </label>
            <input 
              type="number" 
              name="Temperature" 
              value={vitals.Temperature} 
              onChange={handleVitalChange} 
              placeholder="e.g. 36.5" 
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" 
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <Wind size={14} /> Oxygen Sat (%)
            </label>
            <input 
              type="number" 
              name="Oxygen_Saturation" 
              value={vitals.Oxygen_Saturation} 
              onChange={handleVitalChange} 
              placeholder="e.g. 98" 
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" 
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <Wind size={14} /> Resp. Rate
            </label>
            <input 
              type="number" 
              name="Respiratory_Rate" 
              value={vitals.Respiratory_Rate} 
              onChange={handleVitalChange} 
              placeholder="e.g. 18" 
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition" 
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <Stethoscope size={14} /> On Oxygen?
            </label>
            <select 
              name="On_Oxygen" 
              value={vitals.On_Oxygen} 
              onChange={handleVitalChange} 
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition appearance-none"
            >
              <option value="">Select...</option>
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <Brain size={14} /> Consciousness
            </label>
            <select 
              name="Consciousness" 
              value={vitals.Consciousness} 
              onChange={handleVitalChange} 
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition appearance-none"
            >
              <option value="Alert">Alert</option>
              <option value="Pain">Response to Pain</option>
              <option value="Verbal">Response to Verbal</option>
              <option value="Unresponsive">Unresponsive</option>
            </select>
          </div>

        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3 pt-4 border-t border-gray-700">
        <button 
          onClick={() => setCurrentView("chat")}
          className="flex-1 py-3 rounded-xl font-bold text-gray-300 bg-gray-700 hover:bg-gray-600 transition"
        >
          Cancel
        </button>
        <button
          onClick={(e) => sendMessage(e, true)}
          className="flex-[2] py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg transition transform active:scale-[0.98]"
        >
          Submit & Analyze Risk
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 font-sans">
      <div className="w-full max-w-3xl bg-gray-800 rounded-2xl shadow-2xl p-4 sm:p-6 flex flex-col h-[85vh] border border-gray-700">
        {currentView === "chat" ? renderChatView() : renderFormView()}
      </div>
    </div>
  );
}