import { sdk } from "https://esm.sh/@farcaster/miniapp-sdk";

window.addEventListener("load", async () => {
  const root = document.getElementById("app");
  const { bootFlashUI } = await import("./Flashmath-ui.js");

  let isMini = false;
  try {
    isMini = await sdk.isInMiniApp();
  } catch {
    isMini = false;
  }

  const ui = bootFlashUI({
    root,
    onReadyText: isMini ? "mini app detected ✓" : "web mode ✓"
  });
  ui.setEnv(isMini);

  // ALWAYS call ready()
  try {
    await sdk.actions.ready();
  } catch {}
});