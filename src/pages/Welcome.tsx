import { Link } from "react-router-dom";

export function Welcome() {
  return (
    <main className="event-welcome">
      <header className="welcome-topline">
        <span className="welcome-mark" aria-hidden="true">B</span>
        <span>Banking and Economy Club</span>
      </header>
      <section className="welcome-content" aria-labelledby="welcome-title">
        <p className="welcome-kicker">NISM · Presents</p>
        <h1 id="welcome-title">Bankonomy</h1>
        <p className="welcome-subtitle">Banking and Economy Club</p>
        <Link className="btn btn-primary welcome-enter" to="/login">
          Enter event <span aria-hidden="true">→</span>
        </Link>
      </section>
      <div className="welcome-footer">
        <span>Strategy. Markets. Decisions.</span>
      </div>
    </main>
  );
}