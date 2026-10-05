/** Logotipo TAMP: "TA" en tinta y "MP" en el rojo de marca. */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-extrabold tracking-tight ${className}`}>
      <span className="text-ink-900">TA</span>
      <span className="text-brand-red">MP</span>
    </span>
  );
}
