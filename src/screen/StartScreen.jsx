import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WakastoreLogo from "../components/ui/WakastoreLogo";

export default function StartScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(
      () => navigate("/loading", { replace: true }),
      750,
    );
    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <main className="start-screen" aria-label="WakaStore">
      <WakastoreLogo large />
      
    </main>
  );
}
