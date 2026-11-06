export type Ordered = { id: string; sort_order: number };

/**
 * Mueve un elemento una posición arriba/abajo y devuelve SOLO las filas cuyo
 * `sort_order` cambia (se renumera de 10 en 10 para dejar huecos).
 * Devuelve [] si el movimiento no es posible (primero/último o id inexistente).
 */
export function reorder(items: readonly Ordered[], id: string, direction: "up" | "down"): Ordered[] {
  const list = [...items];
  const i = list.findIndex((x) => x.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i === -1 || j < 0 || j >= list.length) return [];
  [list[i], list[j]] = [list[j], list[i]];
  return list
    .map((x, index) => ({ id: x.id, sort_order: (index + 1) * 10, before: x.sort_order }))
    .filter((x) => x.sort_order !== x.before)
    .map(({ id: rowId, sort_order }) => ({ id: rowId, sort_order }));
}
