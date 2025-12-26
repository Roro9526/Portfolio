import React, { useState } from "react";
import { PortfolioProvider } from "./context/PortfolioContext";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Predictions } from "./pages/Predictions";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  return (
    <PortfolioProvider>
      <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
        {currentPage === "dashboard" && <Dashboard />}
        {currentPage === "predictions" && <Predictions />}
      </Layout>
    </PortfolioProvider>
  );
}

export default App;
