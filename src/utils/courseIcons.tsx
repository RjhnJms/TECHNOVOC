import {
  Car,
  Leaf,
  Sparkles,
  Hammer,
  Scissors,
  Ruler,
  Zap,
  Cpu,
  CookingPot,
  Monitor,
  Flame,
  BookOpen,
  type LucideProps,
} from "lucide-react"
import type { ComponentType } from "react"

/**
 * Maps a course name to an icon + color pair using keyword matching.
 * Designed for TECHNO-VOC vocational tracks. Falls back to BookOpen for unknown courses.
 */
interface CourseIconConfig {
  icon: ComponentType<LucideProps>
  /** Accent color for the icon itself */
  color: string
  /** Soft background circle color */
  bg: string
}

const COURSE_ICON_MAP: { keywords: string[]; config: CourseIconConfig }[] = [
  {
    keywords: ["automotive", "auto", "car", "vehicle", "mechanic"],
    config: { icon: Car, color: "#1f2937", bg: "#f3f4f6" },
  },
  {
    keywords: ["agriculture", "agri", "farming", "crop", "plant"],
    config: { icon: Leaf, color: "#1f2937", bg: "#f3f4f6" },
  },
  {
    keywords: ["beauty", "cosmetology", "nail", "salon", "hairdress"],
    config: { icon: Sparkles, color: "#1f2937", bg: "#f3f4f6" },
  },
  {
    keywords: ["carpentry", "carpenter", "wood", "cabinet"],
    config: { icon: Hammer, color: "#1f2937", bg: "#f3f4f6" },
  },
  {
    keywords: ["dressmaking", "tailoring", "sewing", "garment", "fashion"],
    config: { icon: Scissors, color: "#1f2937", bg: "#f3f4f6" },
  },
  {
    keywords: ["drafting", "draft", "technical drawing", "cad"],
    config: { icon: Ruler, color: "#1f2937", bg: "#f3f4f6" },
  },
  {
    keywords: ["electricity", "electrical", "wiring"],
    config: { icon: Zap, color: "#1f2937", bg: "#f3f4f6" },
  },
  {
    keywords: ["electronics", "electronic", "circuit"],
    config: { icon: Cpu, color: "#1f2937", bg: "#f3f4f6" },
  },
  {
    keywords: ["food", "cookery", "culinary", "baking", "bread", "pastry"],
    config: { icon: CookingPot, color: "#1f2937", bg: "#f3f4f6" },
  },
  {
    keywords: ["ict", "computer", "programming", "web", "software", "it"],
    config: { icon: Monitor, color: "#1f2937", bg: "#f3f4f6" },
  },
  {
    keywords: ["smaw", "welding", "weld", "metal", "fabrication"],
    config: { icon: Flame, color: "#1f2937", bg: "#f3f4f6" },
  },
]

const DEFAULT_CONFIG: CourseIconConfig = {
  icon: BookOpen,
  color: "#1f2937",
  bg: "#f3f4f6",
}

export function getCourseIconConfig(courseName: string): CourseIconConfig {
  const lower = courseName.toLowerCase()
  for (const entry of COURSE_ICON_MAP) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      return entry.config
    }
  }
  return DEFAULT_CONFIG
}

/**
 * Render a course icon inside a soft colored circle.
 * Use `size` to control the icon size; the circle auto-scales.
 */
export function CourseIcon({
  courseName,
  size = 18,
  circleSize,
  style,
}: {
  courseName: string
  size?: number
  /** Explicit circle diameter; defaults to size * 2 */
  circleSize?: number
  style?: React.CSSProperties
}) {
  const config = getCourseIconConfig(courseName)
  const IconComponent = config.icon
  const cs = circleSize ?? size * 2

  return (
    <div
      style={{
        width: `${cs}px`,
        height: `${cs}px`,
        borderRadius: "50%",
        backgroundColor: config.bg,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        ...style,
      }}
    >
      <IconComponent size={size} color={config.color} strokeWidth={2} />
    </div>
  )
}
