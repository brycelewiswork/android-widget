import { CY, joinPath } from "./track"
import { TRACK } from "./model"

/** The whole track: start bulge + join, the bar, end join + bulge. Fill it from the parent. */
export function TrackShape({ startX, endX }: { startX: number; endX: number }) {
  return (
    <>
      <circle cx={startX} cy={CY} r={TRACK.r} />
      <path d={joinPath(startX, 1)} />
      <rect x={startX} y={TRACK.barTop} width={endX - startX} height={TRACK.barHeight} />
      <path d={joinPath(endX, -1)} />
      <circle cx={endX} cy={CY} r={TRACK.r} />
    </>
  )
}
