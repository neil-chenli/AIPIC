import { MapPin } from "lucide-react";

export default function MapPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">地图视图</h2>
            <p className="text-sm text-muted-foreground mt-1">
              在地图上查看照片分布
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 relative bg-accent/20">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">地图功能开发中</h3>
            <p className="text-muted-foreground">
              将集成 Leaflet 地图显示带有地理位置的照片
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
