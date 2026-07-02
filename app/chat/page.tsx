"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase";
import { getAnonId } from "@/lib/anonymousId";
import {
  Plus, MessageSquare, Heart, Send,
  LogOut, Activity, Thermometer, Wind,
  Brain, HeartPulse, X,
  AlertCircle, Menu, Trash2, ArrowRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  flagged?: boolean;
}

interface Chat {
  id: string;
  title: string;
  type: "general" | "signs";
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const defaultVitals = {
  Patient_ID: "Guest",
  Respiratory_Rate: "",
  Oxygen_Saturation: "",
  O2_Scale: 0,
  Systolic_BP: "",
  Heart_Rate: "",
  Temperature: "",
  Consciousness: "Alert",
  On_Oxygen: "",
};

const getTimestamp = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// ─── Welcome Screen (Window 1) ──────────────────────────────
function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#f9f9f7] px-6">
      <Image
        src="/logo.png"
        alt="BourneIt Logo"
        width={88}
        height={88}
        className="object-contain mb-5"
        priority
      />
      <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
        BourneIt
      </h1>
      <p className="text-xs text-teal-600 font-medium uppercase tracking-wider mt-2">
        Health Triage Engine
      </p>

      <button
        onClick={onContinue}
        className="mt-8 flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium px-6 py-3 rounded-xl transition shadow-sm"
      >
        Continue
        <ArrowRight size={15} />
      </button>

      <p className="text-xs text-gray-400 mt-6 max-w-xs text-center leading-relaxed">
        For informational purposes only — always consult a qualified healthcare professional.
      </p>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────
export default function ChatPage() {
  const supabase = createClient();

  const [showWelcome, setShowWelcome] = useState(true);
  const [anonId, setAnonId] = useState<string>("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showVitalsPanel, setShowVitalsPanel] = useState(false);
  const [vitals, setVitals] = useState(defaultVitals);
  const [vitalsActive, setVitalsActive] = useState(false);
  const [vitalsBlinking, setVitalsBlinking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const userName = "there";

  // ─── Effects ────────────────────────────────────────────────
  useEffect(() => {
    const id = getAnonId();
    setAnonId(id);
    loadChats(id);
    const timer = setTimeout(() => setVitalsBlinking(false), 12000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  // ─── Data functions ─────────────────────────────────────────
  const loadChats = async (id: string) => {
    const { data } = await supabase
      .from("chats")
      .select("*")
      .eq("anon_id", id)
      .order("created_at", { ascending: false });
    if (data) setChats(data);
  };

  const loadMessages = async (chatId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });
    if (data) {
      setMessages(
        data.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: new Date(m.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }))
      );
    }
  };

  const createNewChat = async (type: "general" | "signs" = "general"): Promise<string | null> => {
    if (!anonId) return null;
    const { data } = await supabase
      .from("chats")
      .insert({ anon_id: anonId, title: type === "signs" ? "Vital Signs Analysis" : "New Conversation", type })
      .select()
      .single();

    if (data) {
      setChats((prev) => [data, ...prev]);
      setCurrentChatId(data.id);
      setMessages([]);
      setVitalsActive(type === "signs");
      return data.id;
    }
    return null;
  };

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("chats").delete().eq("id", chatId);
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
      setMessages([]);
      setVitalsActive(false);
    }
  };

  const saveMessage = async (chatId: string, role: string, content: string) => {
    await supabase.from("messages").insert({ chat_id: chatId, role, content });
  };

