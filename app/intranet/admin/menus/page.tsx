'use client';

import { useEffect, useState } from 'react';
import { Plus, Save, Trash2, Edit3, X, GripVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { Spinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/ui/page-header';

interface MenuItem {
  label: string; url?: string; target?: string; children?: { label: string; url: string }[];
}

interface Menu {
  id: string; nombre: string; items: MenuItem[]; creadoEn: string;
}

export default function AdminMenusPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editItems, setEditItems] = useState<MenuItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchMenus = () => {
    setLoading(true);
    fetch('/api/admin/menus')
      .then(r => r.json())
      .then(data => setMenus(data.menus ?? []))
      .catch(() => toast.danger('Error al cargar menús'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMenus(); }, []); // eslint-disable-line react-hooks/exhaustive-deps,react-hooks/set-state-in-effect

  const startEdit = (menu: Menu) => {
    setEditing(menu.id);
    setEditNombre(menu.nombre);
    setEditItems(JSON.parse(JSON.stringify(menu.items)));
    setCreating(false);
  };

  const cancelEdit = () => { setEditing(null); setCreating(false); };

  const addItem = () => {
    setEditItems([...editItems, { label: '', url: '', children: [] }]);
  };

  const updateItem = (index: number, field: string, value: string) => {
    const items = [...editItems];
    if (field === 'label') items[index].label = value;
    else if (field === 'url') items[index].url = value;
    else if (field === 'target') items[index].target = value;
    setEditItems(items);
  };

  const removeItem = (index: number) => {
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!editNombre.trim() || editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/menus?id=${editing}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: editItems }),
      });
      if (!res.ok) throw new Error();
      toast.success('Menú actualizado');
      setEditing(null);
      fetchMenus();
    } catch { toast.danger('Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleCreate = async () => {
    if (!newNombre.trim()) { toast.danger('Nombre requerido'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/menus', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newNombre, items: [] }),
      });
      if (!res.ok) throw new Error();
      toast.success('Menú creado');
      setCreating(false); setNewNombre('');
      fetchMenus();
    } catch { toast.danger('Error al crear'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!await confirm({ title: `¿Eliminar menú "${nombre}"?`, description: 'Esta acción no se puede deshacer.' })) return;
    try {
      const res = await fetch(`/api/admin/menus?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Menú eliminado');
      fetchMenus();
    } catch { toast.danger('Error al eliminar'); }
  };

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Menús de navegación"
        subtitle={`${menus.length} menús configurados`}
        actions={<Button variant="primary" size="sm" onClick={() => { setCreating(!creating); setEditing(null); }}><Plus size={14} /> Nuevo menú</Button>}
      />

      {creating && (
        <Card padding="md" tone="accent">
          <h2 className="font-bold text-sm text-text mb-3">Crear nuevo menú</h2>
          <div className="flex gap-2">
            <Input value={newNombre} onChange={e => setNewNombre(e.target.value)} placeholder="Nombre del menú (ej: principal, footer, legal)" className="flex-1" />
            <Button onClick={handleCreate} variant="primary" size="sm" loading={saving}><Save size={14} /> Crear</Button>
            <Button onClick={() => setCreating(false)} variant="ghost" size="sm"><X size={14} /> Cancelar</Button>
          </div>
        </Card>
      )}

      {menus.length === 0 ? (
        <Card padding="lg"><p className="text-center text-text-secondary text-sm">No hay menús configurados. Crea tu primer menú de navegación.</p></Card>
      ) : (
        <div className="space-y-3">
          {menus.map(menu => (
            <Card key={menu.id} padding="md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-primary">{menu.nombre}</h3>
                  <Badge tone="neutral">{menu.items.length} items</Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(menu)}><Edit3 size={14} /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(menu.id, menu.nombre)}><Trash2 size={14} className="text-danger" /></Button>
                </div>
              </div>

              {editing === menu.id ? (
                <div className="space-y-3">
                  <Input value={editNombre} onChange={e => setEditNombre(e.target.value)} placeholder="Nombre del menú" />
                  <div className="space-y-2">
                    {editItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-surface-alt rounded-md">
                        <GripVertical size={14} className="text-text-muted flex-shrink-0" />
                        <Input value={item.label} onChange={e => updateItem(i, 'label', e.target.value)} placeholder="Etiqueta" className="flex-1" />
                        <Input value={item.url || ''} onChange={e => updateItem(i, 'url', e.target.value)} placeholder="/ruta o https://" className="flex-1" />
                        <Button variant="ghost" size="sm" onClick={() => removeItem(i)}><Trash2 size={12} className="text-danger" /></Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={addItem}><Plus size={12} /> Añadir item</Button>
                    <Button variant="primary" size="sm" onClick={handleSave} loading={saving}><Save size={12} /> Guardar</Button>
                    <Button variant="ghost" size="sm" onClick={cancelEdit}><X size={12} /> Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {menu.items.length === 0 ? (
                    <p className="text-xs text-text-muted italic">Sin items</p>
                  ) : (
                    menu.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs py-1 border-b border-border last:border-0">
                        <span className="font-medium text-text">{item.label}</span>
                        {item.url && <span className="text-text-muted">{item.url}</span>}
                        {item.target === '_blank' && <Badge tone="info">nueva pestaña</Badge>}
                        {item.children && item.children.length > 0 && (
                          <Badge tone="neutral">{item.children.length} subitems</Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
