import { NavLink, Outlet, useLocation } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { RenderFlashToggle } from "./ui/RenderFlashToggle";

export type PageRoute = {
  path: string;
  group: string;
  label: string;
  description: string;
  element: React.ReactNode;
};

export function Layout({ routes }: { routes: PageRoute[] }) {
  const { pathname } = useLocation();
  const current = routes.find((route) => route.path === pathname);

  // consecutive routes with the same group are shown together
  const groups: Array<[string, PageRoute[]]> = [];
  for (const route of routes) {
    const last = groups.at(-1);
    if (last != null && last[0] === route.group) {
      last[1].push(route);
    } else {
      groups.push([route.group, [route]]);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <header className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-line bg-surface/95 px-4 py-2 backdrop-blur">
        <span className="font-semibold">substate</span>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-1">
          {groups.map(([group, items]) => (
            <div key={group} className="flex items-center gap-1">
              <span className="mr-1 text-muted">{group}</span>
              {items.map((route) => (
                <NavLink
                  key={route.path}
                  to={route.path}
                  end
                  className={({ isActive }) =>
                    twMerge(
                      "rounded px-1.5 text-text hover:bg-white/5",
                      isActive && "bg-accent/15 text-accent",
                    )
                  }
                >
                  {route.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <RenderFlashToggle className="ml-auto" />
      </header>
      {current && <p className="text-muted">{current.description}</p>}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
