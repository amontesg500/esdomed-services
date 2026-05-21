const variants = {
  pendiente:   "bg-amber-50 dark:bg-amber-950  text-amber-700 dark:text-amber-400  border border-amber-200 dark:border-amber-900",
  en_revision: "bg-blue-50 dark:bg-blue-950   text-blue-700 dark:text-blue-400   border border-blue-200 dark:border-blue-900",
  aprobado:    "bg-green-50 dark:bg-green-950  text-green-700 dark:text-green-400  border border-green-200 dark:border-green-900",
  rechazado:   "bg-red-50 dark:bg-red-950    text-red-700 dark:text-red-400    border border-red-200 dark:border-red-900",
  confirmado:  "bg-green-50 dark:bg-green-950  text-green-700 dark:text-green-400  border border-green-200 dark:border-green-900",
  impreso:     "bg-green-50 dark:bg-green-950  text-green-700 dark:text-green-400  border border-green-200 dark:border-green-900",
};

const labels = {
  pendiente: "Pendiente", en_revision: "En revisión", aprobado: "Aprobado",
  rechazado: "Rechazado", confirmado: "Confirmado",   impreso: "Impreso",
};

export function Badge({ estado }: { estado: keyof typeof variants }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${variants[estado]}`}>
      {labels[estado]}
    </span>
  );
}
