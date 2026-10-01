import { useEffect, useMemo, useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import {
  Activity, AlertTriangle, BarChart3, Bell, Cpu, Factory, Gauge, GaugeCircle,
  HeartPulse, Layers3, Network, Radar, RefreshCw, ShieldCheck, Sparkles, Target,
  Thermometer, Zap, ChevronRight, CircleDot, Bot, Waves, ArrowUpRight,
  Orbit, Flame, Radio, BrainCircuit, Atom, Eye, Droplets, CircuitBoard,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, RadarChart,
  Radar as RadarPlot, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api, getEquipment, getOverview, getAlerts, getStatus, getTelemetry } from "./api";

type Eq = {
  equipment_id: string; name: string; type: string; location: string;
  health_score: number; status: string; risk_level: string; device_id: string;
  last_seen: string; manufacturer?: string; model?: string;
  production_line?: string; department?: string;
};
type AlertItem = {
  id: number; equipment_id: string; severity: string; sensor: string;
  description: string; recommended_action: string; acknowledged: boolean;
  resolved: boolean; timestamp: string;
};
type Telemetry = {
  timestamp: string; temperature: number; vibration: number; current: number;
  voltage: number; pressure: number; rpm: number;
};

const COLORS = ["#55f6c7", "#6cdcff", "#a97bff", "#ff6ea8", "#ffd166", "#ff8d5e"];

function usePolling<T>(loader: () => Promise<T>, initial: T, ms = 4000) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    let live = true;
    const run = async () => { try { const next = await loader(); if (live) setValue(next); } catch {} };
    run(); const id = setInterval(run, ms);
    return () => { live = false; clearInterval(id); };
  }, [ms]);
  return value;
}

function LiquidLayer({ intensity = "normal" }: { intensity?: "normal" | "hot" | "critical" }) {
  return <div className={`liquid-layer ${intensity}`} aria-hidden>
    {Array.from({length: 10}, (_, i) => <span key={i} className={`liquid-bubble b${i+1}`} />)}
    <div className="liquid-noise" />
  </div>;
}

function CountGlow({ value }: { value: string | number }) {
  return <span className="count-glow">{value}</span>;
}

function LiveBus() {
  return <div className="live-bus"><span className="pulse-dot"/><b>LIVE</b><span>PHYSICAL FABRIC</span><i/><span className="mono">WS / 8000</span></div>;
}

function Layout({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const nav = [
    ["/", "Overview", Gauge, "01"], ["/equipment", "Equipment", Factory, "02"],
    ["/alerts", "Alert Matrix", AlertTriangle, "03"], ["/analytics", "Analytics", BarChart3, "04"],
  ] as const;
  const label = loc.pathname === "/" ? "Command Overview" : loc.pathname.split("/").filter(Boolean).slice(-1)[0]?.replaceAll("-", " ") || "Overview";
  return <div className="v6-shell">
    <div className="backdrop-orb orb-cyan"/><div className="backdrop-orb orb-violet"/><div className="backdrop-orb orb-pink"/>
    <div className="global-grid"/><div className="global-scan"/><div className="global-particles"/>
    <aside className="v6-rail">
      <div className="brand-lockup"><div className="brand-core"><Orbit size={20}/><span/></div><div><b>INDUSENSE</b><small>PHYSICAL AI</small></div></div>
      <div className="rail-status"><span/><b>EDGE FABRIC</b><small>online / encrypted</small></div>
      <div className="rail-nav">{nav.map(([p, l, Icon, num]) => <Link key={p} to={p} className={loc.pathname === p ? "active" : ""}><span className="nav-num">{num}</span><Icon size={17}/><b>{l}</b><i/></Link>)}</div>
      <div className="rail-core"><div className="mini-reactor"><span/><span/><span/><span/></div><div><b>COGNITION</b><small>Isolation Forest</small><em>98.4% confidence</em></div></div>
      <div className="rail-footer"><span>NODE 07</span><span className="dotline"/><span>SECURE</span></div>
    </aside>
    <main className="v6-workspace">
      <header className="v6-topbar"><div className="crumb"><span>INDUSTRIAL INTELLIGENCE</span><i>/</i><b>{label.toUpperCase()}</b></div><div className="top-right"><LiveBus/><div className="ai-chip"><BrainCircuit size={14}/><span>AI CORE</span><b>ACTIVE</b></div><div className="avatar-orbit"><Bot size={14}/></div></div></header>
      {children}
    </main>
  </div>;
}

function MetricCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string|number; sub: string; color: string }) {
  return <div className={`v6-metric ${color}`}><LiquidLayer/><div className="metric-icon"><Icon size={17}/></div><div className="metric-label">{label}</div><div className="metric-value"><CountGlow value={value}/></div><div className="metric-sub"><span className="metric-pulse"/>{sub}</div><div className="metric-arc"/></div>;
}

