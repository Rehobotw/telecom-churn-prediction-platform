import {
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  CircleDot,
  CloudUpload,
  Github,
  Layers3,
  LineChart,
  Menu,
  Network,
  ShieldAlert,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

const features = [
  {
    icon: UsersRound,
    tint: "bg-sky-50 text-sky-700",
    title: "See the bigger picture",
    description: "Explore customer patterns, churn trends, and the signals shaping your subscriber base.",
  },
  {
    icon: ShieldAlert,
    tint: "bg-amber-50 text-amber-700",
    title: "Prioritize customer risk",
    description: "Review risk-ranked predictions and focus attention where churn signals are strongest.",
  },
  {
    icon: CloudUpload,
    tint: "bg-violet-50 text-violet-700",
    title: "Score a whole CSV",
    description: "Upload a customer file for batch predictions, with validation and downloadable results.",
  },
  {
    icon: LineChart,
    tint: "bg-emerald-50 text-emerald-700",
    title: "Evaluate model quality",
    description: "Inspect classification metrics and understand how the trained models compare.",
  },
];

const flow = [
  { name: "React frontend", detail: "Insights & workflows", icon: Layers3, color: "text-sky-700 bg-sky-50" },
  { name: "Express API", detail: "Routing & data access", icon: Network, color: "text-violet-700 bg-violet-50" },
  { name: "FastAPI ML service", detail: "Predictions & metrics", icon: Sparkles, color: "text-emerald-700 bg-emerald-50" },
];

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[590px]">
      <div aria-hidden="true" className="absolute -inset-8 rounded-[2.5rem] bg-gradient-to-br from-sky-200/50 via-indigo-100/50 to-violet-200/40 blur-3xl" />
      <div className="relative rounded-[1.4rem] border border-slate-200/90 bg-white p-3 shadow-[0_28px_80px_-35px_rgba(28,53,97,0.38)] sm:p-4">
        <div className="flex items-center justify-between border-b border-slate-100 px-2 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-950 text-white"><BarChart3 size={16} /></div>
            <div><p className="text-xs font-semibold text-slate-800">Churn Insights</p><p className="text-[10px] text-slate-400">Customer overview</p></div>
          </div>
          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700">Overview</span>
        </div>
        <div className="grid grid-cols-3 gap-2.5 py-3 sm:gap-3 sm:py-4">
          {[["Customers", "7,043", "+12.8%"], ["At-risk", "1,284", "18.2%"], ["Churn rate", "26.5%", "This period"]].map(([label, value, sub]) => (
            <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 sm:p-3.5">
              <p className="text-[9px] text-slate-500 sm:text-[10px]">{label}</p><p className="mt-1 text-base font-semibold tracking-tight text-slate-900 sm:text-xl">{value}</p><p className="mt-1 text-[8px] text-slate-400 sm:text-[9px]">{sub}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-xl border border-slate-100 p-3 sm:p-4">
            <div className="flex items-start justify-between"><div><p className="text-[11px] font-semibold text-slate-800">Churn signals</p><p className="mt-0.5 text-[9px] text-slate-400">Customer distribution by risk</p></div><span className="rounded-md bg-slate-50 px-2 py-1 text-[8px] text-slate-500">Last 6 months</span></div>
            <div className="relative mt-4 h-[112px] overflow-hidden sm:h-[142px]">
              <div className="absolute inset-0 flex flex-col justify-between">{[0, 1, 2, 3].map((n) => <div key={n} className="border-t border-dashed border-slate-100" />)}</div>
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 420 150" preserveAspectRatio="none" role="img" aria-label="Illustrative customer churn trend chart">
                <defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#38bdf8" stopOpacity=".22"/><stop offset="100%" stopColor="#38bdf8" stopOpacity="0"/></linearGradient></defs>
                <path d="M0 115 C32 105 42 112 70 91 S115 100 140 76 S184 88 210 61 S255 82 280 53 S328 72 350 38 S395 48 420 18 V150 H0Z" fill="url(#area)" />
                <path d="M0 115 C32 105 42 112 70 91 S115 100 140 76 S184 88 210 61 S255 82 280 53 S328 72 350 38 S395 48 420 18" fill="none" stroke="#0284c7" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                <path d="M0 128 C40 120 45 130 80 115 S130 120 160 104 S200 115 230 94 S270 103 305 86 S350 94 380 76 S400 80 420 68" fill="none" stroke="#a5b4fc" strokeWidth="2" strokeDasharray="4 5" vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="absolute inset-x-0 bottom-0 flex justify-between text-[8px] text-slate-400"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span></div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 p-3 sm:p-4">
            <p className="text-[11px] font-semibold text-slate-800">Risk breakdown</p><p className="mt-0.5 text-[9px] text-slate-400">Predicted customer segments</p>
            <div className="mx-auto my-3 grid h-[94px] w-[94px] place-items-center rounded-full sm:h-[112px] sm:w-[112px]" style={{ background: "conic-gradient(#f97316 0 21%, #fbbf24 21% 54%, #34d399 54% 100%)" }}><div className="grid h-[62px] w-[62px] place-items-center rounded-full bg-white text-center sm:h-[76px] sm:w-[76px]"><div><p className="text-sm font-semibold text-slate-900">7,043</p><p className="text-[8px] text-slate-400">customers</p></div></div></div>
            <div className="space-y-1.5">{[["High risk", "21%", "bg-orange-400"], ["Medium risk", "33%", "bg-amber-400"], ["Low risk", "46%", "bg-emerald-400"]].map(([label, pct, color]) => <div key={label} className="flex items-center justify-between text-[9px]"><span className="flex items-center gap-1.5 text-slate-500"><i className={`h-1.5 w-1.5 rounded-full ${color}`} />{label}</span><span className="font-medium text-slate-700">{pct}</span></div>)}</div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-950 px-3.5 py-3 text-white sm:px-4">
          <div className="flex items-center gap-2.5"><div className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-sky-300"><CircleDot size={14} /></div><div><p className="text-[10px] font-medium">Risk-ranked predictions</p><p className="text-[8px] text-slate-400">Review customers by churn likelihood</p></div></div><ArrowRight size={14} className="text-slate-400" />
        </div>
      </div>
      <div className="absolute -bottom-5 -left-3 hidden items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-lg sm:flex"><span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600"><Check size={14}/></span><div><p className="text-[10px] font-semibold text-slate-800">Three services, one view</p><p className="text-[9px] text-slate-400">From data to actionable insight</p></div></div>
    </div>
  );
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = [{ label: "Features", href: "#features" }, { label: "Architecture", href: "#architecture" }, { label: "Repository", href: "#repository" }];
  return (
    <div className="min-h-screen overflow-hidden bg-white text-slate-900 selection:bg-sky-100 selection:text-sky-950">
      <header className="relative z-20 border-b border-slate-100/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
          <a href="#top" className="flex items-center gap-2.5" aria-label="Churn Insights home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-white shadow-sm"><BarChart3 size={18} /></span>
            <span><span className="block text-sm font-semibold leading-tight tracking-tight">Churn Insights</span><span className="mt-0.5 block text-[10px] leading-tight text-slate-500">Telecom analytics platform</span></span>
          </a>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">{navLinks.map((item) => <a key={item.label} href={item.href} className="text-[13px] font-medium text-slate-600 transition-colors hover:text-sky-700">{item.label}</a>)}</nav>
          <div className="hidden md:block"><Link to="/app" className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-[13px] font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2">Dashboard <ArrowRight size={15}/></Link></div>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-700 md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen}>{menuOpen ? <X size={19}/> : <Menu size={19}/>}</button>
        </div>
        {menuOpen && <nav className="border-t border-slate-100 bg-white px-5 py-4 md:hidden" aria-label="Mobile navigation"><div className="mx-auto flex max-w-7xl flex-col gap-1">{navLinks.map((item) => <a onClick={() => setMenuOpen(false)} key={item.label} href={item.href} className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">{item.label}</a>)}<Link onClick={() => setMenuOpen(false)} to="/app" className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Open dashboard <ArrowRight size={16}/></Link></div></nav>}
      </header>

      <main id="top">
        <section className="relative isolate">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] bg-[radial-gradient(ellipse_at_16%_8%,rgba(186,230,253,0.42),transparent_42%),radial-gradient(ellipse_at_85%_12%,rgba(224,231,255,0.55),transparent_40%)]" />
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10 lg:px-12 lg:pb-28 lg:pt-24">
            <div className="max-w-xl animate-[fade-up_.65s_ease-out_both]">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/80 px-3 py-1.5 text-[11px] font-medium text-sky-800 shadow-sm"><span className="h-1.5 w-1.5 rounded-full bg-sky-500"/>Customer intelligence, made clearer</div>
              <h1 className="text-[2.8rem] font-semibold leading-[1.08] tracking-[-0.055em] text-slate-950 sm:text-5xl lg:text-[3.7rem]">Understand churn.<br/><span className="bg-gradient-to-r from-sky-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent">See what comes next.</span></h1>
              <p className="mt-6 max-w-lg text-[15px] leading-7 text-slate-600 sm:text-base">Turn telecom customer data into a clearer view of churn patterns. Explore customer insights, review risk-ranked predictions, and evaluate the models behind them.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"><Link to="/app" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-10px_rgba(15,23,42,.6)] transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2">Explore Dashboard <ArrowRight size={16}/></Link><a href="#features" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-slate-600 transition hover:text-slate-950">Discover the platform <ChevronRight size={15}/></a></div>
              <div className="mt-9 flex items-center gap-3 text-xs text-slate-500"><div className="flex -space-x-1"><span className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-sky-100 text-sky-700"><UsersRound size={12}/></span><span className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-violet-100 text-violet-700"><BarChart3 size={12}/></span><span className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-emerald-100 text-emerald-700"><Sparkles size={12}/></span></div><span>Built for curious analysts and teams</span></div>
            </div>
            <div className="animate-[fade-up_.8s_.12s_ease-out_both]"><DashboardPreview /></div>
          </div>
        </section>

        <section id="features" className="scroll-mt-20 border-y border-slate-100 bg-slate-50/70 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-2xl text-center"><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-sky-700">A clearer view of your customers</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-slate-950 sm:text-4xl">From churn signals to confident decisions</h2><p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">A focused workspace to explore customer behavior and understand model outputs.</p></div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{features.map(({ icon: Icon, tint, title, description }, i) => <article key={title} className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_18px_40px_-28px_rgba(15,23,42,.35)] sm:p-6"><span className={`grid h-11 w-11 place-items-center rounded-xl ${tint}`}><Icon size={20}/></span><p className="mt-5 text-[10px] font-semibold tracking-[.12em] text-slate-400">0{i + 1}</p><h3 className="mt-2 text-base font-semibold tracking-tight text-slate-900">{title}</h3><p className="mt-2.5 text-[13px] leading-6 text-slate-500">{description}</p><span className="mt-5 inline-flex items-center text-xs font-medium text-sky-700 opacity-0 transition group-hover:opacity-100">Explore <ArrowRight size={13} className="ml-1"/></span></article>)}</div>
          </div>
        </section>

        <section id="architecture" className="scroll-mt-20 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <div className="grid items-end gap-5 md:grid-cols-[1fr_auto]"><div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-sky-700">How it works</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-slate-950 sm:text-4xl">A simple, connected architecture</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Each service has a clear role, working together to bring predictions and insights into one place.</p></div><a href="https://github.com/Rehobotw/telecom-churn-prediction-platform/blob/main/docs/architecture.md" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 pb-1 text-xs font-semibold text-slate-600 transition hover:text-sky-700">View architecture <ArrowDownRight size={14}/></a></div>
            <div className="mt-10 grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:gap-4">{flow.map(({ name, detail, icon: Icon, color }, i) => <div key={name} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_-16px_rgba(15,23,42,.3)] sm:p-6"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${color}`}><Icon size={21}/></span><div><p className="text-sm font-semibold text-slate-900">{name}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>{i === 0 && <span className="ml-auto hidden text-slate-300 md:hidden"><ArrowRight size={17}/></span>}</div>).flatMap((item, i) => i < flow.length - 1 ? [item, <div key={`arrow-${i}`} className="hidden place-items-center text-slate-300 md:grid"><ArrowRight size={19}/></div>] : [item])}</div>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500"><Check size={14} className="shrink-0 text-emerald-600"/>React frontend <ArrowRight size={12}/> Express API <ArrowRight size={12}/> FastAPI ML service</div>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-[#f8fafc] py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-sky-700">Model snapshot</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-slate-950 sm:text-4xl">A look at the evaluation results</h2></div><Link to="/app/model-metrics" className="inline-flex items-center gap-2 text-xs font-semibold text-sky-800 hover:text-sky-950">Explore model metrics <ArrowRight size={14}/></Link></div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_35px_-28px_rgba(15,23,42,.4)]"><div className="grid grid-cols-[1.1fr_1fr_1fr] border-b border-slate-100 bg-slate-50/80 px-4 py-3.5 text-[10px] font-semibold uppercase tracking-[.1em] text-slate-500 sm:px-7"><span>Dataset evaluation</span><span>Logistic Regression</span><span>Random Forest</span></div><div className="grid grid-cols-[1.1fr_1fr_1fr] items-center px-4 py-5 text-xs sm:px-7 sm:py-6"><span className="font-medium text-slate-700">ROC-AUC</span><span className="font-mono text-sm text-slate-700">0.8409</span><span className="font-mono text-sm font-semibold text-sky-800">0.8424</span></div><div className="grid grid-cols-[1.1fr_1fr_1fr] items-center border-t border-slate-100 px-4 py-5 text-xs sm:px-7 sm:py-6"><span className="font-medium text-slate-700">F1 score</span><span className="font-mono text-sm text-slate-700">0.6094</span><span className="font-mono text-sm font-semibold text-sky-800">0.6261</span></div><div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-[10px] leading-5 text-slate-500 sm:px-7">Results from the project’s saved test-split evaluation. These dataset results describe model evaluation and are not production performance guarantees.</div></div>
          </div>
        </section>
      </main>

      <footer id="repository" className="scroll-mt-16 bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12"><div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start"><div className="max-w-sm"><a href="#top" className="inline-flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-sky-300"><BarChart3 size={18}/></span><span className="text-sm font-semibold">Churn Insights</span></a><p className="mt-4 text-xs leading-6 text-slate-400">A telecom customer churn prediction and insights platform built for learning and exploration.</p></div><div className="flex flex-wrap gap-x-6 gap-y-3 text-xs"><a href="https://github.com/Rehobotw/telecom-churn-prediction-platform" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-slate-300 transition hover:text-white"><Github size={15}/> GitHub repository</a><Link to="/app" className="inline-flex items-center gap-2 text-slate-300 transition hover:text-white"><BarChart3 size={15}/> Open dashboard <ArrowRight size={12}/></Link></div></div><div className="mt-9 border-t border-white/10 pt-5 text-[10px] leading-5 text-slate-500">Educational project for exploration and demonstration. Predictions are estimates and should not be treated as guaranteed outcomes. <span className="float-right hidden sm:inline">© {new Date().getFullYear()} Churn Insights</span></div></div>
      </footer>
      <style>{`@keyframes fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } } @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: .01ms !important; } }`}</style>
    </div>
  );
}
