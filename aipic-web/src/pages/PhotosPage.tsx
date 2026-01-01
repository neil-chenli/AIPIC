import { Grid3x3, List, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const mockPhotos = Array.from({ length: 24 }, (_, i) => ({
  id: `photo-${i}`,
  url: `https://images.unsplash.com/photo-${1500000000000 + i * 100000000}?w=400&h=400&fit=crop`,
  title: `照片 ${i + 1}`,
  date: new Date(2024, 0, i + 1),
  location: i % 3 === 0 ? "北京" : i % 3 === 1 ? "上海" : null,
}));

export default function PhotosPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">照片库</h2>
            <p className="text-sm text-muted-foreground mt-1">
              共 {mockPhotos.length} 张照片
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors">
              <SlidersHorizontal className="w-4 h-4" />
              <span>筛选</span>
            </button>

            <div className="flex gap-1 bg-accent rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded transition-colors",
                  viewMode === "grid"
                    ? "bg-background shadow-sm"
                    : "hover:bg-background/50"
                )}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded transition-colors",
                  viewMode === "list"
                    ? "bg-background shadow-sm"
                    : "hover:bg-background/50"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            2024年1月
          </h3>
          <div
            className={cn(
              "grid gap-4",
              viewMode === "grid"
                ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
                : "grid-cols-1"
            )}
          >
            {mockPhotos.map((photo) => (
              <div
                key={photo.id}
                className={cn(
                  "group relative rounded-lg overflow-hidden cursor-pointer",
                  "hover:scale-105 hover:shadow-xl transition-all duration-300",
                  viewMode === "grid" ? "aspect-square" : "aspect-video"
                )}
              >
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-sm font-medium">
                      {photo.title}
                    </p>
                    {photo.location && (
                      <p className="text-white/80 text-xs mt-1">
                        {photo.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
