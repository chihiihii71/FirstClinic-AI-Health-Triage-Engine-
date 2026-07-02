"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase";
import { getAnonId } from "@/lib/anonymousId";
import {
  Plus, MessageSquare, Heart, Send,
  LogOut, Activity, Thermometer, Wind,
  Brain, HeartPulse, X,
  Menu, Trash2, ArrowRight,
} from "lucide-react";

// ─── Constants & Types ────────────────────────────────────────
interface Message { role: "user" | "assistant"; content: string; timestamp: string; }
interface Chat { id: string; title: string; type: "general" | "signs"; }
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const defaultVitals = { Respiratory_Rate: "", Oxygen_Saturation: "", Systolic_BP: "", Heart_Rate: "", Temperature: "", Consciousness: "Alert", On_Oxygen: "" };

export default function ChatPage() {
  const supabase = createClient();
  const [anonId, setAnonId] = useState<string>("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showVitalsPanel, setShowVitalsPanel] = useState(false);
  const [vitals, setVitals] = useState(defaultVitals);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = getAnonId();
    setAnonId(id);
    loadChats(id);
  }, []);

  const loadChats = async (id: string) => {
    const { data } = await supabase.from("chats").select("*").eq("anon_id", id).order("created_at", { ascending: false });
    if (data) setChats(data);
  };

  const loadMessages = async (chatId: string) => {
    const { data } = await supabase.from("messages").select("*").eq("chat_id", chatId).order("created_at", { ascending: true });
    if (data) setMessages(data.map(m => ({ role: m.role, content: m.content, timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })));
  };

  const sendMessage = async (e?: React.FormEvent, isVitals = false) => {
    if (e) e.preventDefault();
    if (!isVitals && !input.trim()) return;
    if (isLoading) return;

    let chatId = currentChatId;
    if (!chatId) {
      const { data } = await supabase.from("chats").insert({ anon_id: anonId, title: input.slice(0, 30) || "New Chat", type: isVitals ? "signs" : "general" }).select().single();
      if (data) {
        chatId = data.id;
        setCurrentChatId(chatId);
        setChats((prev) => [data, ...prev]);
      }
    }

    const text = isVitals ? "Analyze my vital signs: " + JSON.stringify(vitals) : input;
    setMessages((prev) => [...prev, { role: "user", content: isVitals ? "Analyzing vital signs..." : input, timestamp: "Now" }]);
    setInput("");
    setIsLoading(true);
    setShowVitalsPanel(false);

    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: messages }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || "Error", timestamp: "Now" }]);
      await supabase.from("messages").insert([{ chat_id: chatId, role: "user", content: text }, { chat_id: chatId, role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Service unavailable.", timestamp: "Now" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* ── SIDEBAR ── */}
      <aside className={`w-64 bg-[#f0efe9] border-r flex flex-col transition-all ${sidebarOpen ? "" : "hidden"}`}>
        <div className="p-4 border-b flex items-center gap-2">
           <Image src="/logo.png" alt="Logo" width={32} height={32} />
           <span className="font-semibold text-gray-800">BourneIt</span>
        </div>
        <div className="p-3">
          <button onClick={() => { setCurrentChatId(null); setMessages([]); }} className="w-full flex items-center gap-2 p-2 text-sm text-gray-600 hover:bg-[#e5e4de] rounded">
            <Plus size={16} /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          {chats.map((c) => (
            <button key={c.id} onClick={() => { setCurrentChatId(c.id); loadMessages(c.id); }} className="w-full text-left p-2 text-sm text-gray-600 truncate hover:bg-[#e5e4de] rounded">
              {c.title}
            </button>
          ))}
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={20} /></button>
            <button onClick={() => setShowVitalsPanel(true)} className="text-sm bg-teal-50 text-teal-600 px-3 py-1 rounded-lg">Add Vitals</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
                {m.role === 'assistant' && (
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center p-1.5 border border-gray-200 flex-shrink-0">
                    <Image src="/logo.png" alt="Logo" width={24} height={24} className="object-contain" />
                  </div>
                )}
                <div className={`p-4 rounded-2xl max-w-[80%] ${m.role === 'user' ? 'bg-gray-100' : ''}`}>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ── INPUT ── */}
        <div className="p-4">
          <form onSubmit={sendMessage} className="max-w-3xl mx-auto border border-gray-200 rounded-2xl p-2 bg-white flex items-center shadow-sm">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask a health question..."
              className="flex-1 p-2 outline-none resize-none text-sm"
              rows={1}
            />
            <button type="submit" disabled={isLoading} className="p-2 bg-teal-500 text-white rounded-xl"><Send size={16} /></button>
          </form>
        </div>
      </div>

      {/* ── VITALS PANEL ── */}
      {showVitalsPanel && (
        <div className="fixed inset-0 z-50 bg-black/20 flex justify-end">
            <div className="w-96 bg-white p-6 shadow-xl">
                <div className="flex justify-between mb-4">
                    <h2 className="font-bold">Enter Vitals</h2>
                    <button onClick={() => setShowVitalsPanel(false)}><X /></button>
                </div>
                {/* Simplified vitals inputs for example - add all 5 fields back here */}
                <input className="w-full border p-2 mb-2" placeholder="Heart Rate" onChange={(e) => setVitals({...vitals, Heart_Rate: e.target.value})} />
                <button onClick={() => sendMessage(undefined, true)} className="w-full bg-teal-500 text-white p-2 rounded">Analyze</button>
            </div>
        </div>
      )}
    </div>
  );
}