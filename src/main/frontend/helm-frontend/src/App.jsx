import { useState, useEffect, useRef } from "react";

const MOCK_MODE = true;

function mockScan(filename) {
  const isBad = filename.includes("bad");
  const issues = isBad ? [
    { severity: "HIGH",   rule: "RUN_AS_ROOT",         message: "Container 'app' runs as root (UID 0)",                fix: "Set securityContext.runAsUser to 1000" },
    { severity: "HIGH",   rule: "PRIVILEGED_CONTAINER", message: "Container 'app' is running in privileged mode",      fix: "Remove securityContext.privileged: true" },
    { severity: "HIGH",   rule: "HOST_NETWORK",         message: "Pod uses host network namespace (hostNetwork: true)",fix: "Remove hostNetwork: true" },
    { severity: "MEDIUM", rule: "NO_RESOURCE_LIMITS",   message: "Container 'app' has no CPU/memory limits",          fix: "Add resources.limits.cpu and memory" },
    { severity: "MEDIUM", rule: "NO_LIVENESS_PROBE",    message: "Container 'app' has no livenessProbe defined",      fix: "Add livenessProbe for automatic restarts" },
    { severity: "LOW",    rule: "LATEST_IMAGE_TAG",     message: "Container 'app' uses ':latest' tag",                fix: "Pin to a specific version like nginx:1.25.3" },
  ] : [
    { severity: "LOW", rule: "NO_RESOURCE_REQUESTS", message: "Container 'app' has no resource requests", fix: "Add resources.requests.cpu and memory" },
  ];
  const score = isBad ? 15 : 95;
  const grade = isBad ? "F" : "A";
  return {
    chart_name: filename.replace(/\.(yaml|yml)$/, ""),
    kind: "Deployment",
    summary: {
      score, grade,
      total_issues: issues.length,
      breakdown: {
        HIGH:   issues.filter(i => i.severity === "HIGH").length,
        MEDIUM: issues.filter(i => i.severity === "MEDIUM").length,
        LOW:    issues.filter(i => i.severity === "LOW").length,
      },
    },
    issues,
  };
}

const SEV = {
  HIGH:   { bg: "bg-red-50",   border: "border-red-400",   badge: "bg-red-100 text-red-700",    dot: "bg-red-500"   },
  MEDIUM: { bg: "bg-amber-50", border: "border-amber-400", badge: "bg-amber-100 text-amber-700",dot: "bg-amber-500" },
  LOW:    { bg: "bg-blue-50",  border: "border-blue-400",  badge: "bg-blue-100 text-blue-700",  dot: "bg-blue-500"  },
};
const GRADE_COLOR = { A:"text-emerald-500", B:"text-green-500", C:"text-amber-500", D:"text-orange-500", F:"text-red-500" };
const scoreColor = s => s>=90?"#10b981":s>=75?"#22c55e":s>=60?"#f59e0b":s>=40?"#f97316":"#ef4444";

function ScoreGauge({ score, grade }) {
  const [anim, setAnim] = useState(0);
  const R = 70, sw = 10, nr = R - sw/2, circ = nr * 2 * Math.PI;
  const color = scoreColor(score);
  useEffect(() => { const t = setTimeout(() => setAnim(score), 100); return () => clearTimeout(t); }, [score]);
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg height={R*2} width={R*2}>
          <circle stroke="#e5e7eb" fill="transparent" strokeWidth={sw} r={nr} cx={R} cy={R} />
          <circle stroke={color} fill="transparent" strokeWidth={sw}
            strokeDasharray={`${circ} ${circ}`}
            strokeDashoffset={circ - (anim/100)*circ}
            strokeLinecap="round" r={nr} cx={R} cy={R}
            style={{transition:"stroke-dashoffset 1.2s ease",transform:"rotate(-90deg)",transformOrigin:"50% 50%"}} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black" style={{color}}>{anim}</span>
          <span className="text-xs text-gray-400">/ 100</span>
        </div>
      </div>
      <div className={`text-5xl font-black mt-1 ${GRADE_COLOR[grade]||"text-gray-600"}`}>{grade}</div>
      <div className="text-xs text-gray-400 tracking-widest uppercase mt-0.5">Grade</div>
    </div>
  );
}

