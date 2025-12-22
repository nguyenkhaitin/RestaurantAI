import { useState } from "react";
import { Layout } from "./components/Layout";
import { FloorOperations } from "./components/modules/FloorOperations";
import { Analytics } from "./components/modules/Analytics";
import { HRManagement } from "./components/modules/HRManagement";
import { AIConfiguration } from "./components/modules/AIConfiguration";

export default function App() {
  const [currentModule, setCurrentModule] = useState("hr");
  const [currentSubModule, setCurrentSubModule] = useState("dashboard");

  const renderModule = () => {
    switch (currentModule) {
      case "floor":
        return <FloorOperations />;
      case "analytics":
        return <Analytics />;
      case "hr":
        return <HRManagement activeSubModule={currentSubModule} />;
      case "ai":
        return <AIConfiguration />;
      default:
        return <FloorOperations />;
    }
  };

  return (
    <Layout
      currentModule={currentModule}
      onModuleChange={setCurrentModule}
      currentSubModule={currentSubModule}
      onSubModuleChange={setCurrentSubModule}
    >
      {renderModule()}
    </Layout>
  );
}