import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const IconShowcase = () => {
  const icons = [
    { name: "Master Icon (1024×1024)", path: "/assets/icon-master-1024.png", size: "w-64 h-64" },
    { name: "iOS Icon (1024×1024)", path: "/assets/icon-ios-1024.png", size: "w-64 h-64" },
    { name: "Android Foreground (1024×1024)", path: "/assets/icon-android-foreground-1024.png", size: "w-64 h-64", bg: "bg-orange-200" },
    { name: "Play Store Listing (512×512)", path: "/assets/play-icon-512.png", size: "w-48 h-48" },
    { name: "Android Background (432×432)", path: "/assets/ic_background_432.png", size: "w-32 h-32" },
    { name: "Android Foreground (432×432)", path: "/assets/ic_foreground_432.png", size: "w-32 h-32", bg: "bg-orange-200" },
    { name: "Monochrome (432×432)", path: "/assets/ic_monochrome_432.png", size: "w-32 h-32", bg: "bg-gray-200" },
    { name: "Legacy 192×192", path: "/assets/icon-192.png", size: "w-24 h-24" },
    { name: "Legacy 144×144", path: "/assets/icon-144.png", size: "w-20 h-20" },
    { name: "Legacy 96×96", path: "/assets/icon-96.png", size: "w-16 h-16" },
    { name: "Legacy 72×72", path: "/assets/icon-72.png", size: "w-14 h-14" },
    { name: "Legacy 48×48", path: "/assets/icon-48.png", size: "w-12 h-12" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2">TradeLine 24/7 Icon Assets</h1>
        <p className="text-muted-foreground mb-8">
          Review all generated icon assets. Note: Sizes under 512px need manual resizing.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {icons.map((icon) => (
            <div key={icon.name} className="border rounded-lg p-6 flex flex-col items-center gap-4">
              <h3 className="font-semibold text-center">{icon.name}</h3>
              <div className={`flex items-center justify-center ${icon.bg || 'bg-white'} border rounded p-4`}>
                <img
                  src={icon.path}
                  alt={icon.name}
                  className={icon.size}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLElement).parentElement;
                    if (parent) {
                      parent.innerHTML = '<p class="text-red-500 text-sm">Image not found</p>';
                    }
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {icon.name.includes("Legacy") || icon.name.includes("432") 
                  ? "⚠️ Needs manual resizing" 
                  : "✅ Generated"}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-muted rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Legibility Test</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Check if "24/7" text remains legible at small sizes (critical for 48px & 64px)
          </p>
          <div className="flex gap-8 items-end">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-medium">64×64px</span>
              <img src="/assets/icon-48.png" alt="64px test" className="w-16 h-16 border" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-medium">48×48px</span>
              <img src="/assets/icon-48.png" alt="48px test" className="w-12 h-12 border" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-medium">32×32px</span>
              <img src="/assets/icon-48.png" alt="32px test" className="w-8 h-8 border" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-medium">24×24px</span>
              <img src="/assets/icon-48.png" alt="24px test" className="w-6 h-6 border" />
            </div>
          </div>
          <p className="mt-4 text-sm text-orange-600">
            ⚠️ If "24/7" is not clearly readable at 48px, increase text stroke weight by 10-15% and regenerate.
          </p>
        </div>

        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Next Steps</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Review icon quality and "24/7" legibility</li>
            <li>Manually resize icons under 512px using an image editor</li>
            <li>Replace placeholder files in <code className="bg-white px-1 rounded">/public/assets/</code></li>
            <li>Update Capacitor config to use new icons</li>
            <li>Run <code className="bg-white px-1 rounded">npx cap sync</code> to apply to native apps</li>
            <li>Test on actual devices (Android & iOS)</li>
          </ol>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default IconShowcase;
