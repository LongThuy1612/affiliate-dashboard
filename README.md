# Affiliate Dashboard & Crawler

Dự án này là hệ thống **Affiliate Dashboard** kết hợp chức năng **Crawler** chuyên sâu, được xây dựng bằng Next.js. Dự án giúp thu thập, quản lý và hiển thị thông tin các chương trình Affiliate (như tỷ lệ hoa hồng, loại hoa hồng, thời gian cookie...) từ các nền tảng khác nhau bằng cách kết hợp scraping truyền thống và AI.

## 🚀 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI & Styling:** Tailwind CSS v4, Radix UI, Lucide React
- **Biểu đồ:** Recharts
- **Ngôn ngữ:** TypeScript
- **Đa ngôn ngữ (i18n):** next-intl
- **Cơ chế Scraping:** Axios (HTTP), Playwright (Stealth JS), FlareSolverr (Bypass Cloudflare CAPTCHA)
- **AI Processing:** Giao tiếp LLM để trích xuất thông tin thông minh từ nội dung Markdown

---

## ✨ Các tính năng mới & Cập nhật (Branch TCAFF-10)

- **Cấu trúc Affiliate Tree (Sub-Programs):** Hệ thống giờ đây không chỉ quét domain chính mà còn tự động nhận diện, phân tích và phân loại các chương trình affiliate con (sub-pages) khác nhau trên cùng một website.
- **Giao diện đối chiếu Sub-Programs:** Trong trang chi tiết Affiliate, danh sách các chương trình con được hiển thị với **URL đầy đủ (Full Link)**, cho phép người dùng click trực tiếp để đối chiếu dữ liệu giữa Dashboard và trang web gốc.
- **Báo cáo Fetch Tier chi tiết:** Hiển thị logs chi tiết về tầng kỹ thuật nào (Tier 1/2/3) đã lấy được dữ liệu thành công, kèm theo mã lỗi và thời gian xử lý.
- **Tối ưu hóa Tracking:** Loại bỏ các file ảnh chụp màn hình (screenshots) khỏi Git tracking để giảm dung lượng repo nhưng vẫn đảm bảo hiển thị trên Dashboard thông qua cơ chế lưu trữ cục bộ.

---

## 💻 Yêu cầu hệ thống (Prerequisites)

Trước khi chạy dự án, bạn cần đảm bảo đã cài đặt:
- **Node.js** (Phiên bản >=20.x được khuyến nghị do sử dụng Next.js 16 và React 19).
- **npm** hoặc **yarn** hoặc **pnpm**.
- **Playwright** browsers (để chạy crawler ở Tier 2).
- Khởi chạy [FlareSolverr](https://github.com/FlareSolverr/FlareSolverr) nếu muốn tự động giải quyết Cloudflare challenge (Optional nhưng cần thiết cho các target khó).
- **Cơ sở dữ liệu**: Đảm bảo database đã được dựng và có các chuỗi cấu hình (URL kết nối) đúng.
- **Crawler API**: Dashboard này phụ thuộc vào API từ dự án `trustpilot_crawl`. Bạn cần chạy dự án đó (port 3008) để Dashboard có thể lấy dữ liệu và kích hoạt crawl.

---

## 🛠️ Trình tự Cài đặt & Setup

**Bước 1: Clone dự án và cài đặt dependencies**

Mở terminal và di chuyển vào thư mục dự án, sau đó chạy lệnh cài đặt:

```bash
npm install
```

**Bước 2: Cài đặt cho Playwright (Dành cho Crawler)**

Nếu bạn định sử dụng chức năng Crawl web (bắt buộc cho Tier 2), bạn phải cài đặt các trình duyệt cho Playwright:

```bash
npx playwright install
```

**Bước 3: Cấu hình biến môi trường (Environment Variables)**

Tạo một file `.env.local` ở thư mục gốc của dự án nếu chưa có và cấu hình các biến môi trường cần thiết (ví dụ: chuỗi kết nối DB, API Key cho LLM, cổng FlareSolverr...). 

Ví dụ nội dung file `.env.local`:
```env
# Cổng chạy ứng dụng
PORT=3001

# FlareSolverr URL cho bước giải Cloudflare
FLARESOLVERR_URL=http://localhost:8191/v1

# Cấu hình LLM API Key (VD: OpenAI/Gemini/Anthropic)
LLM_API_KEY=your_llm_api_key_here
```

---

## 🏃 Khởi chạy dự án

Dự án được cấu hình mặc định chạy trên cổng **3001**.
Để khởi chạy chế độ phát triển (Development):

```bash
npm run dev
```

Sau khi chạy thành công, bạn có thể truy cập dự án tại: **http://localhost:3001**

Các lệnh khác:
- `npm run build`: Build dự án cho môi trường production.
- `npm run start`: Chạy server production sau khi build.
- `npm run lint`: Kiểm tra lỗi cú pháp và code style bằng ESLint.



## 🛠 Lời khuyên & Troubleshooting

- **Port ngẫu nhiên (Port in use):** Dự án được ghim ở `3001` trong `package.json` (`next dev --port 3001`). Nếu port này bị chiếm, ứng dụng sẽ báo lỗi. Bạn có thể thay cấu hình hoặc kill process đang chạy port 3001.
- **Dữ liệu không cập nhật mới:** Hãy kiểm tra xem `MAX_CRAWL_RETRIES` có bị đạt tới không, hoặc trang bạn quét bị đánh giá `Score` quá tốt nên nằm trong Tier `SKIP`.
