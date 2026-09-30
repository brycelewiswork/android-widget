import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { DialRoot } from "@/components/dialkit"
import { Agentation } from "agentation"
import { PerfHud } from "@/components/ui/perf-hud"
import App from "./App"
import { initFluidSystem } from "@/lib/fluid"
import { initColorSystem } from "@/lib/colors"
import "./index.css"
import "@/components/dialkit/theme.css"

initFluidSystem()
initColorSystem()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" />
        <DialRoot position="top-right" />
        {import.meta.env.DEV && <Agentation endpoint="http://localhost:4747" />}
        {import.meta.env.DEV && <PerfHud />}
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
