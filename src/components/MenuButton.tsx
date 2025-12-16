interface MenuButtonProps {
  onClick: () => void;
}

export default function MenuButton({ onClick }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-1.5 w-6 h-6 justify-center items-end group cursor-pointer"
      aria-label="Menu"
    >
      <span className="w-6 h-0.5 bg-off-white/70 group-hover:bg-off-white transition-colors"></span>
      <span className="w-6 h-0.5 bg-off-white/70 group-hover:bg-off-white transition-colors"></span>
      <span className="w-6 h-0.5 bg-off-white/70 group-hover:bg-off-white transition-colors"></span>
    </button>
  );
}
