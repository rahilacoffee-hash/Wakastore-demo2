import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, ShieldCheck, ArrowLeft, AlertCircle } from "lucide-react";
import { useAppState } from "../context/AppStateContext";

// Demo-only credentials. Replace this local check with the backend's
// authenticated admin endpoint before production deployment.
const ADMIN_ACCOUNTS = [
  { email: "admin@waka.test", password: "waka123", role: "admin", name: "Admin User" },
  { email: "superadmin@waka.test", password: "waka123", role: "super-admin", name: "Super Admin Team" },
];

export default function AdminLogin() {
  const { state, signIn } = useAppState();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (["admin", "super-admin"].includes(state?.session?.role)) {
    return <Navigate to="/admin/overview" replace />;
  }

  const submit = (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    const normalizedEmail = email.trim().toLowerCase();
    const account = ADMIN_ACCOUNTS.find(
      (item) => item.email === normalizedEmail && item.password === password,
    );
    if (!account) {
      setBusy(false);
      setError("The email or password is incorrect, or this account is not an administrator.");
      return;
    }
    signIn(account.role, account.email, account.name);
    navigate("/admin/overview", { replace: true });
  };

  return (
    <main className="min-h-[100svh] bg-[var(--canvas)] px-4 py-8 text-[var(--ink)] sm:grid sm:place-items-center sm:px-6">
      <div className="mx-auto w-full max-w-[460px]">
        <Link to="/welcome" className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--red)]">
          <ArrowLeft size={17} /> Back to WakaStore
        </Link>
        <section className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)]">
          <div className="bg-[#171717] px-6 py-8 text-white sm:px-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ed0018]">
              <ShieldCheck size={25} />
            </div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/55">WakaStore secure workspace</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Admin sign in</h1>
            <p className="mt-2 text-sm leading-6 text-white/65">Sign in with your administrator credentials to manage the marketplace.</p>
          </div>
          <form onSubmit={submit} className="space-y-5 p-6 sm:p-8">
            {error && <div role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle size={18} className="mt-0.5 shrink-0" />{error}</div>}
            <label className="block text-sm font-bold">Administrator email
              <input autoComplete="username" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@wakastore.com" className="mt-2 min-h-12 w-full rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-4 text-base font-normal outline-none transition focus:border-[var(--red)] focus:ring-2 focus:ring-red-100" />
            </label>
            <label className="block text-sm font-bold">Password
              <span className="relative mt-2 block">
                <LockKeyhole size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input autoComplete="current-password" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="min-h-12 w-full rounded-xl border border-[var(--line)] bg-[var(--canvas)] py-3 pl-11 pr-12 text-base font-normal outline-none transition focus:border-[var(--red)] focus:ring-2 focus:ring-red-100" />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--soft)]">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </span>
            </label>
            <button disabled={busy} type="submit" className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--red)] px-4 text-sm font-extrabold text-white transition hover:bg-[#c90015] focus:outline-none focus:ring-4 focus:ring-red-200 disabled:cursor-wait disabled:opacity-60">{busy ? "Signing in…" : "Sign in to admin"}</button>
            <p className="text-center text-xs leading-5 text-[var(--muted)]">Administrator access is restricted. All access should be authorized by WakaStore.</p>
          </form>
        </section>
        <p className="mt-5 text-center text-xs text-[var(--muted)]">Need a customer or merchant account? <Link to="/welcome" className="font-bold text-[var(--red)]">Return to account options</Link></p>
      </div>
    </main>
  );
}
