import { Routes, Route, Navigate } from "react-router-dom";
import Page from "./Page";
import { Login } from "./pages/Login";
import { AddAccount } from "./pages/AddAccount";
import { Favourites } from "./pages/Favourites";
import { Settings } from "./pages/Settings";
import { Genesis } from "./pages/Genesis";
import { GenesisOutgoingForm } from "./pages/GenesisOutgoingForm";
import { GenesisIncomingForm } from "./pages/GenesisIncomingForm";
import { GenesisProjectUsageForm } from "./pages/GenesisProjectUsageForm";
import { GenesisNetStockForm } from "./pages/GenesisNetStockForm";
import { PurchaseOrderList } from "./pages/PurchaseOrderList";
import { PurchaseOrderForm } from "./pages/PurchaseOrderForm";
import { Quantum } from "./pages/Quantum";
import { Introduction } from "./pages/Introduction";
import { GetStarted } from "./pages/GetStarted";
import { Tutorials } from "./pages/Tutorials";
import { Changelog } from "./pages/Changelog";
import { General } from "./pages/General";
import { Team } from "./pages/Team";
import { Billing } from "./pages/Billing";
import { Limits } from "./pages/Limits";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Catalogs from "./pages/Catalogs";

function App() {
  return (
    <Routes>
      {/* Public route - Login page */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes - All other routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Page />
        </ProtectedRoute>
      }>
        {/* Default redirect */}
        <Route index element={<Navigate to="/account/add-account" replace />} />
        
        {/* Account routes */}
        <Route path="account/add-account" element={<AddAccount />} />
        <Route path="account/favourites" element={<Favourites />} />
        <Route path="account/settings" element={<Settings />} />
        
        {/* Procurement routes */}
        <Route path="procurement/genesis" element={<Genesis />} />
        <Route path="procurement/genesis/outgoing/create" element={<GenesisOutgoingForm />} />
        <Route path="procurement/genesis/outgoing/edit/:id" element={<GenesisOutgoingForm />} />
        <Route path="procurement/genesis/outgoing/view/:id" element={<GenesisOutgoingForm />} />
        <Route path="procurement/genesis/incoming/create" element={<GenesisIncomingForm />} />
        <Route path="procurement/genesis/incoming/edit/:id" element={<GenesisIncomingForm />} />
        <Route path="procurement/genesis/incoming/view/:id" element={<GenesisIncomingForm />} />
        <Route path="procurement/genesis/project-usage/create" element={<GenesisProjectUsageForm />} />
        <Route path="procurement/genesis/project-usage/edit/:id" element={<GenesisProjectUsageForm />} />
        <Route path="procurement/genesis/project-usage/view/:id" element={<GenesisProjectUsageForm />} />
        <Route path="procurement/genesis/net-stock/create" element={<GenesisNetStockForm />} />
        <Route path="procurement/genesis/net-stock/edit/:id" element={<GenesisNetStockForm />} />
        <Route path="procurement/genesis/net-stock/view/:id" element={<GenesisNetStockForm />} />
        <Route path="procurement/purchase-order" element={<PurchaseOrderList />} />
        <Route path="procurement/purchase-order/create" element={<PurchaseOrderForm />} />
        <Route path="procurement/purchase-order/edit/:id" element={<PurchaseOrderForm />} />
        <Route path="procurement/purchase-order/view/:id" element={<PurchaseOrderForm />} />
        <Route path="procurement/quantum" element={<Quantum />} />
        <Route path="procurement/catalogs" element={<Catalogs />} />
        
        {/* Documentation routes */}
        <Route path="documentation/introduction" element={<Introduction />} />
        <Route path="documentation/get-started" element={<GetStarted />} />
        <Route path="documentation/tutorials" element={<Tutorials />} />
        <Route path="documentation/changelog" element={<Changelog />} />
        
        {/* Settings routes */}
        <Route path="settings/general" element={<General />} />
        <Route path="settings/team" element={<Team />} />
        <Route path="settings/billing" element={<Billing />} />
        <Route path="settings/limits" element={<Limits />} />
      </Route>
      
      {/* Catch all - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
