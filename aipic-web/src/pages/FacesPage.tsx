import { Users } from "lucide-react";

const mockFaces = Array.from({ length: 12 }, (_, i) => ({
  id: `person-${i}`,
  name: i < 6 ? `人物 ${i + 1}` : "未命名",
  photoCount: Math.floor(Math.random() * 200) + 10,
  thumbnails: Array.from({ length: 9 }, (__, j) => 
    `https://images.unsplash.com/photo-${1600000000000 + i * 10000000 + j * 1000000}?w=100&h=100&fit=crop&crop=face`
  ),
}));

export default function FacesPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">人物</h2>
            <p className="text-sm text-muted-foreground mt-1">
              已识别 {mockFaces.length} 个人物
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-3xl font-bold text-primary">{mockFaces.length}</div>
            <div className="text-sm text-muted-foreground mt-1">已识别人数</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-3xl font-bold text-secondary">
              {mockFaces.reduce((sum, p) => sum + p.photoCount, 0)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">人脸照片</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-3xl font-bold text-muted-foreground">
              {mockFaces.filter(p => p.name === "未命名").length}
            </div>
            <div className="text-sm text-muted-foreground mt-1">待标注</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockFaces.map((person) => (
            <div
              key={person.id}
              className="group cursor-pointer rounded-xl bg-card border border-border hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              <div className="p-4">
                <div className="grid grid-cols-3 gap-1 mb-4 rounded-lg overflow-hidden">
                  {person.thumbnails.map((thumb, i) => (
                    <div
                      key={i}
                      className="aspect-square overflow-hidden bg-accent"
                    >
                      <img
                        src={thumb}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {person.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {person.photoCount} 张照片
                    </p>
                  </div>
                  <Users className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
