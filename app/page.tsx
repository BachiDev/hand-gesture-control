import SiteFooter from './components/chrome/SiteFooter';
import DemoApp from './components/DemoApp';

/** Server shell: tabbed demo island (header + hero live inside `DemoApp`) → footer. */
export default function Home() {
  return (
    <div
      id="top"
      className="min-h-screen bg-zinc-100 text-zinc-800 font-sans dark:bg-zinc-950 dark:text-zinc-300"
    >
      <main id="content" className="pt-32 px-4 max-w-6xl mx-auto">
        <DemoApp />
      </main>
      <SiteFooter />
    </div>
  );
}
