import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAntiCopy } from "./hooks/useAntiCopy";
import { getSessionToken } from "./lib/session";
import { Admin } from "./pages/Admin";
import { AdminLogin } from "./pages/AdminLogin";
import { LiveStandings } from "./pages/LiveStandings";
import { Lobby } from "./pages/Lobby";
import { Login } from "./pages/Login";
import { Round1 } from "./pages/Round1";
import { Round2 } from "./pages/Round2";
import { Round3 } from "./pages/Round3";
import { RoundStart } from "./pages/RoundStart";
import { Welcome } from "./pages/Welcome";

function RequireTeamSession({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const token = getSessionToken();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

function ParticipantAntiCopy() {
  const { pathname } = useLocation();
  const teamRoute =
    !pathname.startsWith("/admin") && !pathname.startsWith("/live-standings");
  useAntiCopy(teamRoute);
  return null;
}

export default function App() {
  return (
    <>
      <ParticipantAntiCopy />
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/lobby"
          element={
            <RequireTeamSession>
              <Lobby />
            </RequireTeamSession>
          }
        />
        <Route
          path="/round/:roundId/start"
          element={
            <RequireTeamSession>
              <RoundStart />
            </RequireTeamSession>
          }
        />
        <Route
          path="/round/1"
          element={
            <RequireTeamSession>
              <Round1 />
            </RequireTeamSession>
          }
        />
        <Route
          path="/round/2"
          element={
            <RequireTeamSession>
              <Round2 />
            </RequireTeamSession>
          }
        />
        <Route
          path="/round/3"
          element={
            <RequireTeamSession>
              <Round3 />
            </RequireTeamSession>
          }
        />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/live-standings" element={<LiveStandings />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
