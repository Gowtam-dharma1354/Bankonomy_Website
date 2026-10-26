import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function AdminLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const { data: signInData, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err || !signInData.user) {
      setError(err?.message ?? "Admin sign-in failed.");
      return;
    }

    const { data: adminRow, error: adminErr } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", signInData.user.id)
      .maybeSingle();

    if (adminErr || !adminRow) {
      await supabase.auth.signOut();
      setError("This account is not registered as an admin in Supabase.");
      return;
    }

    nav("/admin");
  }

  return (
    <div className="admin-shell page-center">
      <form className="card login-card" onSubmit={onSubmit}>
        <h1 className="mono">Admin — BANKONOMY</h1>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn-primary">
          Sign in
        </button>
      </form>
    </div>
  );
}
