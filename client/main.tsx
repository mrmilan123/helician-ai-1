import { createRoot } from "react-dom/client";
import { App } from "./App";

let root: ReturnType<typeof createRoot> | null = null;

console.log(">>> MAIN.TSX FILE STARTED <<<");

function render() {
  const container = document.getElementById("root");

  if (!container) {
    console.error("Root container not found");
    return;
  }

  if (!root) {
    root = createRoot(container);
  }

  root.render(<App />);
}

render();

// Handle HMR updates
if (import.meta.hot) {
  import.meta.hot.accept(["./App.tsx"], () => {
    render();
  });
}