  const updateChatTitle = async (chatId: string, title: string) => {
    await supabase.from("chats").update({ title }).eq("id", chatId);
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, title } : c)));
  };

  const clearAllHistory = () => {
    if (confirm("Clear all chat history? This cannot be undone.")) {
      supabase.from("chats").delete().eq("anon_id", anonId).then(() => {
        setChats([]);
        setCurrentChatId(null);
        setMessages([]);
        setVitalsActive(false);
      });
    }
  };

  const sendMessage = async (e?: React.FormEvent, isVitalsAnalysis = false) => {
    if (e) e.preventDefault();
    if (!isVitalsAnalysis && !input.trim()) return;
    if (!isOnline) return;

    let chatId = currentChatId;
    if (!chatId) {
      chatId = await createNewChat(isVitalsAnalysis ? "signs" : "general");
      if (!chatId) return;
    }

    const userText = isVitalsAnalysis ? "Please analyse my vital signs and assess my health risk." : input;
    const processedVitals = vitalsActive || isVitalsAnalysis
      ? {
          ...vitals,
          Respiratory_Rate: Number(vitals.Respiratory_Rate) || 0,
          Oxygen_Saturation: Number(vitals.Oxygen_Saturation) || 0,
          Systolic_BP: Number(vitals.Systolic_BP) || 0,
          Heart_Rate: Number(vitals.Heart_Rate) || 0,
          Temperature: Number(vitals.Temperature) || 0,
          On_Oxygen: Number(vitals.On_Oxygen) || 0,
        }
      : null;

    setMessages((prev) => [...prev, { role: "user", content: userText, timestamp: getTimestamp() }]);
    setInput("");
    setIsLoading(true);

    if (isVitalsAnalysis) {
      setShowVitalsPanel(false);
      setVitalsActive(true);
    }

    await saveMessage(chatId, "user", userText);
    if (messages.length === 0) await updateChatTitle(chatId, userText.length > 45 ? userText.slice(0, 45) + "..." : userText);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, vitals: processedVitals, history: messages, user_name: userName }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      const assistantText = data.reply || "No response received";

      setMessages((prev) => [...prev, { role: "assistant", content: assistantText, timestamp: getTimestamp() }]);
      await saveMessage(chatId, "assistant", assistantText);
    } catch (error: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Service unavailable.", timestamp: getTimestamp() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const generalChats = chats.filter((c) => c.type === "general");
  const signsChats = chats.filter((c) => c.type === "signs");

  if (showWelcome) return <WelcomeScreen onContinue={() => setShowWelcome(false)} />;

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      {/* ── SIDEBAR ── */}
      <aside className={`flex flex-col bg-[#f0efe9] border-r border-[#e5e4de] flex-shrink-0 transition-all duration-300 ${sidebarOpen ? "w-64" : "w-0 overflow-hidden"}`}>
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[#e5e4de]">
          <Image src="/logo.png" alt="BourneIt Logo" width={36} height={36} className="object-contain flex-shrink-0" priority />
          <span className="font-semibold text-gray-800 text-sm">BourneIt</span>
        </div>
        <div className="p-3 border-b border-[#e5e4de]">
          <button onClick={() => { setCurrentChatId(null); setMessages([]); setVitalsActive(false); setVitals(defaultVitals); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-[#e5e4de] transition">
            <Plus size={15} /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
           {generalChats.length > 0 && (
             <div>
               <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1.5">General</p>
               {generalChats.map((chat) => (
                  <button key={chat.id} onClick={() => { setCurrentChatId(chat.id); loadMessages(chat.id); setVitalsActive(false); }} className={`group w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition mb-0.5 ${currentChatId === chat.id ? "bg-[#e2e0d9] text-gray-900" : "text-gray-600 hover:bg-[#e8e7e1]"}`}>
                    <MessageSquare size={13} className="flex-shrink-0 text-gray-400" />
                    <span className="truncate flex-1">{chat.title}</span>
                    <span onClick={(e) => deleteChat(chat.id, e)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition text-gray-400"><Trash2 size={12} /></span>
                  </button>
               ))}
             </div>
           )}
           <div>
            <div className="flex items-center justify-between px-2 mb-1.5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Signs</p>
              <button onClick={() => { createNewChat("signs"); setShowVitalsPanel(true); }} className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded-md transition ${vitalsBlinking ? "bg-teal-100 text-teal-600 animate-pulse" : "text-teal-600 hover:bg-teal-50"}`}>
                <Plus size={10} /> Add Vitals
              </button>
            </div>
            {signsChats.map((chat) => (
              <button key={chat.id} onClick={() => { setCurrentChatId(chat.id); loadMessages(chat.id); setVitalsActive(true); }} className={`group w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition mb-0.5 ${currentChatId === chat.id ? "bg-[#e2e0d9] text-gray-900" : "text-gray-600 hover:bg-[#e8e7e1]"}`}>
                <Heart size={13} className="flex-shrink-0 text-teal-400" />
                <span className="truncate flex-1">{chat.title}</span>
                <span onClick={(e) => deleteChat(chat.id, e)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition text-gray-400"><Trash2 size={12} /></span>
              </button>
            ))}
           </div>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition"><Menu size={18} /></button>
          <button onClick={() => setShowVitalsPanel(true)} className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 border border-teal-100"><Activity size={14} /> Add Vitals</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <Image src="/logo.png" alt="BourneIt Logo" width={56} height={56} className="object-contain mb-4" priority />
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">How can I help you today?</h2>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="flex items-center mb-2">
                       {/* --- CHANGED SECTION --- */}
                       <Image src="/logo.png" alt="BourneIt Logo" width={24} height={24} className="object-contain" />
                       {/* ------------------------ */}
                    </div>
                  )}
                  <div className={`max-w-[85%] ${msg.role === "user" ? "bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl rounded-tr-md" : "text-gray-800"}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <span className="text-xs text-gray-400 mt-1.5">{msg.timestamp}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="px-4 pb-5 pt-2">
          <form onSubmit={(e) => sendMessage(e, false)} className="max-w-3xl mx-auto">
             <div className="flex items-end gap-3 border border-gray-200 rounded-2xl px-4 py-3 bg-white shadow-sm">
              <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a health question..." rows={1} className="flex-1 resize-none outline-none text-sm text-gray-800 bg-transparent max-h-40" />
              <button type="submit" disabled={isLoading} className="p-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition"><Send size={15} /></button>
             </div>
          </form>
        </div>
      </div>

      {/* ── VITALS PANEL ── */}
      {showVitalsPanel && (
         <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/10" onClick={() => setShowVitalsPanel(false)} />
            <div className="w-96 bg-white shadow-2xl p-5 border-l border-gray-200">
               {/* Vitals form content... */}
            </div>
         </div>
      )}
    </div>
  );
}