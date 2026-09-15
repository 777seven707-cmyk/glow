import { useCountUp } from '../hooks/useCountUp'

export default function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const { ref, value } = useCountUp(to)
  return (
    <span ref={ref} className="tabular-nums">
      {value}
      {suffix}
    </span>
  )
}
