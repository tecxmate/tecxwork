import { EVENT_CONFIG } from "@/lib/data";

export const tutorialUiVi = {
  pageTitle: "Hướng dẫn sử dụng nền tảng",
  pageSubtitle: (admin: boolean) =>
    admin
      ? "Hướng dẫn sử dụng TECXWORK dành cho Sinh viên, Nhà tuyển dụng và Quản trị viên."
      : "Hướng dẫn sử dụng TECXWORK dành cho Sinh viên và Nhà tuyển dụng.",
  studentTab: "Hướng dẫn Sinh viên",
  recruiterTab: "Hướng dẫn Nhà tuyển dụng",
  adminTab: "Hướng dẫn Quản trị viên",
};

export function StudentSectionVi() {
  return (
    <section id="student-guide" className="scroll-mt-8">
      <h2 className="text-2xl font-bold border-b pb-2 mb-6">Hướng dẫn Sinh viên</h2>
      <div className="space-y-6 text-sm leading-relaxed">
        <div>
          <h3 className="text-xl font-semibold mb-2">Tổng quan</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Khám phá</strong> các công ty tham gia, vị trí đang tuyển và việc làm bên ngoài từ 1111 Job Bank</li>
            <li><strong>Đăng ký</strong> phỏng vấn vào khung giờ bạn chọn — nhà tuyển dụng sẽ xem CV và xác nhận</li>
            <li><strong>Quản lý</strong> hồ sơ cá nhân (kỹ năng, trường, kinh nghiệm, chứng chỉ, CV, ảnh)</li>
            <li><strong>Nhận thông báo</strong> trong ứng dụng và qua email khi nhà tuyển dụng chấp nhận, từ chối hoặc xếp danh sách chờ</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Bắt đầu</h3>

          <h4 className="font-semibold mt-4 mb-2">1. Xác minh email</h4>
          <ol className="list-decimal pl-5 space-y-1 mb-4">
            <li>Truy cập trang web TECXWORK</li>
            <li>Nhấn <strong>&quot;Bắt đầu&quot;</strong> → <strong>&quot;Tôi là Sinh viên&quot;</strong> → <strong>&quot;Đăng ký&quot;</strong></li>
            <li>Nhập email của bạn — chúng tôi sẽ gửi mã 6 chữ số (có hiệu lực trong 10 phút)</li>
            <li>Nhập mã để xác nhận bạn sở hữu địa chỉ email đó</li>
          </ol>
          <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
            Không nhận được mã? Hãy kiểm tra hộp thư rác hoặc nhấn <em>Gửi lại</em>. Bạn có thể yêu cầu tối đa 5 mã mỗi giờ.
          </div>

          <h4 className="font-semibold mt-4 mb-2">2. Hoàn thiện hồ sơ</h4>
          <p className="mb-2">Sau khi xác minh email, hãy điền hồ sơ. Biểu mẫu tự động lưu trên trình duyệt nên bạn có thể quay lại nếu bị gián đoạn. Trường bắt buộc tuỳ thuộc vào chế độ sự kiện (do quản trị viên đặt):</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li><strong>Luôn bắt buộc</strong>: họ tên đầy đủ, mật khẩu (≥ 8 ký tự), liên kết CV (Google Drive), đồng ý PIPA</li>
            <li><strong>Bắt buộc ở chế độ &quot;đầy đủ&quot;</strong>: trường (có gợi ý các trường ở Đài Loan), chuyên ngành, bậc học, năm tốt nghiệp dự kiến</li>
            <li><strong>Tuỳ chọn nhưng nên có</strong>: số điện thoại, quốc tịch, năm học, trạng thái tìm việc, quyền lao động, kỹ năng, thành phố/ngành nghề mong muốn, LinkedIn / portfolio, kinh nghiệm làm việc, chứng chỉ, mô tả ngắn, ảnh đại diện</li>
          </ul>
          <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
            <strong>Mẹo:</strong> Hồ sơ đầy đủ sẽ xuất hiện cao hơn trong kết quả tìm kiếm và tăng cơ hội được mời.
          </div>

          <h4 className="font-semibold mt-4 mb-2">3. Hoàn tất</h4>
          <p>Sau khi gửi, bạn sẽ tự động đăng nhập và được chuyển đến <strong>Danh bạ công ty</strong> (trang khám phá).</p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Khám phá &amp; Đăng ký</h3>

          <h4 className="font-semibold mt-4 mb-2">Tìm công ty và việc làm</h4>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li><strong>Tab Công ty</strong> — các nhà tuyển dụng đã đăng ký sự kiện và vị trí của họ</li>
            <li><strong>Tab Việc làm bên ngoài</strong> — việc làm tự động lấy từ 1111 Job Bank, có bộ lọc Anh/Trung</li>
            <li>Thanh tìm kiếm lọc theo công ty, vị trí hoặc tên việc làm</li>
            <li>Bộ lọc ngành nghề thu hẹp danh sách công ty</li>
          </ul>

          <h4 className="font-semibold mt-4 mb-2">Đăng ký phỏng vấn</h4>
          <ol className="list-decimal pl-5 space-y-1 mb-4">
            <li>Mở trang nhà tuyển dụng để xem giới thiệu, ảnh và các vị trí đang tuyển</li>
            <li>Chọn vị trí bạn quan tâm</li>
            <li>Dùng mũi tên ngày để tìm ngày sự kiện ({EVENT_CONFIG.displayDate}) và chọn khung giờ trống</li>
            <li>Xác nhận liên kết CV chính xác (bạn có thể ghi đè cho lần đăng ký này)</li>
            <li>Đánh dấu đồng ý PIPA và nhấn <strong>Đăng ký</strong></li>
          </ol>
          <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
            Việc đăng ký <em>không</em> giữ chỗ ngay. Nhà tuyển dụng sẽ xem CV và nhấn &quot;Chấp nhận&quot; — khi đó một slot phỏng vấn sẽ được khoá nguyên tử và cả hai bên nhận email xác nhận.
          </div>

          <h4 className="font-semibold mt-4 mb-2">Sau khi đăng ký</h4>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Trạng thái ban đầu là <strong>Đang chờ</strong>. Nhà tuyển dụng sẽ thấy trong bảng điều khiển.</li>
            <li>Bạn sẽ nhận thông báo trong ứng dụng (biểu tượng chuông) và email khi họ:
              <ul className="list-disc pl-5 mt-1">
                <li><strong>Chấp nhận</strong> — phỏng vấn được xác nhận; chia sẻ CV Google Drive với email của họ</li>
                <li><strong>Đưa vào danh sách chờ</strong> — slot đã đầy nhưng họ có thể mời lại nếu có chỗ trống</li>
                <li><strong>Từ chối</strong> — họ đã không chọn; email có thể kèm lời nhắn cá nhân</li>
              </ul>
            </li>
            <li>Bạn có thể huỷ đơn đăng ký đang chờ hoặc đã được chấp nhận trên trang đặt lịch — slot sẽ được giải phóng cho người khác</li>
          </ul>
          <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
            <strong>Quan trọng:</strong> Khi đã được chấp nhận, chỉ chia sẻ CV Google Drive <em>với</em> email của nhà tuyển dụng được hiển thị trong xác nhận. KHÔNG đặt liên kết là &quot;Bất kỳ ai có liên kết.&quot;
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Hồ sơ của bạn</h3>
          <p className="mb-2">Mở <strong>Hồ sơ</strong> từ menu bất cứ lúc nào. Bạn có thể chỉnh sửa:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Tên, số điện thoại, quốc tịch, ảnh</li>
            <li>Trường, chuyên ngành, bậc học/năm học, ngày tốt nghiệp</li>
            <li>Trạng thái tìm việc, quyền lao động</li>
            <li>Kỹ năng, địa điểm mong muốn, ngành nghề mong muốn</li>
            <li>Kinh nghiệm làm việc (tối đa 5) và chứng chỉ (tối đa 10)</li>
            <li>Liên kết CV, LinkedIn, portfolio</li>
            <li>Mô tả ngắn / giới thiệu bản thân</li>
          </ul>
          <p>Thay đổi được lưu ngay. Nhà tuyển dụng sẽ thấy phiên bản mới nhất trong lần xem tiếp theo.</p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Quên mật khẩu</h3>
          <ol className="list-decimal pl-5 space-y-1 mb-4">
            <li>Tại trang đăng nhập, nhấn <strong>Quên mật khẩu?</strong></li>
            <li>Nhập email — bạn sẽ nhận mã 6 chữ số (có hiệu lực 10 phút)</li>
            <li>Nhập mã rồi đặt mật khẩu mới (≥ 8 ký tự)</li>
          </ol>
          <p>Liên kết đặt lại chỉ dùng một lần và sẽ hết hạn sau khi bạn hoàn tất.</p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Câu hỏi thường gặp</h3>
          <div className="space-y-3">
            <div>
              <p className="font-semibold">H: Tôi có thể đăng ký nhiều công ty không?</p>
              <p>Đ: Có. Bạn cũng có thể đăng ký nhiều vị trí <em>khác nhau</em> tại cùng một công ty — nhưng không cùng một vị trí hai lần.</p>
            </div>
            <div>
              <p className="font-semibold">H: Hai cuộc phỏng vấn có thể trùng giờ không?</p>
              <p>Đ: Không. Hệ thống chặn mọi đơn đang chờ hoặc đã chấp nhận trùng với khung giờ bạn đã đặt.</p>
            </div>
            <div>
              <p className="font-semibold">H: Nhà tuyển dụng đã từ chối — tôi có thể đăng ký lại không?</p>
              <p>Đ: Có, với một vị trí khác trong cùng công ty hoặc một công ty khác.</p>
            </div>
            <div>
              <p className="font-semibold">H: Tôi có thể đổi email không?</p>
              <p>Đ: Không trực tiếp — đổi email cần quản trị viên hỗ trợ để đảm bảo dữ liệu đồng nhất.</p>
            </div>
            <div>
              <p className="font-semibold">H: Trang đang ở Anh / Trung / Việt — tôi có thể đổi không?</p>
              <p>Đ: Có. Nút đổi ngôn ngữ nằm trong menu.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function RecruiterSectionVi() {
  return (
    <section id="recruiter-guide" className="scroll-mt-8">
      <h2 className="text-2xl font-bold border-b pb-2 mb-6">Hướng dẫn Nhà tuyển dụng</h2>
      <div className="space-y-6 text-sm leading-relaxed">
        <div>
          <h3 className="text-xl font-semibold mb-2">Tổng quan</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Đăng tuyển</strong> với đầy đủ thông tin (lương, hình thức, hỗ trợ visa, hạn nộp) — quản trị viên duyệt trước khi công khai</li>
            <li><strong>Nhận đơn ứng tuyển</strong> từ sinh viên cho từng vị trí</li>
            <li><strong>Chấp nhận, xếp danh sách chờ hoặc từ chối</strong> — chấp nhận sẽ khoá slot phỏng vấn nguyên tử</li>
            <li><strong>Duyệt hồ sơ sinh viên</strong> và đặt lịch trực tiếp với ứng viên tiềm năng (khi quản trị viên bật chế độ này)</li>
            <li><strong>Chỉnh sửa hồ sơ công ty</strong> — mô tả, ảnh, thư viện ảnh, số người phỏng vấn, thông tin liên hệ</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Bắt đầu</h3>

          <h4 className="font-semibold mt-4 mb-2">1. Được duyệt tài khoản</h4>
          <p className="mb-2">Trước khi đăng ký, quản trị viên sự kiện phải đưa vào danh sách trắng:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li><strong>Tên miền email</strong> của bạn (ví dụ <code>tsmc.com</code>) — bất kỳ ai có email với tên miền này đều có thể đăng ký</li>
            <li><strong>Email cụ thể</strong> (ví dụ <code>jane@gmail.com</code>) — chỉ địa chỉ này mới được đăng ký</li>
          </ul>
          <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
            Nếu hệ thống báo &quot;Tên miền email không được phép&quot;, hãy liên hệ quản trị viên sự kiện kèm email bạn sẽ dùng.
          </div>

          <h4 className="font-semibold mt-4 mb-2">2. Tạo tài khoản</h4>
          <ol className="list-decimal pl-5 space-y-1 mb-4">
            <li>Nhấn <strong>&quot;Bắt đầu&quot;</strong> → <strong>&quot;Tôi là Nhà tuyển dụng&quot;</strong> → <strong>&quot;Đăng ký&quot;</strong></li>
            <li>Nhập email công việc — hệ thống kiểm tra danh sách cho phép / phê duyệt</li>
            <li>Điền: tên, mật khẩu (≥ 8 ký tự), tên công ty, ngành nghề, email liên hệ, mô tả ngắn</li>
            <li>Xác nhận ba cam kết tuyển dụng (tuyển dụng hợp pháp, không phân biệt, kiểm tra quyền lao động)</li>
            <li>Nhấn <strong>Tạo tài khoản</strong></li>
          </ol>
          <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
            Đã có tài khoản? Hãy dùng <strong>Đăng nhập</strong> — biểu mẫu đăng ký sẽ từ chối tạo lại tài khoản đã tồn tại. Quên mật khẩu? Dùng quy trình đặt lại mật khẩu.
          </div>

          <h4 className="font-semibold mt-4 mb-2">3. Hoàn tất</h4>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Slot phỏng vấn mặc định được tạo sẵn cho ngày sự kiện ({EVENT_CONFIG.displayDate}) theo khung giờ và thời lượng đã cấu hình</li>
            <li>Số người phỏng vấn mặc định là 1 — thay đổi trong bảng điều khiển nếu có nhiều người chạy slot song song</li>
            <li>Bạn được chuyển đến <strong>Bảng điều khiển → Phỏng vấn</strong></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Đăng tin tuyển dụng</h3>
          <ol className="list-decimal pl-5 space-y-1 mb-4">
            <li>Mở <strong>Bảng điều khiển → Việc làm</strong> và nhấn <strong>Tạo việc mới</strong></li>
            <li>Điền: tiêu đề, địa điểm, hình thức, môi trường, cấp bậc, khoảng lương &amp; tiền tệ, yêu cầu ngôn ngữ, hỗ trợ visa, hạn nộp, mô tả, trách nhiệm, yêu cầu, phúc lợi và liên kết JD (tuỳ chọn)</li>
            <li>Có thể lưu nháp bất cứ lúc nào</li>
            <li>Khi sẵn sàng, nhấn <strong>Gửi duyệt</strong></li>
          </ol>
          <p className="mb-2">Quản trị viên kiểm duyệt nội dung dựa trên danh sách từ bị cấm (ví dụ ngôn từ phân biệt). Sau khi duyệt:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li><strong>Đã duyệt</strong> → tin xuất hiện trên trang công khai của bạn</li>
            <li><strong>Bị từ chối</strong> → ghi chú của quản trị viên hiển thị; sửa và gửi lại</li>
            <li>Sửa tin đã duyệt sẽ chuyển về nháp và phải duyệt lại</li>
          </ul>
          <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
            Quản trị viên có thể tắt kiểm duyệt — khi đó tin tự động được duyệt ngay khi lưu.
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Xem xét đơn ứng tuyển</h3>
          <p className="mb-2">Khi sinh viên đăng ký, bạn thấy mục <strong>Đang chờ</strong> trong bảng điều khiển với:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Tên ứng viên, email, giờ yêu cầu, vị trí</li>
            <li>Liên kết CV (chỉ chấp nhận <code>https://</code> đã xác minh — an toàn để mở)</li>
            <li>Thông báo trong ứng dụng + thông báo đẩy trên điện thoại (nếu bật)</li>
          </ul>
          <p className="mb-2">Ba thao tác:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li><strong>Chấp nhận</strong> — hệ thống tìm và khoá nguyên tử một slot phỏng vấn còn trống vào giờ yêu cầu. Cả hai bên nhận email xác nhận và buổi phỏng vấn được ghi nhận. Mỗi ứng viên chỉ được chấp nhận một slot mỗi khung giờ.</li>
            <li><strong>Đưa vào danh sách chờ</strong> — ứng viên được thông báo slot đã đầy nhưng có thể được mời lại. Nếu bạn huỷ một buổi đã chấp nhận cùng giờ, ứng viên chờ kế tiếp tự động được chuyển sang Đang chờ.</li>
            <li><strong>Từ chối</strong> — có thể kèm lời nhắn ngắn (đã được làm sạch) trong email.</li>
          </ul>
          <div className="bg-destructive/10 p-3 rounded-md text-destructive border-l-4 border-destructive mb-4">
            <strong>Lưu ý:</strong> Chấp nhận/Huỷ là thời gian thực. Nếu hai nhà tuyển dụng cùng công ty xử lý cùng một đơn đồng thời, hệ thống sẽ tuần tự — chỉ một thao tác Chấp nhận thắng, các bên còn lại thấy &quot;đã được chấp nhận.&quot;
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Duyệt &amp; đặt lịch ứng viên</h3>
          <p className="mb-4">Có sẵn khi quản trị viên đặt chế độ thành <em>Nhà tuyển dụng đặt lịch ứng viên</em> hoặc <em>Cả hai</em>.</p>
          <ol className="list-decimal pl-5 space-y-1 mb-4">
            <li>Mở <strong>Bảng điều khiển → Ứng viên</strong></li>
            <li>Tìm theo tên, chuyên ngành hoặc kỹ năng; nhấn vào thẻ để xem hồ sơ đầy đủ</li>
            <li>Chọn một khung giờ trống của ứng viên</li>
            <li>Nhấn <strong>Đặt slot này</strong> — khoá nguyên tử cả slot trống của ứng viên và slot phỏng vấn của bạn</li>
          </ol>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Chỉnh sửa hồ sơ công ty</h3>
          <p className="mb-2">Từ bảng điều khiển, mở trình chỉnh sửa hồ sơ công ty. Bạn có thể đổi:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Mô tả công ty, website</li>
            <li>Logo và ảnh thư viện (tối đa 4 — tải lên Vercel Blob)</li>
            <li>Số người phỏng vấn (1–10) — tăng sẽ mở rộng số slot; giảm chỉ bỏ các slot chưa được đặt</li>
            <li>Email liên hệ hiển thị cho ứng viên</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Thông báo</h3>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Biểu tượng chuông hiển thị đơn mới, huỷ và chuyển từ danh sách chờ</li>
            <li>Bật thông báo đẩy trên web từ menu chuông để nhận thông báo ngay cả khi đóng tab</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Câu hỏi thường gặp</h3>
          <div className="space-y-3">
            <div>
              <p className="font-semibold">H: Nhiều nhà tuyển dụng cùng công ty có thể đăng ký không?</p>
              <p>Đ: Có. Mỗi người có tài khoản, bảng điều khiển và pool slot phỏng vấn riêng.</p>
            </div>
            <div>
              <p className="font-semibold">H: Slot phỏng vấn được tạo như thế nào?</p>
              <p>Đ: Mặc định số người phỏng vấn là 1 — tức một slot mỗi khung giờ. Tăng số người phỏng vấn lên N sẽ có N slot song song mỗi khung giờ.</p>
            </div>
            <div>
              <p className="font-semibold">H: Email được duyệt trước không còn dùng được sau khi tôi đã đăng ký.</p>
              <p>Đ: Đúng. Phê duyệt trước được tiêu thụ khi đăng ký; sau đó chỉ cần đăng nhập bình thường.</p>
            </div>
            <div>
              <p className="font-semibold">H: Tôi sửa tin đã duyệt — vì sao lại trở về nháp?</p>
              <p>Đ: Mọi thay đổi nội dung sẽ chuyển tin về kiểm duyệt để tránh thay đổi sau duyệt mà không qua xét duyệt.</p>
            </div>
            <div>
              <p className="font-semibold">H: Sau sự kiện dữ liệu sẽ ra sao?</p>
              <p>Đ: Toàn bộ dữ liệu đặt lịch và cá nhân được quản trị viên xuất ra rồi xoá vĩnh viễn trong vòng 2 ngày để tuân thủ PIPA của Đài Loan.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AdminSectionVi() {
  return (
    <section id="admin-guide" className="scroll-mt-8">
      <h2 className="text-2xl font-bold border-b pb-2 mb-6">Hướng dẫn Quản trị viên</h2>
      <div className="space-y-6 text-sm leading-relaxed">
        <div>
          <h3 className="text-xl font-semibold mb-2">Tổng quan</h3>
          <p className="mb-2">Là quản trị viên sự kiện, bạn kiểm soát toàn bộ nền tảng:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Quyền truy cập của nhà tuyển dụng</strong> — danh sách miền cho phép và phê duyệt theo email</li>
            <li><strong>Chế độ &amp; khoá sự kiện</strong> — kiểm soát hướng đặt lịch và đóng băng trong sự kiện</li>
            <li><strong>Kiểm duyệt việc làm</strong> — xem &amp; duyệt/từ chối từng tin do nhà tuyển dụng đăng</li>
            <li><strong>Quản lý người dùng</strong> — xem, tìm, sắp xếp, gỡ sinh viên và nhà tuyển dụng</li>
            <li><strong>Đặt lịch</strong> — xem mọi đơn đặt; xuất CSV</li>
            <li><strong>Việc làm bên ngoài</strong> — chạy crawler 1111 Job Bank thủ công hoặc qua cron</li>
            <li><strong>Email nhắc nhở</strong> — gửi hàng loạt lịch trình cho sinh viên và nhà tuyển dụng trước sự kiện</li>
            <li><strong>Ảnh trang chủ</strong> — quản lý ảnh hero hiển thị ở trang đích</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Đăng nhập</h3>
          <p className="mb-2">Tài khoản quản trị được nạp trực tiếp vào cơ sở dữ liệu — không có quy trình đăng ký dành cho admin. Đăng nhập qua trang đăng nhập thông thường; kiểm tra vai trò sẽ chuyển bạn đến <code>/admin</code>.</p>
          <div className="bg-destructive/10 p-3 rounded-md text-destructive border-l-4 border-destructive mb-4">
            <strong>Quan trọng:</strong> Hãy đổi mật khẩu admin trước khi mở nền tảng cho nhà tuyển dụng và sinh viên. Dùng quy trình <em>Quên mật khẩu</em> hoặc cập nhật seed.
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Các mục bảng điều khiển</h3>

          <h4 className="font-semibold mt-4 mb-2">1. Thống kê</h4>
          <p className="mb-2">Bộ đếm trực tiếp về nhà tuyển dụng, sinh viên, tổng slot, slot trống và đơn đặt. Cập nhật theo thời gian thực.</p>

          <h4 className="font-semibold mt-4 mb-2">2. Chế độ sự kiện &amp; Onboarding</h4>
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full text-left border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 border-b">Cài đặt</th>
                  <th className="px-4 py-2 border-b">Điều khiển điều gì</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border-b font-medium">Chế độ: Ứng viên đặt lịch nhà tuyển dụng</td>
                  <td className="px-4 py-2 border-b">Sinh viên đăng ký theo giờ; nhà tuyển dụng chấp nhận</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b font-medium">Chế độ: Nhà tuyển dụng đặt lịch ứng viên</td>
                  <td className="px-4 py-2 border-b">Nhà tuyển dụng tìm hồ sơ và đặt trực tiếp vào khung giờ trống của sinh viên</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b font-medium">Chế độ: Cả hai</td>
                  <td className="px-4 py-2 border-b">Cả hai luồng đều hoạt động</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b font-medium">Khoá chế độ</td>
                  <td className="px-4 py-2 border-b">Khoá để chế độ không bị thay đổi vô tình trong sự kiện</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b font-medium">Chế độ onboarding (đầy đủ / tối giản)</td>
                  <td className="px-4 py-2 border-b">Sinh viên có phải điền trường+chuyên ngành+bậc học khi đăng ký hay chỉ tối thiểu</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border-b font-medium">Kiểm duyệt việc làm</td>
                  <td className="px-4 py-2 border-b">Khi BẬT, mỗi tin tuyển dụng cần bạn duyệt trước khi công khai</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="bg-muted p-3 rounded-md text-muted-foreground border-l-4 border-primary mb-4">
            <strong>Mẹo:</strong> Khoá chế độ ít nhất 1 giờ trước khi mở sự kiện.
          </div>

          <h4 className="font-semibold mt-4 mb-2">3. Quyền truy cập của nhà tuyển dụng</h4>
          <p className="mb-2">Hai công cụ bổ sung:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li><strong>Miền được phép</strong> — bất kỳ ai có email theo miền (ví dụ <code>tsmc.com</code>) đều có thể tự đăng ký. Tự điền công ty &amp; ngành.</li>
            <li><strong>Phê duyệt email</strong> — phê duyệt một email cụ thể (hữu ích cho nhà tuyển dụng cá nhân dùng email cá nhân) kèm thông tin công ty &amp; ngành định sẵn.</li>
          </ul>
          <p>Việc xoá khỏi danh sách KHÔNG đăng xuất nhà tuyển dụng đã đăng ký — chỉ ảnh hưởng đăng ký mới.</p>

          <h4 className="font-semibold mt-4 mb-2">4. Kiểm duyệt việc làm</h4>
          <p className="mb-2">Khi bật kiểm duyệt, các tin do nhà tuyển dụng gửi sẽ vào hàng đợi:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li><strong>Duyệt</strong> → tin được công khai trên trang nhà tuyển dụng</li>
            <li><strong>Từ chối</strong> → ghi chú tuỳ chọn được hiển thị cho nhà tuyển dụng để sửa và gửi lại</li>
            <li><strong>Đưa về nháp</strong> → trả lại cho nhà tuyển dụng mà không cần quyết định</li>
          </ul>
          <p>Hệ thống cũng tự đánh dấu các từ ngữ có khả năng phân biệt khi gửi — nhưng hãy luôn kiểm tra cuối cùng.</p>

          <h4 className="font-semibold mt-4 mb-2">5. Người dùng</h4>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Nhà tuyển dụng và sinh viên có tab riêng</li>
            <li>Cột có thể sắp xếp và bộ lọc tìm kiếm thời gian thực</li>
            <li>Xoá người dùng sẽ xoá tài khoản, hồ sơ, slot và đơn đặt <em>trong một giao dịch duy nhất</em> — không có dữ liệu mồ côi</li>
          </ul>
          <div className="bg-destructive/10 p-3 rounded-md text-destructive border-l-4 border-destructive mb-4">
            <strong>Cảnh báo:</strong> Xoá là không thể hoàn tác. Hãy xuất CSV trước nếu bạn có thể cần dữ liệu sau này.
          </div>

          <h4 className="font-semibold mt-4 mb-2">6. Đặt lịch &amp; Xuất dữ liệu</h4>
          <p>Bảng đặt lịch hiển thị mọi cuộc phỏng vấn của tất cả nhà tuyển dụng kèm bộ lọc trạng thái. Nhấn <strong>Xuất CSV</strong> để tải xuống với ứng viên, nhà tuyển dụng, giờ, trạng thái và liên kết CV — các giá trị đã được escape để tránh chèn công thức.</p>

          <h4 className="font-semibold mt-4 mb-2">7. Crawler việc làm bên ngoài</h4>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Chạy hàng ngày lúc 18:00 UTC qua Vercel cron với khoá <code>CRON_SECRET</code></li>
            <li>Bạn cũng có thể chạy thủ công từ bảng điều khiển admin</li>
            <li>Lấy tin mới từ 1111 Job Bank vào tab Việc làm bên ngoài trên trang công khai</li>
          </ul>

          <h4 className="font-semibold mt-4 mb-2">8. Email nhắc nhở</h4>
          <p>Gửi email nhắc lịch phỏng vấn cho mọi sinh viên hoặc mọi nhà tuyển dụng chỉ với một nút. Mỗi lần gửi đều ghi log thành công/lỗi cho từng người — xem bảng email-stats để theo dõi.</p>

          <h4 className="font-semibold mt-4 mb-2">9. Ảnh trang chủ &amp; Khung giờ</h4>
          <p>Quản lý ảnh hero/trang chủ (URL được kiểm tra theo allow-list của Vercel Blob) và điều chỉnh khung giờ / ngày hiển thị nếu thay đổi.</p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Danh sách kiểm tra trước sự kiện</h3>

          <h4 className="font-semibold mt-4 mb-2">Trước 2 tuần</h4>
          <ul className="list-none pl-0 space-y-1 mb-4">
            <li><input type="checkbox" readOnly className="mr-2" /> Thêm tất cả tên miền email và phê duyệt email cho nhà tuyển dụng</li>
            <li><input type="checkbox" readOnly className="mr-2" /> Quyết định chế độ onboarding (đầy đủ / tối giản) và chế độ sự kiện</li>
            <li><input type="checkbox" readOnly className="mr-2" /> Chia sẻ URL nền tảng với các trường và công ty tham gia</li>
            <li><input type="checkbox" readOnly className="mr-2" /> Kiểm tra biến môi trường Resend / push-notification trên production</li>
          </ul>

          <h4 className="font-semibold mt-4 mb-2">Trước 1 tuần</h4>
          <ul className="list-none pl-0 space-y-1 mb-4">
            <li><input type="checkbox" readOnly className="mr-2" /> Đối chiếu nhà tuyển dụng đã đăng ký; nhắc các công ty còn thiếu</li>
            <li><input type="checkbox" readOnly className="mr-2" /> Duyệt &amp; phê duyệt mọi tin trong hàng đợi kiểm duyệt</li>
            <li><input type="checkbox" readOnly className="mr-2" /> Chạy thử đăng ký end-to-end (đăng ký → chấp nhận → email)</li>
          </ul>

          <h4 className="font-semibold mt-4 mb-2">Trước 1 ngày</h4>
          <ul className="list-none pl-0 space-y-1 mb-4">
            <li><input type="checkbox" readOnly className="mr-2" /> Gửi email nhắc trước sự kiện cho sinh viên và nhà tuyển dụng</li>
            <li><input type="checkbox" readOnly className="mr-2" /> <strong>Khoá chế độ sự kiện</strong></li>
            <li><input type="checkbox" readOnly className="mr-2" /> Kiểm tra số liệu thống kê; xuất CSV mốc cơ sở</li>
          </ul>

          <h4 className="font-semibold mt-4 mb-2">Ngày sự kiện</h4>
          <ul className="list-none pl-0 space-y-1 mb-4">
            <li><input type="checkbox" readOnly className="mr-2" /> Theo dõi bảng điều khiển; phản hồi yêu cầu hỗ trợ qua kênh bạn chọn</li>
            <li><input type="checkbox" readOnly className="mr-2" /> Kiểm tra ngẫu nhiên hộp thư nhà tuyển dụng nếu có ai báo thiếu thông báo</li>
          </ul>

          <h4 className="font-semibold mt-4 mb-2">Sau sự kiện 2 ngày</h4>
          <ul className="list-none pl-0 space-y-1 mb-4">
            <li><input type="checkbox" readOnly className="mr-2" /> Xuất CSV cuối cùng cho mọi đơn đặt</li>
            <li><input type="checkbox" readOnly className="mr-2" /> Xoá dữ liệu người dùng để tuân thủ PIPA (admin Người dùng → xoá tất cả)</li>
            <li><input type="checkbox" readOnly className="mr-2" /> Thông báo cho nhà tuyển dụng dữ liệu đã được xoá</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Khắc phục sự cố</h3>
          <div className="space-y-4">
            <div>
              <p className="font-semibold">&quot;Nhà tuyển dụng nói không đăng ký được&quot;</p>
              <p>→ Kiểm tra danh sách Miền cho phép và Phê duyệt email. Thêm mục thiếu. Họ cần thử lại với chính email đã cung cấp.</p>
            </div>
            <div>
              <p className="font-semibold">&quot;Sinh viên nói mã xác minh không đến&quot;</p>
              <p>→ Kiểm tra bảng Email Stats — Resend có thể đang giới hạn tốc độ hoặc địa chỉ bị từ chối. Họ có thể yêu cầu tối đa 5 mã/giờ. Xác nhận email không nằm trong thư rác.</p>
            </div>
            <div>
              <p className="font-semibold">&quot;Hai sinh viên thấy &apos;Chấp nhận thất bại&apos; cùng giờ&quot;</p>
              <p>→ Đó là cơ chế khoá slot hoạt động đúng: chỉ một thao tác Chấp nhận thắng mỗi slot. Người còn lại nên chọn giờ khác.</p>
            </div>
            <div>
              <p className="font-semibold">&quot;Tin đã duyệt không hiển thị&quot;</p>
              <p>→ Có thể nhà tuyển dụng đã sửa sau khi duyệt, đưa tin trở lại nháp. Hãy xem lại hàng đợi.</p>
            </div>
            <div>
              <p className="font-semibold">&quot;Cron crawler chưa chạy&quot;</p>
              <p>→ Kiểm tra <code>CRON_SECRET</code> khớp giữa cài đặt Vercel và <code>vercel.json</code>; xem log Cron trong Vercel.</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Ghi chú kỹ thuật</h3>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li><strong>Stack</strong>: Next.js 16 trên Vercel; Neon Postgres (driver WebSocket serverless) với Drizzle ORM</li>
            <li><strong>Xác thực</strong>: cookie JWT, bcrypt 12 vòng, mật khẩu tối thiểu 8 ký tự</li>
            <li><strong>Kiểm tra</strong>: schema zod ở ranh giới API cho auth, đăng ký và đặt lịch</li>
            <li><strong>Đồng thời</strong>: advisory lock của Postgres + UPDATE kiểu CAS đảm bảo không trùng slot; có integration test (<code>npm test</code>)</li>
            <li><strong>Giới hạn tốc độ</strong>: Vercel Runtime Cache (60 req/phút API, 5/phút endpoint auth)</li>
            <li><strong>Email</strong>: Resend với escape HTML &amp; allow-list URL trên mọi trường người dùng</li>
            <li><strong>Push</strong>: Web Push qua cặp khoá VAPID</li>
            <li><strong>Lưu trữ</strong>: Vercel Blob cho ảnh đại diện, logo, thư viện và ảnh trang chủ</li>
            <li><strong>I18n</strong>: en, zh-TW, vi</li>
            <li><strong>Thiết kế &amp; Phát triển bởi</strong>: <a href="https://tecxmate.com" className="text-primary hover:underline">TECXMATE.COM</a></li>
          </ul>
        </div>
      </div>
    </section>
  );
}