function BreakdownBar({ breakdown, total }) {
  return (
    <div className="space-y-2">
      {[["HIGH","bg-red-500"],["MEDIUM","bg-amber-400"],["LOW","bg-blue-400"]].map(([label,color]) => (
        <div key={label} className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-500 w-14">{label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-2">
            <div className={`${color} h-2 rounded-full transition-all duration-700`}
              style={{width: total>0?`${(breakdown[label]/total)*100}%`:"0%"}} />
          </div>
          <span className="text-xs font-bold text-gray-700 w-4 text-right">{breakdown[label]}</span>
        </div>
      ))}
    </div>
  );
}

function IssueCard({ issue }) {
  const [open, setOpen] = useState(false);
  const c = SEV[issue.severity] || SEV.LOW;
  return (
    <div className={`rounded-xl border-l-4 ${c.border} ${c.bg} overflow-hidden`}>
      <button onClick={() => setOpen(!open)} className="w-full text-left px-4 py-3 flex items-start gap-3">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${c.badge} shrink-0 mt-0.5`}>
          <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{issue.severity}
        </span>
        <span className="flex-1 text-sm font-semibold text-gray-800">{issue.message}</span>
        <span className="text-gray-400 text-sm shrink-0">{open?"▲":"▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          <div className="text-xs font-mono bg-white/70 rounded-lg px-3 py-2 border border-white">
            <span className="text-gray-400">Rule: </span>
            <span className="font-bold text-gray-700">{issue.rule}</span>
          </div>
          <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            <span className="text-emerald-500 shrink-0">✓</span>
            <p className="text-xs text-emerald-800 font-medium">{issue.fix}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportView({ result, filename, onReset }) {
  const { summary, issues, chart_name, kind } = result;
  const [filter, setFilter] = useState("ALL");
  const filtered = filter==="ALL" ? issues : issues.filter(i => i.severity===filter);
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-800">{chart_name}</h2>
          <p className="text-sm text-gray-400 font-mono">{filename} · {kind}</p>
        </div>
        <button onClick={onReset}
          className="text-sm px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold transition-all">
          ← New Scan
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-center">
          <ScoreGauge score={summary.score} grade={summary.grade} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Issues Found</h3>
            <div className="text-4xl font-black text-gray-800">{summary.total_issues}</div>
            <div className="text-xs text-gray-400 mt-1">across all severity levels</div>
          </div>
          <BreakdownBar breakdown={summary.breakdown} total={summary.total_issues} />
        </div>
      </div>

      <div className={`rounded-2xl p-4 text-sm font-semibold flex items-center gap-3 ${
        summary.score>=90?"bg-emerald-50 text-emerald-700 border border-emerald-200":
        summary.score>=60?"bg-amber-50 text-amber-700 border border-amber-200":
        "bg-red-50 text-red-700 border border-red-200"}`}>
        <span className="text-2xl">
          {summary.score>=90?"🎉":summary.score>=60?"⚠️":"🚨"}
        </span>
        {summary.score>=90?"Excellent! This chart follows Kubernetes best practices.":
         summary.score>=60?"Fair quality. Address MEDIUM+ issues before production.":
         "Critical issues found. This chart is not production-ready."}
      </div>

      {issues.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Issues</h3>
            <div className="flex gap-1">
              {["ALL","HIGH","MEDIUM","LOW"].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`text-xs px-3 py-1 rounded-full font-bold transition-all ${
                    filter===f?"bg-gray-800 text-white":"bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {filtered.map((issue,i) => <IssueCard key={i} issue={issue} />)}
            {filtered.length===0 &&
              <div className="text-center py-8 text-gray-400 text-sm">No {filter} severity issues</div>}
          </div>
        </div>
      )}

      {issues.length===0 && (
        <div className="text-center py-12 bg-emerald-50 rounded-2xl border border-emerald-100">
          <div className="text-5xl mb-3">✅</div>
          <p className="text-emerald-700 font-bold text-lg">No issues found!</p>
          <p className="text-emerald-500 text-sm mt-1">This chart passes all quality checks.</p>
        </div>
      )}
    </div>
  );
}

