export function installGlobalTraps(mountEmergency: () => void) {
  let tripped = false;
  const trip = () => { if (!tripped) { tripped = true; mountEmergency(); } };
  addEventListener("error", trip); addEventListener("unhandledrejection", trip as any);
}