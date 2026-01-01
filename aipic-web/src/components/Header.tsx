import { Search, Moon, Sun, Upload } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 right-0 left-60 h-16 bg-card/80 backdrop-blur-md border-b border-border z-10">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索照片、相册、人物..."
              className={cn(
                "w-full pl-10 pr-4 py-2 bg-accent/50 border border-border rounded-lg",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                "transition-all duration-200"
              )}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 ml-6">
          <button
            className={cn(
              "p-2 rounded-lg hover:bg-accent transition-all duration-200",
              "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            <Upload className="w-5 h-5" />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-accent transition-all duration-200"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
            <span className="text-sm font-medium text-white">U</span>
          </div>
        </div>
      </div>
    </header>
  );
}