function UploadZone({ onScan }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile]         = useState(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef();

  const handleFile = f => {
    if (!f) return;
    if (!f.name.match(/\.(yaml|yml)$/i)) { alert("Only .yaml/.yml files accepted"); return; }
    setFile(f);
  };

  const handleScan = async () => {
    if (!file) return;
    setScanning(true); setProgress(0);
    const iv = setInterval(() => {
      setProgress(p => { if (p>=90) { clearInterval(iv); return p; } return p + Math.random()*15; });
    }, 200);
    await new Promise(r => setTimeout(r, 1800));
    clearInterval(iv); setProgress(100);
    let result;
    if (MOCK_MODE) {
      result = mockScan(file.name);
    } else {
      const form = new FormData();
      form.append("chart", file);
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/scan/upload", {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form
      });
      const { jobId } = await res.json();
      while (true) {
        await new Promise(r => setTimeout(r, 2000));
        const r2 = await fetch(`/api/scan/status/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await r2.json();
        if (data.state==="completed") { result = data.result; break; }
      }
    }
    setScanning(false);
    onScan(result, file.name);
  };

  return (
    <div className="space-y-5">
      <div
        onDragOver={e=>{e.preventDefault();setDragging(true);}}
        onDragLeave={()=>setDragging(false)}
        onDrop={e=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files[0]);}}
        onClick={()=>fileRef.current.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
          dragging?"border-indigo-400 bg-indigo-50 scale-[1.01]":
          file?"border-emerald-400 bg-emerald-50":
          "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/50"}`}>
        <input ref={fileRef} type="file" accept=".yaml,.yml" className="hidden"
          onChange={e=>handleFile(e.target.files[0])} />
        <div className="text-5xl mb-3">{file?"📄":"☁️"}</div>
        {file ? (
          <>
            <p className="font-bold text-emerald-700 text-lg">{file.name}</p>
            <p className="text-sm text-emerald-500 mt-1">{(file.size/1024).toFixed(1)} KB · Ready to scan</p>
          </>
        ) : (
          <>
            <p className="font-bold text-gray-600 text-lg">Drop your Helm chart here</p>
            <p className="text-sm text-gray-400 mt-1">or click to browse · .yaml / .yml</p>
          </>
        )}
      </div>

      {!file && (
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Quick test</p>
          <div className="flex gap-2">
            {["bad-chart.yaml","good-chart.yaml"].map(name => (
              <button key={name}
                onClick={()=>{
                  const f = new File([new Blob(["# mock"],{type:"text/yaml"})], name, {type:"text/yaml"});
                  setFile(f);
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-600 font-mono transition-all">
                {name}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400">Try both to see high/low scoring results</p>
        </div>
      )}

      {file && !scanning && (
        <div className="flex gap-3">
          <button onClick={()=>setFile(null)}
            className="px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-sm transition-all">
            Remove
          </button>
          <button onClick={handleScan}
            className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-200 transition-all active:scale-95">
            🔍 Run Quality Check
          </button>
        </div>
      )}

      {scanning && (
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-gray-500 font-medium">
            <span>Scanning {file.name}…</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-2 bg-indigo-500 rounded-full transition-all duration-300"
              style={{width:`${progress}%`}} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-center">
            {["Parsing YAML","Running checks","Scoring"].map((step,i) => (
              <div key={step}
                className={`py-2 rounded-lg font-medium transition-all ${
                  progress>i*33?"bg-indigo-50 text-indigo-600":"bg-gray-50 text-gray-400"}`}>
                {progress>(i+1)*33?"✓ ":""}{step}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryPanel({ history, onSelect }) {
  if (!history.length) return (
    <div className="text-center py-10 text-gray-300">
      <div className="text-4xl mb-2">📋</div>
      <p className="text-sm">No scans yet</p>
    </div>
  );
  return (
    <div className="space-y-2">
      {history.map((h,i) => (
        <button key={i} onClick={()=>onSelect(h)}
          className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center font-black shrink-0">
            <span className={GRADE_COLOR[h.result.summary.grade]}>{h.result.summary.grade}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-700 truncate">{h.filename}</p>
            <p className="text-xs text-gray-400">
              {h.result.summary.score}/100 · {h.result.summary.total_issues} issues · {h.time}
            </p>
          </div>
          <span className="text-gray-300 group-hover:text-gray-500">→</span>
        </button>
      ))}
    </div>
  );
}

function InfoPanel() {
  const rules = [
    {rule:"RUN_AS_ROOT",          sev:"HIGH",   desc:"Container runs as UID 0"},
    {rule:"PRIVILEGED_CONTAINER", sev:"HIGH",   desc:"privileged: true in securityContext"},
    {rule:"HOST_NETWORK",         sev:"HIGH",   desc:"hostNetwork: true on pod spec"},
    {rule:"NO_RESOURCE_LIMITS",   sev:"MEDIUM", desc:"Missing CPU/memory limits"},
    {rule:"NO_LIVENESS_PROBE",    sev:"MEDIUM", desc:"No livenessProbe defined"},
    {rule:"NO_READINESS_PROBE",   sev:"MEDIUM", desc:"No readinessProbe defined"},
    {rule:"LATEST_IMAGE_TAG",     sev:"LOW",    desc:"Using :latest or untagged image"},
    {rule:"NO_RESOURCE_REQUESTS", sev:"LOW",    desc:"Missing resource requests"},
  ];
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 leading-relaxed">
        Checks Helm chart YAML against Kubernetes security and best practice rules.
        Deductions: <span className="font-bold text-red-500">HIGH −20</span>,{" "}
        <span className="font-bold text-amber-500">MEDIUM −10</span>,{" "}
        <span className="font-bold text-blue-500">LOW −5</span>.
      </p>
      <div className="space-y-1.5">
        {rules.map(r => {
          const c = SEV[r.sev];
          return (
            <div key={r.rule} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${c.bg}`}>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${c.badge}`}>{r.sev}</span>
              <span className="text-xs font-mono text-gray-600">{r.rule}</span>
              <span className="text-xs text-gray-400 hidden sm:block">· {r.desc}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView]       = useState("scan");
  const [result, setResult]   = useState(null);
  const [filename, setFile]   = useState("");
  const [history, setHistory] = useState([]);
  const [authMode, setMode]   = useState("login");
  const [authForm, setForm]   = useState({ email:"", password:"" });
  const [authError, setError] = useState("");
  const [loggedIn, setLogin]  = useState(MOCK_MODE);

  const handleScan = (r, fname) => {
    setResult(r); setFile(fname);
    setHistory(p => [
      { result:r, filename:fname, time:new Date().toLocaleTimeString() },
      ...p.slice(0,9)
    ]);
    setView("result");
  };

  const handleAuth = async e => {
    e.preventDefault();
    if (MOCK_MODE) { setLogin(true); return; }
    try {
      const res  = await fetch(`/api/auth/${authMode}`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error||"Auth failed");
      localStorage.setItem("token", data.token);
      setLogin(true);
    } catch(err) { setError(err.message); }
  };

  if (!loggedIn) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-gray-100 p-8 space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">⎈</div>
          <h1 className="text-2xl font-black text-gray-800">Helm Checker</h1>
          <p className="text-sm text-gray-400 mt-1">Quality scanner for Kubernetes charts</p>
        </div>
        <div className="flex rounded-xl bg-gray-100 p-1">
          {["login","register"].map(m => (
            <button key={m} onClick={()=>{setMode(m);setError("");}}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all capitalize ${
                authMode===m?"bg-white shadow text-gray-800":"text-gray-500"}`}>
              {m}
            </button>
          ))}
        </div>
        <form onSubmit={handleAuth} className="space-y-3">
          <input type="email" placeholder="Email" value={authForm.email}
            onChange={e=>setForm(f=>({...f,email:e.target.value}))}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 transition-all"
            required />
          <input type="password" placeholder="Password" value={authForm.password}
            onChange={e=>setForm(f=>({...f,password:e.target.value}))}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 transition-all"
            required />
          {authError && <p className="text-xs text-red-500 font-medium">{authError}</p>}
          <button type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-200 active:scale-95">
            {authMode==="login"?"Sign In":"Create Account"}
          </button>
        </form>
        {MOCK_MODE && (
          <p className="text-center text-xs text-amber-600 bg-amber-50 rounded-xl py-2 px-3 border border-amber-100">
            🔧 Mock mode · click Sign In to proceed
          </p>
        )}
      </div>
    </div>
  );

  const tabs = [
    {id:"scan",    icon:"🔍", label:"Scan"},
    {id:"history", icon:"📋", label:"History"},
    {id:"info",    icon:"📖", label:"Rules"},
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-white">
      <style>{`
        @keyframes fadeIn {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease; }
      `}</style>

      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg">⎈</div>
          <span className="font-black text-gray-800">Helm</span>
          <span className="font-black text-indigo-600">Checker</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 hidden sm:block">CSE3253 DevOps · MUJ</span>
          <button
            onClick={()=>{ localStorage.removeItem("token"); setLogin(false); }}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold transition-all">
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <div className="flex gap-2 mb-6">
          {tabs.map(t => (
            <button key={t.id} onClick={()=>setView(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                view===t.id
                  ?"bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                  :"bg-white text-gray-500 border border-gray-100 hover:border-indigo-200 hover:text-indigo-600"}`}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {t.id==="history" && history.length>0 && (
                <span className={`text-xs px-1.5 rounded-full font-bold ${
                  view==="history"?"bg-white/20 text-white":"bg-indigo-100 text-indigo-600"}`}>
                  {history.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 animate-fadeIn">

          {view==="scan" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black text-gray-800">Upload Chart</h2>
                <p className="text-sm text-gray-400 mt-0.5">Validate your Kubernetes Helm chart YAML</p>
              </div>
              <UploadZone onScan={handleScan} />
            </div>
          )}

          {view==="result" && result &&
            <ReportView result={result} filename={filename} onReset={()=>setView("scan")} />}

          {view==="result" && !result && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-5xl mb-3">🔍</div>
              <p className="font-medium">No scan results yet</p>
              <button onClick={()=>setView("scan")}
                className="mt-4 text-sm text-indigo-600 font-bold hover:underline">
                Run your first scan →
              </button>
            </div>
          )}

          {view==="history" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-gray-800">Scan History</h2>
                  <p className="text-sm text-gray-400 mt-0.5">{history.length} scans this session</p>
                </div>
                {history.length>0 && (
                  <button onClick={()=>setHistory([])}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 font-semibold hover:bg-red-100 transition-all">
                    Clear
                  </button>
                )}
              </div>
              <HistoryPanel history={history}
                onSelect={h=>{setResult(h.result);setFile(h.filename);setView("result");}} />
            </div>
          )}

          {view==="info" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black text-gray-800">Quality Rules</h2>
                <p className="text-sm text-gray-400 mt-0.5">All checks run on every uploaded chart</p>
              </div>
              <InfoPanel />
            </div>
          )}

        </div>

        <p className="text-center text-xs text-gray-300 mt-6 font-mono">
          Helm Chart Quality Checker · CSE3253 DevOps [PE6] · Manipal University Jaipur
        </p>
      </div>
    </div>
  );
}