function PulseMeter({ score }: { score: number }) {
  const pts = "0,52 16,50 28,54 41,36 53,48 66,44 80,18 92,38 106,34 118,47 132,28 146,44 160,22 174,40 188,34 202,48 218,40 236,45 252,17 270,43 286,28 304,46";
  return <div className="pulse-meter"><svg viewBox="0 0 304 70" preserveAspectRatio="none"><defs><linearGradient id="pulseGrad" x1="0" x2="1"><stop stopColor="#55f6c7"/><stop offset=".5" stopColor="#6cdcff"/><stop offset="1" stopColor="#a97bff"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="2.6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path className="pulse-grid" d="M0 14 H304 M0 35 H304 M0 56 H304"/><polyline points={pts} fill="none" stroke="#55f6c7" strokeOpacity=".15" strokeWidth="6"/><polyline className="pulse-trace" points={pts} fill="none" stroke="url(#pulseGrad)" strokeWidth="2.6" filter="url(#glow)"/></svg><div className="pulse-read"><span>LIVE HEALTH PULSE</span><b>{score.toFixed(1)}</b><small>/100</small></div></div>;
}

function Donut({ values }: { values: {name:string,value:number}[] }) {
  const total = values.reduce((a,b)=>a+b.value,0) || 1;
  const gradient = values.reduce((acc,v,i)=> { const start = acc.total; const end = start + (v.value/total)*100; acc.total = end; acc.parts.push(`${COLORS[i]} ${start}% ${end}%`); return acc; }, {total:0,parts:[] as string[]}).parts.join(",");
  return <div className="liquid-donut"><div className="donut-ring" style={{background:`conic-gradient(${gradient})`}}/><div className="donut-hole"><strong>{total}</strong><span>ASSETS</span><i/></div><div className="donut-orbit o1"/><div className="donut-orbit o2"/></div>;
}

function NeuralCore({ health, anomaly }: { health:number; anomaly:boolean }) {
  return <div className={`neural-core ${anomaly ? "hot" : ""}`}>
    <div className="core-aura"/><div className="core-ripple r1"/><div className="core-ripple r2"/><div className="core-ripple r3"/>
    <div className="core-orbit orbit-a"><span/><span/><span/></div><div className="core-orbit orbit-b"><span/><span/><span/></div>
    <div className="core-sphere"><div className="sphere-liquid"/><div className="sphere-grid"/><div className="sphere-center"><Sparkles size={20}/><b>{health.toFixed(1)}</b><small>HEALTH INDEX</small></div></div>
    <div className="core-caption"><span>COGNITION FIELD</span><b>{anomaly ? "ANOMALY ACTIVE" : "PATTERN NOMINAL"}</b></div>
  </div>;
}

function MiniBar({ value, color }: { value:number; color:string }) { return <div className="mini-bar"><span style={{width:`${Math.max(3,Math.min(100,value))}%`,background:color}}/></div>; }

function Sparkline({ data, color = "#55f6c7" }: { data: number[]; color?: string }) {
  const width = 120, height = 34, pad = 3; const min = Math.min(...data), max = Math.max(...data), range = max-min||1;
  const points = data.map((v,i)=>`${pad+(i*(width-pad*2))/Math.max(data.length-1,1)},${height-pad-((v-min)/range)*(height-pad*2)}`).join(" ");
  return <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"><polyline points={points} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/><polyline className="spark-ghost" points={points} fill="none" stroke={color} strokeOpacity=".16" strokeWidth="6"/></svg>;
}

