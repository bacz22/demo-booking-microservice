import { useState, useMemo } from 'react'
import { Maximize2, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface QrCodeDisplayProps {
  /** Giá trị chuỗi mã hóa (thường là bookingCode hoặc URL xác thực) */
  value: string
  /** Kích thước hiển thị (pixels) */
  size?: number
  /** Có cho phép bấm phóng to toàn màn hình không */
  allowZoom?: boolean
  /** Nhãn chú thích hiển thị dưới mã QR */
  caption?: string
  className?: string
}

/**
 * Tạo ma trận QR Code 25x25 chân thực dựa trên seed string
 */
function generateQrMatrix(seed: string): boolean[][] {
  const size = 25
  const matrix: boolean[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(false))

  // 1. Finder Pattern Helper (vẽ ô vuông góc 7x7)
  const drawFinder = (startRow: number, startCol: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startRow + r][startCol + c] = true
        }
      }
    }
  }

  // Vẽ 3 ô vuông định vị (Top-Left, Top-Right, Bottom-Left)
  drawFinder(0, 0)
  drawFinder(0, size - 7)
  drawFinder(size - 7, 0)

  // Timing patterns (đường kẻ nối các ô định vị)
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0
    matrix[i][6] = i % 2 === 0
  }

  // Alignment pattern ở góc dưới bên phải (khoảng vị trí 18, 18)
  const drawAlignment = (r0: number, c0: number) => {
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        if (
          Math.abs(r) === 2 ||
          Math.abs(c) === 2 ||
          (r === 0 && c === 0)
        ) {
          matrix[r0 + r][c0 + c] = true
        }
      }
    }
  }
  drawAlignment(18, 18)

  // 2. Điền các module dữ liệu ngẫu nhiên có kiểm soát dựa trên hash chuỗi seed
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }

  const isReserved = (r: number, c: number) => {
    // Top-left finder + separator
    if (r < 8 && c < 8) return true
    // Top-right finder + separator
    if (r < 8 && c >= size - 8) return true
    // Bottom-left finder + separator
    if (r >= size - 8 && c < 8) return true
    // Timing patterns
    if (r === 6 || c === 6) return true
    // Alignment pattern
    if (r >= 16 && r <= 20 && c >= 16 && c <= 20) return true
    // Center logo cutout
    if (r >= 10 && r <= 14 && c >= 10 && c <= 14) return true
    return false
  }

  let pseudoState = Math.abs(hash) || 1234567
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isReserved(r, c)) {
        pseudoState = (pseudoState * 1664525 + 1013904223) % 4294967296
        matrix[r][c] = (pseudoState % 100) < 52
      }
    }
  }

  return matrix
}

/**
 * Tạo danh sách vị trí và độ rộng các vạch Barcode SVG giả lập chuẩn Code 128
 */
function generateBarcodeLayout(code: string): { x: number; width: number; key: number }[] {
  let hash = 0
  for (let i = 0; i < code.length; i++) {
    hash = (hash << 5) - hash + code.charCodeAt(i)
    hash |= 0
  }
  let state = Math.abs(hash) || 9876543
  const bars: number[] = [2, 1, 1, 2] // Start code
  for (let i = 0; i < 28; i++) {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    bars.push((state % 3) + 1)
  }
  bars.push(2, 1, 1, 2, 2) // Stop code

  let currentX = 2
  const layout: { x: number; width: number; key: number }[] = []
  for (let i = 0; i < bars.length; i++) {
    const width = bars[i]
    layout.push({ x: currentX, width: width * 1.5, key: i })
    currentX += width * 1.8 + 1.2
  }
  return layout
}

