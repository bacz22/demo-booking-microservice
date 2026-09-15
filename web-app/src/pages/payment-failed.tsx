import { useMemo, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import {
  XCircle,
  RotateCcw,
  ArrowLeft,
  AlertTriangle,
  HelpCircle,
  ReceiptText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { toast } from '@/lib/toast'

export default function PaymentFailedPage() {
  const location = useLocation()
  const navigate = useNavigate()


  // 1. Dữ liệu lỗi: lấy từ location.state nếu có, hoặc dùng fallback mặc định
  const data = useMemo(() => {
    const s = location.state
    return {
      bookingCode: s?.bookingCode as string | undefined,
      message:
        (s?.message as string) ||
        'Giao dịch thanh toán không thành công do phiên giao dịch hết hạn, tài khoản không đủ số dư hoặc yêu cầu bị hủy bỏ bởi người dùng.',
      reason: (s?.reason as string) || 'Giao dịch chưa hoàn tất',
      total: s?.total as number | undefined,
    }
  }, [location.state])

  // Cập nhật tiêu đề trang và hiển thị thông báo lỗi thanh toán
  useEffect(() => {
    document.title = 'Thanh toán thất bại | CineBook'
    toast.paymentError(data.message)
  }, [data.message])



  // Xử lý nút Thử lại: quay lại trang Checkout hoặc chọn lại
  const handleRetry = () => {
    navigate(-1)
  }

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-12">
      {/* 1. Header cảnh báo thất bại */}
      <div className="text-center space-y-3 sm:space-y-4">
        <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-destructive/15 border border-destructive/30 text-destructive shadow-lg shadow-destructive/10 animate-in zoom-in-95 duration-200">
          <XCircle className="h-10 w-10 sm:h-12 sm:w-12 stroke-[2.2]" aria-hidden="true" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Thanh toán thất bại
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            {data.message}
          </p>
        </div>
      </div>

      {/* 2. Khối thông tin chi tiết & Hướng dẫn xử lý */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-border/60 bg-card/90 shadow-2xl backdrop-blur-md">
        {/* Mã đặt vé (Optional nếu có) */}
        {data.bookingCode && (
          <div className="bg-secondary/40 p-4 sm:p-5 border-b border-border/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ReceiptText className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mã tham chiếu đơn hàng:
              </span>
              <span className="font-mono text-sm sm:text-base font-bold text-foreground">
                {data.bookingCode}
              </span>
            </div>

            <CopyButton
              text={data.bookingCode}
              title="Sao chép mã tham chiếu"
              size="sm"
            />
          </div>
        )}

        {/* Gợi ý nguyên nhân & Cách khắc phục */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
              Các nguyên nhân phổ biến:
            </span>
            <ul className="list-disc list-inside text-xs sm:text-sm text-muted-foreground space-y-1.5 pl-1 leading-relaxed">
              <li>Tài khoản hoặc thẻ thanh toán không đủ số dư để thực hiện giao dịch.</li>
              <li>Hết thời gian chờ nhập mã OTP xác thực ngân hàng.</li>
              <li>Bạn đã bấm hủy thanh toán trên cổng VNPay hoặc Ví MoMo.</li>
              <li>Thông tin thẻ ngân hàng hoặc ngày hết hạn nhập chưa chính xác.</li>
            </ul>
          </div>

          {/* Thông tin hỗ trợ khách hàng nếu bị trừ tiền */}
          <div className="rounded-xl border border-border/50 bg-secondary/30 p-3.5 text-xs text-muted-foreground flex items-start gap-2.5">
            <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Nếu tài khoản của bạn đã bị trừ tiền nhưng giao dịch báo thất bại, vui lòng liên hệ hotline{' '}
              <strong className="text-foreground">1900 6868</strong> hoặc email{' '}
              <strong className="text-foreground">support@cinebook.vn</strong> để được hỗ trợ kiểm tra và hoàn tiền nhanh nhất.
            </span>
          </div>
        </div>
      </div>

      {/* 3. Các nút hành động: "Thử lại" & "Quay lại" theo đặc tả */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
        {/* Nút Thử lại */}
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={handleRetry}
          className="w-full sm:w-auto font-bold px-8 shadow-lg shadow-primary/20"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>Thử lại</span>
        </Button>

        {/* Nút Quay lại */}
        <Button
          asChild
          variant="outline"
          size="lg"
          className="w-full sm:w-auto font-semibold px-8 border-border/60 hover:bg-secondary/80"
        >
          <Link to="/movies">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Quay lại</span>
          </Link>
        </Button>
      </div>
    </div>
  )
}