function Dashboard() {
  const overview = usePolling(getOverview, {} as any, 3500) as any;
  const eq = usePolling(getEquipment, [] as Eq[], 3500) as Eq[];
  const status = usePolling(getStatus, {} as any, 6000) as any;
  const alerts = usePolling(getAlerts, [] as AlertItem[], 3500) as AlertItem[];
  const [focus, setFocus] = useState("CNC-042");
  const [telemetry, setTelemetry] = useState<Telemetry[]>([]);
  useEffect(()=>{ const load=async()=>{try{setTelemetry(await getTelemetry(focus));}catch{}};load();const i=setInterval(load,3500);return()=>clearInterval(i)},[focus]);
  const active = eq.find(e=>e.equipment_id===focus)||eq[0]; const last = telemetry.at(-1);
  const t = telemetry.slice(-40).map((x,i)=>({...x,index:i,time:new Date(x.timestamp).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}));
  const pie = [{name:"Stable",value:eq.filter(e=>e.health_score>=90).length},{name:"Watch",value:eq.filter(e=>e.health_score>=60&&e.health_score<90).length},{name:"Critical",value:eq.filter(e=>e.health_score<60).length}].filter(x=>x.value>0);
  const radar = active ? [
    {metric:"TEMP",value:last?Math.max(4,100-Math.min(90,last.temperature)):82},{metric:"VIB",value:last?Math.max(4,100-Math.min(90,last.vibration*5)):82},
    {metric:"CURR",value:last?Math.max(4,100-Math.min(90,Math.abs(last.current-10)*7)):86},{metric:"VOLT",value:last?Math.max(4,100-Math.min(90,Math.abs(last.voltage-230)*.45)):88},
    {metric:"RPM",value:last?Math.max(4,100-Math.min(90,Math.abs(last.rpm-1500)*.06)):84},{metric:"PRESS",value:last?Math.max(4,100-Math.min(90,Math.abs(last.pressure-5)*12)):88},
  ]:[];
  return <>
    <section className="hero-v6">
      <LiquidLayer intensity={active?.status === "CRITICAL" ? "critical" : active?.status === "ATTENTION" ? "hot" : "normal"}/>
      <div className="hero-copy"><span className="hero-eyebrow"><span/>PHYSICAL AI / LIVE PLANT DIGITAL TWIN</span><h1>THE MACHINE <em>IS ALIVE.</em></h1><p>Every pulse, vibration, thermal shift and AI inference moves through one animated operational surface.</p><div className="hero-tags"><span><Radio size={12}/> DATA STREAMING</span><span><Atom size={12}/> AI INFERENCE</span><span><CircuitBoard size={12}/> EDGE SYNC</span></div></div>
      <div className="hero-core"><NeuralCore health={active?.health_score || 0} anomaly={active?.status === "CRITICAL" || active?.status === "ATTENTION"}/></div>
      <div className="hero-ribbon"><span>AI CONFIDENCE <b>98.4%</b></span><span>LATENCY <b>38ms</b></span><span>EDGE NODES <b>{overview.online_devices ?? 0}</b></span></div>
    </section>

    <section className="v6-metrics">
      <MetricCard icon={Factory} label="FLEET" value={overview.total_equipment ?? "—"} sub={`${overview.online_devices ?? 0} nodes online`} color="cyan"/>
      <MetricCard icon={HeartPulse} label="MEAN HEALTH" value={overview.average_health ? `${overview.average_health}` : "—"} sub="weighted fleet index" color="green"/>
      <MetricCard icon={Flame} label="ALERT PRESSURE" value={overview.active_alerts ?? 0} sub="live open incidents" color="pink"/>
      <MetricCard icon={BrainCircuit} label="AI ANOMALIES" value={overview.anomalies ?? 0} sub={`${status.ai || "pattern engine"}`} color="violet"/>
    </section>

    <section className="layout-v6 top-zone">
      <div className="glass-panel panel-pulse">
        <div className="panel-title"><div><span>BIOMIMETIC SIGNAL</span><h2>HEALTH PULSE</h2></div><div className="panel-live"><i/> STREAMING</div></div>
        <PulseMeter score={active?.health_score || overview.average_health || 0}/>
        <div className="pulse-stats"><div><span>TEMPERATURE</span><b>{last?last.temperature.toFixed(1):"—"}<small>°C</small></b><MiniBar value={last?Math.min(100,last.temperature):0} color="#55f6c7"/></div><div><span>VIBRATION</span><b>{last?last.vibration.toFixed(1):"—"}<small>mm/s</small></b><MiniBar value={last?Math.min(100,last.vibration*8):0} color="#ff8d5e"/></div><div><span>CURRENT</span><b>{last?last.current.toFixed(1):"—"}<small>A</small></b><MiniBar value={last?Math.min(100,last.current*5):0} color="#6cdcff"/></div><div><span>RPM</span><b>{last?Math.round(last.rpm):"—"}<small>rpm</small></b><MiniBar value={last?Math.min(100,last.rpm/18):0} color="#a97bff"/></div></div>
      </div>
      <div className="glass-panel panel-liquid">
        <div className="panel-title"><div><span>LIQUID INTELLIGENCE</span><h2>HEALTH FIELD</h2></div><Droplets size={17}/></div>
        <div className="liquid-orbit-stage"><div className="liquid-core"><span/><span/><span/><b>{Math.round(active?.health_score||0)}</b><small>INDEX</small></div><div className="liquid-orbit lo1"/><div className="liquid-orbit lo2"/><div className="liquid-orbit lo3"/><div className="field-dot d1"/><div className="field-dot d2"/><div className="field-dot d3"/></div>
        <div className="field-footer"><span><i className="good-dot"/> STABLE</span><span><i className="warn-dot"/> WATCH</span><span><i className="bad-dot"/> CRITICAL</span></div>
      </div>
    </section>

    <section className="layout-v6 mid-zone">
      <div className="glass-panel waveform-panel"><div className="panel-title"><div><span>NEURAL TELEMETRY</span><h2>LIVE SIGNAL OCEAN</h2></div><div className="select-neon"><CircleDot size={12}/><select value={active?.equipment_id||focus} onChange={e=>setFocus(e.target.value)}>{eq.map(e=><option key={e.equipment_id}>{e.equipment_id}</option>)}</select></div></div><div className="chart-glow"><ResponsiveContainer width="100%" height={300}><AreaChart data={t}><defs><linearGradient id="v6temp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#55f6c7" stopOpacity=".5"/><stop offset="100%" stopColor="#55f6c7" stopOpacity="0"/></linearGradient><linearGradient id="v6vib" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff4f9a" stopOpacity=".28"/><stop offset="100%" stopColor="#ff4f9a" stopOpacity="0"/></linearGradient></defs><CartesianGrid stroke="rgba(122,170,204,.08)" strokeDasharray="1 9" vertical={false}/><XAxis dataKey="time" tick={{fill:"#628199",fontSize:8}} axisLine={false} tickLine={false}/><YAxis tick={{fill:"#628199",fontSize:8}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:"rgba(7,13,25,.92)",border:"1px solid rgba(108,220,255,.24)",borderRadius:12,color:"white"}}/><Area type="monotone" dataKey="temperature" stroke="#55f6c7" fill="url(#v6temp)" strokeWidth={2.7} isAnimationActive animationDuration={1200}/><Area type="monotone" dataKey="vibration" stroke="#ff5fa7" fill="url(#v6vib)" strokeWidth={2} isAnimationActive animationDuration={1500}/><Line type="monotone" dataKey="current" stroke="#6cdcff" strokeWidth={2.3} dot={false} isAnimationActive animationDuration={1700}/></AreaChart></ResponsiveContainer></div><div className="chart-footer"><span><i style={{background:"#55f6c7"}}/> temperature</span><span><i style={{background:"#ff5fa7"}}/> vibration</span><span><i style={{background:"#6cdcff"}}/> current</span><b>ROLLING 40 SAMPLES</b></div></div>
      <div className="glass-panel pie-neon"><div className="panel-title"><div><span>FLEET COMPOSITION</span><h2>HEALTH DNA</h2></div><Target size={16}/></div><Donut values={pie}/><div className="dna-list">{(pie.length?pie:[{name:"No data",value:0}]).map((p,i)=><div key={p.name}><span><i style={{background:COLORS[i]}}/>{p.name}</span><b>{p.value}</b></div>)}</div></div>
    </section>

    <section className="layout-v6 lower-zone">
      <div className="glass-panel radar-neon"><div className="panel-title"><div><span>MULTIVARIATE POSTURE</span><h2>SENSOR CONSTELLATION</h2></div><Network size={16}/></div><div className="radar-stage"><div className="radar-scan"/><div className="radar-circle rc1"/><div className="radar-circle rc2"/><div className="radar-circle rc3"/><div className="radar-cross h"/><div className="radar-cross v"/><div className="radar-sweep-beam"/><div className="radar-core-dot"/>{eq.map((e,i)=><button className={`constellation-node cn${i}`} key={e.equipment_id} onClick={()=>setFocus(e.equipment_id)}><span/><b>{e.equipment_id}</b></button>)}</div><div className="radar-footer"><span><i className="good-dot"/> nominal</span><span><i className="warn-dot"/> attention</span><span><i className="bad-dot"/> critical</span></div></div>
      <div className="glass-panel radar-graph"><div className="panel-title"><div><span>MODEL INTERPRETABILITY</span><h2>RISK RADAR</h2></div><BrainCircuit size={16}/></div><ResponsiveContainer width="100%" height={260}><RadarChart data={radar}><PolarGrid stroke="rgba(122,170,204,.12)"/><PolarAngleAxis dataKey="metric" tick={{fill:"#8aa3b8",fontSize:9}}/><PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false}/><RadarPlot dataKey="value" stroke="#a97bff" fill="#a97bff" fillOpacity={.2} isAnimationActive animationDuration={1600}/><RadarPlot dataKey="value" stroke="#6cdcff" fill="none" isAnimationActive animationDuration={1800}/></RadarChart></ResponsiveContainer><div className="radar-score"><span>MODEL STABILITY</span><b>96.8%</b><MiniBar value={96.8} color="#a97bff"/></div></div>
      <div className="glass-panel incidents"><div className="panel-title"><div><span>REAL-TIME EVENT STREAM</span><h2>INCIDENT PULSE</h2></div><Bell size={16}/></div><div className="event-stream">{alerts.slice(0,7).map(a=><div className={`event-row ${a.severity.toLowerCase()}`} key={a.id}><div className="event-pulse"><i/><i/><i/></div><div className="event-main"><b>{a.equipment_id} · {a.sensor}</b><p>{a.description}</p></div><time>{new Date(a.timestamp).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</time><ArrowUpRight size={14}/></div>)}{!alerts.length&&<div className="empty">No incidents in stream.</div>}</div></div>
    </section>

    <section className="glass-panel fleet-strip"><div className="panel-title"><div><span>PHYSICAL ASSET FIELD</span><h2>LIVE MACHINE CAPSULES</h2></div><Link to="/equipment" className="text-link">OPEN MATRIX <ChevronRight size={12}/></Link></div><div className="capsule-grid">{eq.map((e,i)=><Link key={e.equipment_id} to={`/equipment/${e.equipment_id}`} className="machine-capsule" onMouseEnter={()=>setFocus(e.equipment_id)}><div className="capsule-head"><span>0{i+1}</span><i className={`capsule-state ${e.status.toLowerCase()}`}/></div><b>{e.equipment_id}</b><small>{e.name}</small><div className="capsule-score"><strong>{e.health_score.toFixed(0)}</strong><Sparkline data={[e.health_score-7,e.health_score-1,e.health_score+3,e.health_score-4,e.health_score]} color={e.status === "CRITICAL"?"#ff567a":e.status === "ATTENTION"?"#ff9f5b":"#55f6c7"}/></div><div className="capsule-bar"><i style={{width:`${Math.max(4,e.health_score)}%`}}/></div><span className="capsule-foot">{e.status} <ChevronRight size={11}/></span></Link>)}</div></section>
  </>;
}

