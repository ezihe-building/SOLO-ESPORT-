import React, { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Eye, EyeOff, Phone, Mail, Lock } from "lucide-react";

function InputField({
  id, label, type = "text", value, onChange, placeholder, prefix, icon: Icon, required = true,
}: {
  id: string; label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; prefix?: string;
  icon?: React.ElementType; required?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-bold text-white/60 uppercase tracking-widest">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="flex rounded-xl overflow-hidden border border-white/10 focus-within:border-red-500/50 transition-colors bg-white/4">
        {prefix && (
          <span className="flex items-center px-3 bg-red-500/15 text-red-400 text-sm font-bold border-r border-white/10 shrink-0 select-none">
            {prefix}
          </span>
        )}
        {Icon && !prefix && (
          <span className="flex items-center pl-3 text-white/30">
            <Icon className="w-4 h-4" />
          </span>
        )}
        <input
          id={id}
          type={isPassword ? (show ? "text" : "password") : type}
          required={required}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-3 py-3 text-white placeholder-white/25 text-sm outline-none min-w-0"
          autoComplete={isPassword ? "new-password" : undefined}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)} className="px-3 text-white/30 hover:text-white/60 transition-colors">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const validateWhatsApp = (num: string) => {
    const cleaned = num.replace(/[\s\-\(\)]/g, "");
    return /^\+?[0-9]{7,15}$/.test(cleaned);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double-submit
    if (submittingRef.current || loading) return;

    if (!whatsapp.trim()) {
      toast({ title: "WhatsApp required", description: "Please enter your WhatsApp number.", variant: "destructive" });
      return;
    }
    if (!validateWhatsApp(whatsapp)) {
      toast({ title: "Invalid WhatsApp number", description: "Enter a valid phone number (e.g. +2348012345678)", variant: "destructive" });
      return;
    }

    const cleanUsername = username.replace(/^S²十/i, "").trim();
    if (!cleanUsername) {
      toast({ title: "Username required", description: "Enter your CODM username.", variant: "destructive" });
      return;
    }

    if (password.length < 8) {
      toast({ title: "Password too short", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }

    submittingRef.current = true;
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          codmUsername: cleanUsername,
          whatsappNumber: whatsapp.trim(),
        }),
      });

      const data = await res.json() as { error?: string; message?: string };

      if (!res.ok) {
        const errMsg = data.error ?? "Sign up failed. Please try again.";
        console.error("Signup error:", errMsg);
        toast({ title: "Sign up failed", description: errMsg, variant: "destructive" });
        return;
      }

      // Signup succeeded — now sign in so they get a session and land on /pending
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) {
        // Still show success — they just can't auto-login yet
        toast({ title: "Application submitted!", description: "Management will review your application soon." });
        setLocation("/auth");
        return;
      }

      toast({ title: "Application submitted!", description: "Management will review your request soon." });
      setLocation("/pending");
    } catch (err) {
      console.error("Network error during signup:", err);
      toast({ title: "Network error", description: "Could not connect to the server. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      const lower = error.message.toLowerCase();
      let friendly = error.message;
      if (lower.includes("invalid") || lower.includes("credentials") || lower.includes("wrong")) {
        friendly = "Incorrect email or password.";
      } else if (lower.includes("email") && lower.includes("confirm")) {
        friendly = "Please verify your email before logging in.";
      } else if (lower.includes("rate") || lower.includes("limit")) {
        friendly = "Too many attempts. Please wait a few minutes and try again.";
      } else if (lower.includes("network") || lower.includes("fetch")) {
        friendly = "Network error. Check your connection and try again.";
      }
      toast({ title: "Login failed", description: friendly, variant: "destructive" });
      setLoading(false);
      return;
    }
    try {
      const token = data.session?.access_token;
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const member = await res.json() as { status?: string };
      if (member?.status === "active") {
        setLocation("/dashboard");
      } else if (member?.status === "rejected") {
        setLocation("/rejected");
      } else {
        setLocation("/pending");
      }
    } catch {
      setLocation("/pending");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#060608] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center opacity-[0.06]" style={{ backgroundImage: "url('/clan-logo.jpg')" }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.08)_0%,transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#000_90%)]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-5">
            <div className="absolute inset-0 rounded-2xl bg-red-600/20 blur-xl scale-110" />
            <img src="/clan-logo.jpg" alt="SOLOS+" className="relative w-20 h-20 rounded-2xl object-cover border border-red-500/30 shadow-[0_0_40px_rgba(220,38,38,0.3)]" />
          </div>
          <h1 className="text-2xl font-black tracking-widest text-white">SOLOS+ ESPORTZ</h1>
          <p className="text-white/35 text-sm mt-1">
            {tab === "login" ? "Welcome back, soldier." : "Submit your clan application."}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-7 backdrop-blur-sm">
          {/* Tabs */}
          <div className="flex rounded-xl bg-black/40 p-1 mb-7 border border-white/8">
            {(["login", "register"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  tab === t ? "bg-red-600 text-white shadow-lg" : "text-white/40 hover:text-white/70"
                }`}
              >
                {t === "login" ? "Login" : "Apply Now"}
              </button>
            ))}
          </div>

          {tab === "login" ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <InputField id="l-email" label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={Mail} />
              <InputField id="l-password" label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" icon={Lock} />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2"
              >
                {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Authenticating...</> : "Login"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* CODM Username */}
              <div className="space-y-1.5">
                <label htmlFor="r-username" className="block text-xs font-bold text-white/60 uppercase tracking-widest">
                  CODM Username <span className="text-red-400">*</span>
                </label>
                <div className="flex rounded-xl overflow-hidden border border-white/10 focus-within:border-red-500/50 transition-colors bg-white/4">
                  <span className="flex items-center px-3 bg-red-500/15 text-red-400 text-sm font-bold border-r border-white/10 shrink-0 select-none whitespace-nowrap">
                    S²十
                  </span>
                  <input
                    id="r-username"
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="YourUsername"
                    className="flex-1 bg-transparent px-3 py-3 text-white placeholder-white/25 text-sm outline-none"
                  />
                </div>
                <p className="text-[11px] text-white/30">Clan tag S²十 is added automatically.</p>
              </div>

              {/* WhatsApp */}
              <div className="space-y-1.5">
                <label htmlFor="r-whatsapp" className="block text-xs font-bold text-white/60 uppercase tracking-widest">
                  WhatsApp Number <span className="text-red-400">*</span>
                </label>
                <div className="flex rounded-xl overflow-hidden border border-white/10 focus-within:border-red-500/50 transition-colors bg-white/4">
                  <span className="flex items-center pl-3 text-white/30"><Phone className="w-4 h-4" /></span>
                  <input
                    id="r-whatsapp"
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    placeholder="+2348012345678"
                    className="flex-1 bg-transparent px-3 py-3 text-white placeholder-white/25 text-sm outline-none"
                  />
                </div>
                <p className="text-[11px] text-white/30">Used for clan communication. Include country code.</p>
              </div>

              <InputField id="r-email" label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={Mail} />
              <InputField id="r-password" label="Password" type="password" value={password} onChange={setPassword} placeholder="Min. 8 characters" icon={Lock} />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2"
              >
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting Application...</>
                  : "Submit Application"
                }
              </button>

              <p className="text-[11px] text-white/30 text-center leading-relaxed">
                By applying, you agree to follow SOLOS+ ESPORTZ clan rules and represent the clan with honour.
              </p>
            </form>
          )}
        </div>

        {/* Back link */}
        <div className="text-center mt-5">
          <a href="/" className="text-white/25 hover:text-white/50 text-xs transition-colors">← Back to home</a>
        </div>
      </div>
    </div>
  );
}
