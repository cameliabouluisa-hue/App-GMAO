'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ElementType } from 'react';
import {
  BarChart3,
  Box,
  ChevronDown,
  Gauge,
  Package,
  Wrench,
  X,
} from 'lucide-react';

type MenuItem = {
  label: string;
  href: string;
};

type MenuModule = {
  label: string;
  href?: string;
  icon: ElementType;
  submenu?: MenuItem[];
};

const menuStructure: MenuModule[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: Gauge,
  },
  {
    label: 'Équipements',
    href: '/materiels',
    icon: Wrench,
    submenu: [
      { label: 'Parc Dequipement' , href: '/arborescences' },
      { label: 'Familles', href: '/familles' },
      { label: 'Modèles', href: '/modeles' },
      { label: 'Matériels', href: '/materiels' },
      {label: 'Points de structure', href: '/points-structure',
}
    ],
  },
  {
    label: 'Maintenance',
    href: '/maintenance',
    icon: BarChart3,
    submenu: [
      { label: 'Saisie une DI ', href: '/maintenance/demandes' },
      { label: 'Interventions', href: '/maintenance/interventions' },
      { label: 'Plan Préventif', href: '/plans-preventifs' },
      { label: 'Plan Préventif Prédéfinis', href: '/plans-preventifs-predefinis' },
      { label: 'Gammes', href: '/gammes' },
    ],
  },
  {
    label: 'Stock',
    href: '/stock/menu',
    icon: Package,
    submenu: [
      { label: 'Articles', href: '/articles' },
      { label: 'Entrées ', href: '/stock/entrees' },
      { label: 'Historique des mouvements', href: '/stock/mouvements' },
      { label: 'Unités articles', href: '/unites-articles' },
      { label: 'Magasins', href: '/magasins' },
      { label: 'Inventaires préparés', href: '/stock/inventaires-prepares' },
      { label: 'Inventaire', href: '/stock/inventaire' },
      { label: 'Sortie', href: '/stock/sorties' },
      { label: 'Réservations', href: '/stock/reservations' },
      { label: 'Demandes de transfert',   href: '/stock/demandes-transfert'},
      { label: 'Réapprovisionnement', href: '/stock/reapprovisionnement' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    '/stock/menu': pathname.startsWith('/stock') || pathname.startsWith('/articles'),
    '/materiels':
      pathname.startsWith('/materiels') ||
      pathname.startsWith('/familles') ||
      pathname.startsWith('/modeles') ||
      pathname.startsWith('/arborescences'),
    '/maintenance': pathname.startsWith('/maintenance'),
  });

  const toggleModule = (key: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isModuleActive = (module: MenuModule) => {
    if (module.href && pathname === module.href) return true;

    return module.submenu?.some((item) => pathname === item.href) ?? false;
  };

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[292px] shrink-0 overflow-hidden bg-[#0f3d56] text-white shadow-2xl lg:flex lg:flex-col">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(129,195,215,0.28),transparent_35%),linear-gradient(180deg,#0f3d56_0%,#0b2f43_55%,#081f2d_100%)]" />

      <div className="relative flex h-full flex-col">
        {/* HEADER */}
        <div className="shrink-0 border-b border-white/10 px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-gradient-to-br from-white/90 to-[#1f5678] text-xl font-bold text-white shadow-[0_0_24px_rgba(129,195,215,0.45)]">
                GM
              </div>

              <div>
                <h1 className="text-xl font-bold leading-tight text-white">
                  GMAO
                </h1>
                <p className="text-sm font-medium text-white/55">
                  Portuaire
                </p>
              </div>
            </div>

            <button
              type="button"
              className="rounded-xl p-2 text-white/65 transition hover:bg-white/10 hover:text-white"
            >
              <X size={21} />
            </button>
          </div>
        </div>

        {/* MENU */}
        <nav className="relative flex-1 overflow-y-auto px-4 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-2.5">
            {menuStructure.map((module) => {
              const Icon = module.icon;
              const active = isModuleActive(module);
              const hasSubmenu = !!module.submenu?.length;
              const key = module.href || module.label;
              const expanded = expandedModules[key];

              return (
                <div key={module.label}>
                  <div className="flex items-center gap-2">
                    {module.href ? (
                      <Link
                        href={module.href}
                        className={`group flex h-[52px] flex-1 items-center gap-3.5 rounded-[18px] px-4 text-[14px] font-bold transition ${
                          active
                            ? 'bg-white/95 text-[#0f3d56] shadow-[0_10px_30px_rgba(129,195,215,0.25)]'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon
                          size={22}
                          strokeWidth={2.2}
                          className={active ? 'text-[#0f3d56]' : 'text-white/70'}
                        />
                        <span>{module.label}</span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleModule(key)}
                        className={`group flex h-[52px] flex-1 items-center gap-3.5 rounded-[18px] px-4 text-left text-[14px] font-bold transition ${
                          active
                            ? 'bg-white/95 text-[#0f3d56] shadow-[0_10px_30px_rgba(129,195,215,0.25)]'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon
                          size={22}
                          strokeWidth={2.2}
                          className={active ? 'text-[#0f3d56]' : 'text-white/70'}
                        />
                        <span>{module.label}</span>
                      </button>
                    )}

                    {hasSubmenu && (
                      <button
                        type="button"
                        onClick={() => toggleModule(key)}
                        className={`flex h-[44px] w-[44px] items-center justify-center rounded-2xl transition ${
                          active
                            ? 'bg-white/15 text-white'
                            : 'text-white/55 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <ChevronDown
                          size={19}
                          className={`transition ${expanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                    )}
                  </div>

                  {hasSubmenu && expanded && (
                    <div className="ml-7 mt-2.5 border-l-2 border-white/20 pb-1 pl-5">
                      <div className="space-y-1">
                        {module.submenu?.map((item) => {
                          const subActive = pathname === item.href;

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={`block rounded-xl px-3 py-2 text-[13px] font-medium transition ${
                                subActive
                                  ? 'bg-white/15 text-white'
                                  : 'text-white/50 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* FOOTER */}
        <div className="relative shrink-0 border-t border-white/10 bg-[#081f2d]/80 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10">
              <Box size={18} className="text-[#81C3D7]" />
            </div>

            <div>
              <p className="text-[13px] font-bold text-white">GMAO v1.0.0</p>
              <p className="mt-0.5 text-[11px] font-medium text-white/40">
                © 2025 Maintenance
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}