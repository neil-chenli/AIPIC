import { Link, useLocation } from "react-router-dom";
import { Image, FolderOpen, Map, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "照片库", icon: Image },
  { path: "/albums", label: "相册", icon: FolderOpen },
  { path: "/map", label: "地图", icon: Map },
  { path: "/faces", label: "人物", icon: Users },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-60 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Image className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AIPIC
            </h1>
            <p className="text-xs text-muted-foreground">智能照片管理</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                "hover:bg-accent hover:translate-x-1",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="bg-accent rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-2">存储空间</div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-2xl font-bold">2.4</span>
            <span className="text-sm text-muted-foreground mb-1">/ 100 GB</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-secondary w-[24%]" />
          </div>
        </div>
      </div>
    </aside>
  );
}
