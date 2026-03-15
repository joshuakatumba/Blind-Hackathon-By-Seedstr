import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Cpu, 
  DollarSign, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  Zap,
  Terminal,
  Clock,
  ExternalLink,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LogEntry {
  id: string;
  time: string;
  type: string;
  message: string;
  color?: string;
}

interface Stats {
  jobsProcessed: number;
  jobsSkipped: number;
  errors: number;
  uptime: number;
  activeJobs: number;
  totalTokens: number;
  totalCost: number;
  wsConnected: boolean;
}

interface Config {
  model: string;
  minBudget: number;
  pollInterval: number;
}

interface Profile {
  name: string;
  isVerified: boolean;
}

const StatCard = ({ title, value, icon: Icon, color, subValue }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card flex flex-col gap-2 relative overflow-hidden group"
  >
    <div className={cn("absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 rounded-full transition-all duration-500 group-hover:opacity-20", color)} />
    <div className="flex justify-between items-start">
      <div className="p-2 rounded-lg bg-white/5 border border-white/10">
        <Icon size={20} className={cn("opacity-80", color.replace('bg-', 'text-'))} />
      </div>
      <span className="text-xs text-white/40 font-medium uppercase tracking-wider">{title}</span>
    </div>
    <div className="mt-4">
      <div className="text-3xl font-bold tracking-tight">{value}</div>
      {subValue && <div className="text-xs text-white/40 mt-1">{subValue}</div>}
    </div>
  </motion.div>
);

