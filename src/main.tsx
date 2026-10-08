import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, HashRouter } from "react-router-dom"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import App from "./App"
import { initFluidSystem } from "@/lib/fluid"
import { initColorSystem } from "@/lib/colors"
import "./index.css"

// At the site root, clean URLs. Served from a sub-path with no server rewrite
// (Design Playground), hash URLs, so deep links and refreshes still work.
const Router = import.meta.env.BASE_URL === "/" ? BrowserRouter : HashRouter

initFluidSystem()
initColorSystem()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Router>
        <App />
        <Toaster position="top-right" />
      </Router>
    </ThemeProvider>
  </StrictMode>,
)
