/**
 * Shell raíz del árbol de la app. Server Component: no necesita estado ni
 * efectos, así que NO marca 'use client' para no forzar la hidratación de
 * todo el árbol público (innecesario y perjudica TBT/INP).
 */
export function RootShell({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col flex-1">{children}</div>;
}
