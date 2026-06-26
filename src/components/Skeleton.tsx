/**
 * Reusable skeleton loading primitives.
 *
 * Usage:
 *   <Skeleton width={120} height={20} />              – single bar
 *   <SkeletonLine />                                   – full-width text line
 *   <SkeletonCircle size={40} />                       – avatar / icon circle
 *   <SkeletonCard />                                   – stat card placeholder
 *   <SkeletonTableRows columns={5} rows={6} />        – table body placeholder
 */

/** Base skeleton bar */
export function Skeleton({
  width,
  height = 16,
  borderRadius = 6,
  style,
}: {
  width?: number | string
  height?: number | string
  borderRadius?: number | string
  style?: React.CSSProperties
}) {
  return (
    <div
      className="skeleton-pulse"
      style={{
        width: width ?? "100%",
        height,
        borderRadius,
        backgroundColor: "#e5e7eb",
        ...style,
      }}
    />
  )
}

/** Circular skeleton (icons / avatars) */
export function SkeletonCircle({
  size = 40,
  style,
}: {
  size?: number
  style?: React.CSSProperties
}) {
  return (
    <div
      className="skeleton-pulse"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: "#e5e7eb",
        flexShrink: 0,
        ...style,
      }}
    />
  )
}

/** Single text line with random-ish width */
export function SkeletonLine({
  width,
  height = 14,
  style,
}: {
  width?: number | string
  height?: number | string
  style?: React.CSSProperties
}) {
  return <Skeleton width={width ?? "100%"} height={height} style={style} />
}

/** Skeleton stat card — matches the OverviewTab stat card layout */
export function SkeletonStatCard({
  style,
}: {
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        backgroundColor: "#f9fafb",
        borderRadius: "14px",
        padding: "20px",
        border: "1px solid #f3f4f6",
        ...style,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <Skeleton width={100} height={14} />
        <SkeletonCircle size={28} />
      </div>
      <Skeleton width={60} height={30} borderRadius={8} style={{ marginBottom: 6 }} />
      <Skeleton width={120} height={12} />
    </div>
  )
}

/** Skeleton stat card — horizontal layout (matches second row of OverviewTab) */
export function SkeletonStatCardHorizontal({
  style,
}: {
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "20px",
        border: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        ...style,
      }}
    >
      <Skeleton width={48} height={48} borderRadius={12} />
      <div style={{ flex: 1 }}>
        <Skeleton width={100} height={13} style={{ marginBottom: 6 }} />
        <Skeleton width={50} height={24} borderRadius={8} />
      </div>
    </div>
  )
}

/** Skeleton table rows */
export function SkeletonTableRows({
  columns = 5,
  rows = 5,
}: {
  columns?: number
  rows?: number
}) {
  const colWidths = Array.from({ length: columns }, (_, i) =>
    i === 0 ? "40%" : `${Math.floor(50 / (columns - 1))}%`
  )

  return (
    <>
      {Array.from({ length: rows }, (_, ri) => (
        <tr
          key={ri}
          style={{
            borderBottom: "1px solid #f3f4f6",
            backgroundColor: ri % 2 === 0 ? "white" : "#f9fafb",
          }}
        >
          {Array.from({ length: columns }, (_, ci) => (
            <td key={ci} style={{ padding: "14px 12px" }}>
              <Skeleton
                width={colWidths[ci]}
                height={14}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

/** Skeleton for a course list / preference cards grid */
export function SkeletonCourseCards({ count = 8 }: { count?: number }) {
  return (
    <div className="courses-grid">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          style={{
            padding: "14px 16px",
            borderRadius: "10px",
            border: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SkeletonCircle size={36} />
            <Skeleton width={90 + (i % 3) * 20} height={14} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Skeleton for the student results page */
export function SkeletonResultsPage() {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* Banner */}
      <div style={{
        backgroundColor: "#f9fafb",
        borderRadius: "16px",
        padding: "28px 32px",
        marginBottom: "24px",
        border: "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 20,
      }}>
        <div style={{ flex: 1 }}>
          <Skeleton width={200} height={24} style={{ marginBottom: 10 }} />
          <Skeleton width={260} height={14} style={{ marginBottom: 6 }} />
          <Skeleton width={140} height={12} />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              backgroundColor: "white",
              borderRadius: 12,
              padding: "14px 20px",
              minWidth: 80,
              textAlign: "center",
              border: "1px solid #e5e7eb",
            }}>
              <Skeleton width={40} height={26} style={{ margin: "0 auto 4px" }} />
              <Skeleton width={50} height={11} style={{ margin: "0 auto" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Course cards */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "24px",
        border: "1px solid #e5e7eb",
      }}>
        <Skeleton width={240} height={17} style={{ marginBottom: 8 }} />
        <Skeleton width={360} height={13} style={{ marginBottom: 20 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 18,
              borderRadius: 12,
              backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb",
            }}>
              <Skeleton width={32} height={20} />
              <SkeletonCircle size={32} />
              <div style={{ flex: 1 }}>
                <Skeleton width={140 + i * 30} height={16} style={{ marginBottom: 6 }} />
                <Skeleton width={80} height={14} style={{ marginBottom: 6 }} />
                <Skeleton width={100} height={12} borderRadius={20} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Skeleton for the student detail modal body */
export function SkeletonStudentDetail() {
  return (
    <div style={{ padding: "8px 0" }}>
      {/* Status banner */}
      <Skeleton width="100%" height={80} borderRadius={12} style={{ marginBottom: 20 }} />

      {/* Preferred course cards */}
      <Skeleton width={180} height={16} style={{ marginBottom: 12 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 16px",
            borderRadius: 10,
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <SkeletonCircle size={28} />
              <div>
                <Skeleton width={140 + i * 20} height={14} style={{ marginBottom: 4 }} />
                <Skeleton width={90} height={11} />
              </div>
            </div>
            <Skeleton width={60} height={20} borderRadius={12} />
          </div>
        ))}
      </div>

      {/* Score table */}
      <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 18 }}>
        <Skeleton width={220} height={16} style={{ marginBottom: 6 }} />
        <Skeleton width={300} height={13} style={{ marginBottom: 14 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{
              display: "flex",
              gap: 16,
              padding: "10px 12px",
              backgroundColor: i % 2 === 0 ? "white" : "#f9fafb",
            }}>
              <Skeleton width="40%" height={14} />
              <Skeleton width="20%" height={14} />
              <Skeleton width={60} height={14} borderRadius={20} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
