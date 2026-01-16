const Floating = () => {
  return (
    <div className="absolute top-4 right-4 z-40">
      <div className="px-4 py-1.5 rounded-full glass-panel text-xs text-zinc-400 border border-zinc-800/50 shadow-lg flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        Team Sole Stack
      </div>
    </div>
  );
};

export default Floating;