export function QrCodeDisplay({
  value,
  size = 180,
  allowZoom = true,
  caption = 'Quét mã này tại cổng soát vé',
  className,
}: QrCodeDisplayProps) {
  const [isZoomed, setIsZoomed] = useState(false)

  const matrix = useMemo(() => generateQrMatrix(value), [value])
  const barcodeLayout = useMemo(() => generateBarcodeLayout(value), [value])

  const matrixSize = matrix.length
  const cellSize = 100 / matrixSize

  return (
    <>
      <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
        {/* Khối chứa QR Code với hiệu ứng viền phát sáng nhẹ */}
        <div
          onClick={() => allowZoom && setIsZoomed(true)}
          className={cn(
            'group relative flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white p-3 shadow-xl transition-all duration-200',
            allowZoom && 'cursor-pointer hover:shadow-primary/20 hover:scale-[1.02]'
          )}
          style={{ width: size, height: size }}
          title={allowZoom ? 'Bấm để phóng to mã QR' : undefined}
          role={allowZoom ? 'button' : undefined}
          tabIndex={allowZoom ? 0 : undefined}
          onKeyDown={(e) => {
            if (allowZoom && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              setIsZoomed(true)
            }
          }}
        >
          {/* SVG QR Code */}
          <svg
            viewBox="0 0 100 100"
            className="h-full w-full shape-rendering-crispEdges"
            aria-label={`Mã QR vé: ${value}`}
          >
            {matrix.map((row, rIdx) =>
              row.map((isDark, cIdx) => {
                if (!isDark) return null
                return (
                  <rect
                    key={`${rIdx}-${cIdx}`}
                    x={cIdx * cellSize}
                    y={rIdx * cellSize}
                    width={cellSize}
                    height={cellSize}
                    fill="#0a0a0a"
                  />
                )
              })
            )}

            {/* Logo CineBook trung tâm */}
            <rect
              x={38}
              y={38}
              width={24}
              height={24}
              rx={4}
              fill="#ffffff"
            />
            <rect
              x={40}
              y={40}
              width={20}
              height={20}
              rx={3}
              fill="#e11d48"
            />
            <text
              x={50}
              y={54}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="9"
              fontWeight="900"
              fontFamily="system-ui, sans-serif"
            >
              CB
            </text>
          </svg>

          {/* Nút phóng to hover overlay */}
          {allowZoom && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
              <div className="flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-[11px] font-bold text-foreground shadow-md">
                <Maximize2 className="h-3.5 w-3.5 text-primary" />
                <span>Phóng to</span>
              </div>
            </div>
          )}
        </div>

        {/* Mã vạch Barcode bên dưới */}
        <div className="w-full max-w-[200px] flex flex-col items-center gap-1">
          <svg
            viewBox="0 0 100 24"
            className="w-full h-7 text-foreground/80 opacity-90"
            aria-hidden="true"
          >
            {barcodeLayout.map((bar) => (
              <rect
                key={bar.key}
                x={bar.x}
                y={0}
                width={bar.width}
                height={24}
                fill="currentColor"
              />
            ))}
          </svg>
          <span className="font-mono text-[11px] font-bold tracking-widest text-muted-foreground">
            {value}
          </span>
        </div>

        {/* Chú thích */}
        {caption && (
          <p className="text-center text-[11px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary shrink-0" aria-hidden="true" />
            <span>{caption}</span>
          </p>
        )}
      </div>

      {/* MODAL PHÓNG TO QR CODE (cho phép nhân viên rạp quét dễ dàng) */}
      {isZoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Phóng to mã QR vé"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="relative flex flex-col items-center rounded-3xl border border-border/80 bg-card p-6 sm:p-8 text-card-foreground shadow-2xl max-w-sm w-full space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nút đóng */}
            <button
              type="button"
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-1 pt-1">
              <h3 className="text-lg font-bold text-foreground">Mã QR Soát Vé</h3>
              <p className="text-xs text-muted-foreground">
                Tăng độ sáng màn hình và đưa mã này cho nhân viên rạp
              </p>
            </div>

            {/* QR Code lớn với nền trắng tương phản cao */}
            <div className="rounded-2xl bg-white p-5 shadow-2xl w-64 h-64 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="h-full w-full shape-rendering-crispEdges">
                {matrix.map((row, rIdx) =>
                  row.map((isDark, cIdx) => {
                    if (!isDark) return null
                    return (
                      <rect
                        key={`big-${rIdx}-${cIdx}`}
                        x={cIdx * cellSize}
                        y={rIdx * cellSize}
                        width={cellSize}
                        height={cellSize}
                        fill="#0a0a0a"
                      />
                    )
                  })
                )}
                {/* Logo trung tâm */}
                <rect x={38} y={38} width={24} height={24} rx={4} fill="#ffffff" />
                <rect x={40} y={40} width={20} height={20} rx={3} fill="#e11d48" />
                <text
                  x={50}
                  y={54}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9"
                  fontWeight="900"
                  fontFamily="system-ui, sans-serif"
                >
                  CB
                </text>
              </svg>
            </div>

            {/* Mã đặt vé */}
            <div className="flex flex-col items-center">
              <span className="text-[11px] text-muted-foreground">Mã vé điện tử</span>
              <span className="font-mono text-xl font-black text-primary tracking-widest">
                {value}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsZoomed(false)}
              className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Xong
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default QrCodeDisplay
