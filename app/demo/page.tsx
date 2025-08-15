import { LineChartDemo } from "@/components/demo/line-chart";
import { BarChartDemo } from "@/components/demo/bar-chart";
import { PieChartDemo } from "@/components/demo/pie-chart";
import { AreaChartDemo } from "@/components/demo/area-chart";

export default function DemoPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="w-full h-[400px] p-4 rounded-lg">
          <LineChartDemo />
        </div>
        <div className="w-full h-[400px] p-4 rounded-lg">
          <BarChartDemo />
        </div>
        <div className="w-full h-[400px] p-4 rounded-lg">
          <PieChartDemo />
        </div>
        <div className="w-full h-[400px] p-4 rounded-lg">
          <AreaChartDemo />
        </div>
      </div>
    </div>
  );
}
