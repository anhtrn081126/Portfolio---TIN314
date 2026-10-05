"""
=============================================================================
CINEMA PORTFOLIO WEB LAUNCHER - ÁNH (KINH TẾ QUỐC TẾ FTU)
Môn học: TIN 314 - Lập trình
Chủ đề: Màn chiếu rạp phim & Rèm nhung sân khấu đỏ đậm

Toàn bộ mã nguồn giao diện, CSS và JavaScript đều được tích hợp trọn vẹn
trong duy nhất 1 file `index.html`.

CÁCH TRUY CẬP WEBSITE PORTFOLIO:
  1. Chạy lệnh: python3 Portfolio.py
     -> Trình duyệt sẽ tự động mở trang web tại: http://localhost:8080
  2. Hoặc mở trực tiếp file `index.html` trên trình duyệt (Chrome, Safari, Edge).
=============================================================================
"""

import http.server
import socketserver
import webbrowser
import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(CURRENT_DIR)

PORT = 8080

class CinemaHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Tắt cache để cập nhật ngay lập tức khi chỉnh sửa
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def main():
    global PORT
    while True:
        try:
            with socketserver.TCPServer(("", PORT), CinemaHTTPHandler) as httpd:
                url = f"http://localhost:{PORT}"
                print("*" * 72)
                print(f"🎬 [CINEMA PORTFOLIO - ÁNH] KHỞI CHẠY MÀN CHIẾU THÀNH CÔNG!")
                print(f"🌐 LINK TRUY CẬP WEBSITE DEMO: {url}")
                print(f"📁 Tệp nguồn duy nhất: index.html")
                print("*" * 72)
                print("💡 Nhấn Ctrl + C bất kỳ lúc nào để dừng máy chủ.")
                
                try:
                    webbrowser.open(url)
                except Exception:
                    pass
                
                httpd.serve_forever()
        except OSError:
            PORT += 1

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n🎬 Đã kết thúc buổi công chiếu Portfolio. Hẹn gặp lại Ánh!")
        sys.exit(0)
