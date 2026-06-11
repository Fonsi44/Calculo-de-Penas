'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, FileText, MessageSquare, Settings, User, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface AdminStats {
  usuarios: number;
  posts: number;
  postsPublicados: number;
  faqs: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({ usuarios: 0, posts: 0, postsPublicados: 0, faqs: 0 });

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/usuarios?limit=1').then(r => r.json()),
      fetch('/api/admin/blog?limit=1').then(r => r.json()),
      fetch('/api/admin/blog?published=true&limit=1').then(r => r.json()),
      fetch('/api/admin/faq').then(r => r.json()),
    ]).then(([users, posts, pubPosts, faqs]) => {
      setStats({
        usuarios: users.total ?? 0,
        posts: posts.total ?? 0,
        postsPublicados: pubPosts.total ?? 0,
        faqs: faqs.faqs?.length ?? 0,
      });
    }).catch(console.warn);
  }, []);

  const modules = [
    { label: 'Usuarios', desc: 'Gestionar cuentas y roles', href: '/intranet/admin/usuarios', icon: Users, stat: stats.usuarios, statLabel: 'usuarios' },
    { label: 'Blog', desc: 'Crear y editar artículos', href: '/intranet/admin/blog', icon: FileText, stat: stats.postsPublicados, statLabel: 'publicados' },
    { label: 'FAQ', desc: 'Preguntas frecuentes', href: '/intranet/admin/faq', icon: MessageSquare, stat: stats.faqs, statLabel: 'entradas' },
    { label: 'Configuración', desc: 'Datos del sitio', href: '/intranet/admin/config', icon: Settings },
    { label: 'Perfil', desc: 'Cambiar contraseña', href: '/intranet/admin/perfil', icon: User },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-primary">Panel de Administración</h1>
        <p className="text-xs text-text-secondary mt-1">
          Gestión centralizada de usuarios, contenido y configuración del sitio
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {modules.map((mod) => (
          <Link key={mod.href} href={mod.href}>
            <Card padding="md" className="hover:shadow-md hover:border-accent/50 transition-all cursor-pointer h-full">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0">
                  <mod.icon size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-sm text-primary">{mod.label}</h2>
                    <ArrowRight size={14} className="text-text-muted" />
                  </div>
                  <p className="text-xxs text-text-secondary mt-0.5">{mod.desc}</p>
                  {mod.stat !== undefined && (
                    <p className="text-xs font-semibold text-accent-dark mt-1.5">
                      {mod.stat} {mod.statLabel}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