function EquipmentPage(){ const eq=usePolling(getEquipment,[] as Eq[],5000) as Eq[]; return <section className="glass-panel full-panel"><div className="panel-title"><div><span>PHYSICAL ASSET FIELD</span><h2>EQUIPMENT MATRIX</h2></div></div><div className="matrix-grid">{eq.map(e=><Link key={e.equipment_id} to={`/equipment/${e.equipment_id}`} className="matrix-card"><div className="matrix-top"><span>{e.equipment_id}</span><i className={`capsule-state ${e.status.toLowerCase()}`}/></div><b>{e.name}</b><small>{e.type} · {e.location}</small><div className="matrix-score"><strong>{e.health_score.toFixed(0)}</strong><span>/100</span></div><div className="matrix-progress"><i style={{width:`${e.health_score}%`}}/></div><div className="matrix-meta"><span>{e.risk_level}</span><span>{e.status}</span></div></Link>)}</div></section>; }

function Detail({id}:{id:string}){ const [e,setE]=useState<Eq|null>(null); const [t,setT]=useState<Telemetry[]>([]); const load=async()=>{try{setE((await api.get(`/api/equipment/${id}`)).data);setT(await getTelemetry(id))}catch{}}; useEffect(()=>{load();const i=setInterval(load,3000);return()=>clearInterval(i)},[id]); if(!e)return <div className="full-loader"><div className="loader-reactor"><span/><span/><span/></div><b>SYNCING MACHINE CORTEX…</b></div>; const latest=t.at(-1); const series=t.slice(-45).map((x,i)=>({...x,time:new Date(x.timestamp).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}),x:i})); return <><section className="detail-hero glass-panel"><LiquidLayer intensity={e.status === "CRITICAL"?"critical":e.status === "ATTENTION"?"hot":"normal"}/><div><span className="hero-eyebrow"><span/>ASSET TELEMETRY / {e.equipment_id}</span><h1>{e.name}</h1><p>{e.type} · {e.location} · {e.production_line||"Production"}</p><div className="detail-pills"><span>{e.status}</span><span>{e.risk_level}</span><span>AI LINKED</span></div></div><div className="detail-big-score"><div className="score-orb"><span/><b>{e.health_score.toFixed(1)}</b><small>HEALTH</small></div></div></section><section className="sensor-ribbon">{[[Thermometer,"Temperature",latest?.temperature,"°C","green"],[Activity,"Vibration",latest?.vibration,"mm/s","orange"],[Zap,"Current",latest?.current,"A","blue"],[GaugeCircle,"Pressure",latest?.pressure,"bar","violet"],[Gauge,"RPM",latest?.rpm,"rpm","gold"],[ShieldCheck,"Health",e.health_score,"/100","green"]].map(([I,l,v,u,c]:any)=><div className={`sensor-card ${c}`} key={l}><I size={17}/><span>{l}</span><b>{typeof v==="number"?v.toFixed(1):"—"}<small>{u}</small></b></div>)}</section><section className="detail-charts-v6"><div className="glass-panel"><div className="panel-title"><div><span>MACHINE WAVEFORM</span><h2>THERMAL / MOTION</h2></div><Waves size={16}/></div><ResponsiveContainer width="100%" height={330}><LineChart data={series}><CartesianGrid stroke="rgba(122,170,204,.1)" strokeDasharray="1 8" vertical={false}/><XAxis dataKey="time" tick={{fill:"#628199",fontSize:8}} axisLine={false} tickLine={false}/><YAxis tick={{fill:"#628199",fontSize:8}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:"rgba(7,13,25,.94)",border:"1px solid rgba(108,220,255,.24)",borderRadius:12}}/><Line type="monotone" dataKey="temperature" stroke="#55f6c7" strokeWidth={2.8} dot={false} isAnimationActive animationDuration={1200}/><Line type="monotone" dataKey="vibration" stroke="#ff6fa8" strokeWidth={2.2} dot={false} isAnimationActive animationDuration={1400}/></LineChart></ResponsiveContainer></div><div className="glass-panel"><div className="panel-title"><div><span>RECOVERY FIELD</span><h2>HEALTH DRIFT</h2></div><HeartPulse size={16}/></div><PulseMeter score={e.health_score}/><div className="detail-note"><span>AI INTERPRETATION</span><p>{e.status === "CRITICAL" ? "Multiple sensor excursions detected. Machine operating in degraded condition." : e.status === "ATTENTION" ? "Sensor pattern is drifting from nominal envelope. Monitor vibration and thermal load." : "Sensor topology remains within nominal operating envelope."}</p></div></div></section></> }
function AlertsPage(){const [alerts,setAlerts]=useState<AlertItem[]>([]);const load=()=>getAlerts().then(setAlerts).catch(()=>{});useEffect(()=>{load();const i=setInterval(load,3500);return()=>clearInterval(i)},[]);const act=async(id:number,a:string)=>{await api.post(`/api/alerts/${id}/${a}`);load()};return <section className="glass-panel full-panel"><div className="panel-title"><div><span>EVENT CONTROL</span><h2>INCIDENT PULSE</h2></div><span className="open-count">{alerts.filter(a=>!a.resolved).length} OPEN</span></div><div className="event-stream">{alerts.map(a=><div className={`event-row ${a.severity.toLowerCase()}`} key={a.id}><div className="event-pulse"><i/><i/><i/></div><div className="event-main"><b>{a.equipment_id} · {a.sensor}</b><p>{a.description}</p><small>{a.recommended_action}</small></div><time>{new Date(a.timestamp).toLocaleTimeString()}</time><div className="event-actions">{!a.acknowledged&&<button onClick={()=>act(a.id,"acknowledge")}>ACK</button>}{!a.resolved&&<button onClick={()=>act(a.id,"resolve")}>RESOLVE</button>}</div></div>)}{!alerts.length&&<div className="empty">No live incidents.</div>}</div></section>}
function AnalyticsPage(){const overview=usePolling(getOverview,{} as any,5000) as any;const eq=usePolling(getEquipment,[] as Eq[],5000) as Eq[];const alerts=usePolling(getAlerts,[] as AlertItem[],5000) as AlertItem[];const bars=["M","T","W","T","F","S","S"].map((d,i)=>({d,health:74+i*2+(i%2?3:0),alerts:8-i%3,anomaly:3+i%2}));return <section className="analytics-shell"><div className="v6-metrics"><MetricCard icon={Gauge} label="MEAN HEALTH" value={overview.average_health??"—"} sub="fleet weighted index" color="green"/><MetricCard icon={AlertTriangle} label="INCIDENT DENSITY" value={overview.active_alerts??0} sub="open events" color="pink"/><MetricCard icon={Activity} label="ANOMALY FIELD" value={overview.anomalies??0} sub="model deviations" color="violet"/><MetricCard icon={Cpu} label="EDGE NODES" value={eq.length} sub={`${overview.online_devices??0} online`} color="cyan"/></div><div className="analysis-grid"><div className="glass-panel"><div className="panel-title"><div><span>FLEET TREND ENGINE</span><h2>HEALTH VELOCITY</h2></div><BarChart3 size={16}/></div><ResponsiveContainer width="100%" height={300}><BarChart data={bars}><CartesianGrid stroke="rgba(122,170,204,.08)" strokeDasharray="1 8" vertical={false}/><XAxis dataKey="d" tick={{fill:"#628199",fontSize:8}} axisLine={false} tickLine={false}/><YAxis tick={{fill:"#628199",fontSize:8}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:"rgba(7,13,25,.94)",border:"1px solid rgba(108,220,255,.22)",borderRadius:12}}/><Bar dataKey="health" fill="#55f6c7" radius={[8,8,1,1]} isAnimationActive animationDuration={1500}/><Bar dataKey="anomaly" fill="#a97bff" radius={[8,8,1,1]} isAnimationActive animationDuration={1700}/></BarChart></ResponsiveContainer></div><div className="glass-panel"><div className="panel-title"><div><span>EVENT COMPOSITION</span><h2>ALERT DNA</h2></div><Target size={16}/></div><Donut values={[{name:"AI",value:alerts.filter(a=>a.sensor.toLowerCase()==="ai").length||1},{name:"Vibration",value:alerts.filter(a=>a.sensor.toLowerCase().includes("vibration")).length||1},{name:"Thermal",value:alerts.filter(a=>a.sensor.toLowerCase().includes("temperature")).length||1},{name:"Current",value:alerts.filter(a=>a.sensor.toLowerCase().includes("current")).length||1}]}/></div></div></section>}
function Login(){return <div className="v6-login"><div className="login-field"><LiquidLayer/><div className="login-core"><div className="login-sphere"><span/><span/><span/><b><Orbit size={28}/></b></div><span className="hero-eyebrow"><span/>PHYSICAL AI CONTROL SYSTEM</span><h1>INDUSENSE <em>MOTION</em></h1><p>Industrial equipment intelligence rendered as a living operational surface.</p><Link to="/" className="primary-login">ENTER COMMAND FIELD <ArrowUpRight size={16}/></Link><small>LOCAL DEMO / AI ONLINE / EDGE FABRIC READY</small></div></div></div>}
function DetailRoute(){const loc=useLocation();return <Detail id={loc.pathname.split("/").pop()||""} />}
function App(){return <Routes><Route path="/login" element={<Login/>}/><Route path="*" element={<Layout><Routes><Route path="/" element={<Dashboard/>}/><Route path="/equipment" element={<EquipmentPage/>}/><Route path="/equipment/:id" element={<DetailRoute/>}/><Route path="/alerts" element={<AlertsPage/>}/><Route path="/analytics" element={<AnalyticsPage/>}/></Routes></Layout>}/></Routes>}
export default App;