const LogItem = ({ log }: { log: LogEntry }) => {
  const getColor = () => {
    switch (log.type) {
      case 'info': return 'text-blue-400';
      case 'job': return 'text-cyan-400';
      case 'tool': return 'text-magenta-400';
      case 'error': return 'text-red-400';
      case 'done': return 'text-green-400';
      case 'skip': return 'text-yellow-400';
      default: return 'text-white/70';
    }
  };

  return (
    <div className="flex gap-4 py-2 border-b border-white/5 last:border-0 group">
      <span className="text-xs font-mono text-white/20 whitespace-nowrap pt-1">{log.time}</span>
      <div className="flex flex-col gap-1 w-full">
        <div className="flex items-center gap-2">
          <span className={cn("text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-white/5", getColor().replace('text-', 'bg-').replace('-400', '/10'), getColor())}>
            {log.type}
          </span>
          <span className={cn("text-sm font-medium", getColor())}>
            {log.message}
          </span>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<Stats>({
    jobsProcessed: 0,
    jobsSkipped: 0,
    errors: 0,
    uptime: 0,
    activeJobs: 0,
    totalTokens: 0,
    totalCost: 0,
    wsConnected: false
  });
  const [config, setConfig] = useState<{config: Config, profile: Profile}>({
    config: {
      model: 'Loading...',
      minBudget: 0,
      pollInterval: 0
    },
    profile: {
      name: 'Agent',
      isVerified: false
    }
  });
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch initial config and status
    fetch('http://localhost:3000/api/config')
      .then(res => res.json())
      .then(setConfig)
      .catch(() => {});

    fetch('http://localhost:3000/api/stats')
      .then(res => res.json())
      .then(setStats)
      .catch(() => {});

    // Setup SSE
    const eventSource = new EventSource('http://localhost:3000/api/events');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Update logs
      const time = new Date().toLocaleTimeString('en-US', { hour12: false });
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        time,
        type: data.type.replace('job_', '').replace('response_', '').replace('files_', ''),
        message: data.message || `Event: ${data.type}`,
      };

      // Custom message formatting
      if (data.type === 'job_found') newLog.message = `Found Job: $${data.job.budget}`;
      if (data.type === 'tool_call') newLog.message = `Calling Tool: ${data.tool}`;
      if (data.type === 'response_submitted') newLog.message = `Response Submitted: ${data.responseId.slice(0, 8)}...`;
      if (data.type === 'error') newLog.message = `Error: ${data.message}`;

      setLogs(prev => [...prev.slice(-100), newLog]);

      // Trigger stats refresh (or the server could send them)
      fetch('http://localhost:3000/api/stats')
        .then(res => res.json())
        .then(setStats)
        .catch(() => {});
    };

    return () => eventSource.close();
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const formatUptime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return h > 0 ? `${h}h ${m%60}m` : `${m}m ${s%60}s`;
  };

  return (
    <div className="min-h-screen bg-background text-white p-6 lg:p-10 selection:bg-primary/30">
      {/* Mesh Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-secondary/10 blur-[100px] rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center shadow-lg shadow-primary/20">
                <Zap size={22} className="text-white fill-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gradient">ASTRA</h1>
                <p className="text-xs text-white/40 font-mono tracking-widest uppercase">Autonomous Agent v2.4</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full animate-pulse", stats.wsConnected ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-yellow-500")} />
                <span className="text-sm font-medium text-white/80">{stats.wsConnected ? "WebSocket Connected" : "Polling Active"}</span>
              </div>
              <span className="text-[10px] text-white/30 uppercase tracking-tighter">System Status</span>
            </div>
            <div className="h-8 w-[1px] bg-white/10 mx-2" />
            <div className="flex gap-2">
              <button className="glass px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors border border-white/10 flex items-center gap-2">
                <Activity size={14} />
                Live Control
              </button>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Jobs Processed" 
            value={stats.jobsProcessed} 
            icon={CheckCircle2} 
            color="bg-cyan-500" 
            subValue={`${stats.jobsSkipped} skipped • ${stats.errors} errors`}
          />
          <StatCard 
            title="Total Cost" 
            value={`$${stats.totalCost.toFixed(3)}`} 
            icon={DollarSign} 
            color="bg-green-500" 
            subValue={`avg $${(stats.totalCost / (stats.jobsProcessed || 1)).toFixed(4)} / job`}
          />
          <StatCard 
            title="Token Usage" 
            value={`${(stats.totalTokens / 1000).toFixed(1)}k`} 
            icon={Layers} 
            color="bg-violet-500" 
            subValue="Across all sessions"
          />
          <StatCard 
            title="System Uptime" 
            value={formatUptime(stats.uptime)} 
            icon={Clock} 
            color="bg-orange-500" 
            subValue={`Active Jobs: ${stats.activeJobs}`}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Log Viewer */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Terminal size={18} className="text-primary" />
                Activity Stream
              </h2>
              <div className="text-[10px] text-white/30 font-mono">LIVE_LOGS_SYNCED</div>
            </div>
            <div className="glass-card h-[500px] flex flex-col p-0 overflow-hidden">
              <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center text-xs font-mono text-white/40">
                <span>ASTRA_SHELL ~ logs/stream</span>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/40" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="space-y-1">
                  {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-white/10 opacity-50 py-20 gap-4">
                      <Search size={48} strokeWidth={1} />
                      <p className="font-mono text-sm">Listening for agent events...</p>
                    </div>
                  ) : (
                    logs.map(log => <LogItem key={log.id} log={log} />)
                  )}
                  <div ref={logEndRef} />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Model Info */}
            <div className="glass-card relative">
              <div className="absolute top-0 right-0 p-3 opacity-20"><Cpu size={40} /></div>
              <h3 className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-4">Intelligence</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-white/40 mb-1">Active Model</div>
                  <div className="font-semibold text-primary">{config.config.model}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-white/40 mb-1">Min Budget</div>
                    <div className="font-semibold">${config.config.minBudget}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/40 mb-1">Poll Rate</div>
                    <div className="font-semibold">{config.config.pollInterval}s</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile */}
            <div className="glass-card">
              <h3 className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-4">Identity</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-white/10 p-1">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-violet-500 to-primary" />
                </div>
                <div>
                  <div className="font-bold">{config.profile.name}</div>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {config.profile.isVerified ? (
                      <>
                        <CheckCircle2 size={12} className="text-blue-400" />
                        <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Verified Agent</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={12} className="text-yellow-400" />
                        <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest">Unverified</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button className="w-full mt-6 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                View Profile <ExternalLink size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
