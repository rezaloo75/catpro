import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CatalogPage } from './pages/CatalogPage'
import { InterfaceDetailPage } from './pages/InterfaceDetailPage'
import { GatewayPage } from './pages/GatewayPage'
import { ObservabilityPage } from './pages/ObservabilityPage'
import { PortalPage } from './pages/PortalPage'
import { MeteringPage } from './pages/MeteringPage'
import { ContextMeshPage } from './pages/ContextMeshPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/interfaces/:id" element={<InterfaceDetailPage />} />
        <Route path="/gateway/:type/:id" element={<GatewayPage />} />
        <Route path="/observability/:id" element={<ObservabilityPage />} />
        <Route path="/portal/:id" element={<PortalPage />} />
        <Route path="/metering/:id" element={<MeteringPage />} />
        <Route path="/context-mesh/:id" element={<ContextMeshPage />} />
        <Route path="/api-gateway" element={<GatewayPage landingType="api" />} />
        <Route path="/event-gateway" element={<GatewayPage landingType="event" />} />
        <Route path="/ai-gateway" element={<GatewayPage landingType="ai" />} />
        <Route path="/observability" element={<ObservabilityPage />} />
        <Route path="/developer-portal" element={<PortalPage />} />
        <Route path="/metering-billing" element={<MeteringPage />} />
        <Route path="/context-mesh" element={<ContextMeshPage />} />
        <Route path="/settings" element={<div className="p-8 text-kong-text-muted">Settings page — not part of this prototype.</div>} />
      </Routes>
    </Layout>
  )
}

export default App
