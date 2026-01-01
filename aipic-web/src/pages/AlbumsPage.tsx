import { Plus, FolderOpen } from "lucide-react";

const mockAlbums = [
  {
    id: "1",
    name: "家庭聚会",
    photoCount: 156,
    coverUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=300&fit=crop",
    updatedAt: "2024-01-15",
  },
  {
    id: "2",
    name: "旅行回忆",
    photoCount: 432,
    coverUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=300&fit=crop",
    updatedAt: "2024-01-10",
  },
  {
    id: "3",
    name: "美食记录",
    photoCount: 89,
    coverUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop",
    updatedAt: "2024-01-08",
  },
  {
    id: "4",
    name: "宠物日常",
    photoCount: 234,
    coverUrl: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=300&fit=crop",
    updatedAt: "2024-01-05",
  },
];

export default function AlbumsPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">相册</h2>
            <p className="text-sm text-muted-foreground mt-1">
              共 {mockAlbums.length} 个相册
            </p>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            <span>创建相册</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockAlbums.map((album) => (
            <div
              key={album.id}
              className="group cursor-pointer rounded-xl overflow-hidden bg-card border border-border hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={album.coverUrl}
                  alt={album.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                    {album.name}
                  </h3>
                  <FolderOpen className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{album.photoCount} 张照片</span>
                  <span>{album.updatedAt}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
