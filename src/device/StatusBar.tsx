import wifi from "@/assets/status/wifi.svg"
import signal from "@/assets/status/signal.svg"
import battery from "@/assets/status/battery.svg"
import cameraCutout from "@/assets/status/camera-cutout.svg"
import { MaskIcon } from "./MaskIcon"

// Ported from ../android-nav (src/sketch/StatusBar.tsx).
// Figma "Status Bar / Android" (Android-Nav 258:100): 52 tall, 24/10 padding,
// Roboto Medium 14/20, +0.14 tracking, content/primary.
export function StatusBar({ background = "transparent", color }: { background?: string; color?: string }) {
  return (
    <div className="absolute inset-x-0 top-0 z-20 flex h-[52px] items-end justify-between px-[24px] py-[10px] font-roboto text-(--p-content) transition-[background-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ background, color }}>
      <p className="text-[14px] font-medium leading-[20px] tracking-[0.14px]">9:30</p>
      <div className="relative h-[17px] w-[46px]">
        <MaskIcon src={wifi} width={17} className="absolute left-0 top-0" />
        <MaskIcon src={signal} width={17} className="absolute left-[16px] top-0" />
        <MaskIcon src={battery} width={8} height={15} className="absolute left-[38px] top-px" />
      </div>
      <img src={cameraCutout} alt="" className="absolute left-1/2 top-[18px] size-[24px] -translate-x-1/2" />
    </div>
  )
}
