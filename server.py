"""
=============================================================================
CINEMA PORTFOLIO WEB SERVER
Môn học: TIN 314 - Lập trình
Khởi chạy máy chủ nội bộ (Local Web Server) và tự động mở website trên trình duyệt.
=============================================================================
"""

import http.server
import socketserver
import webbrowser
import os
import sys

# Chuyển thư mục làm việc về cùng thư mục chứa file server.py
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(CURRENT_DIR)

PORT = 8080

class CinemaHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Tắt cache để luôn nhận được code mới nhất khi reload
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def run_server():
    global PORT
    while True:
        try:
            with socketserver.TCPServer(("", PORT), CinemaHTTPHandler) as httpd:
                url = f"http://localhost:{PORT}"
                print("=" * 70)
                print(f"🎬 CINEMA PORTFOLIO ĐANG CHẠY THÀNH CÔNG!")
                print(f"🌐 Link truy cập: {url}")
                print("=" * 70)
                print("💡 Nhấn Ctrl + C trong Terminal để dừng máy chủ.")
                
                # Tự động mở trình duyệt
                try:
                    webbrowser.open(url)
                except Exception:
                    pass
                
                httpd.serve_forever()
        except OSError:
            # Nếu cổng bị bận, chuyển sang cổng tiếp theo
            PORT += 1

if __name__ == '__main__':
    try:
        run_server()
    except KeyboardInterrupt:
        print("\n🛑 Đã dừng máy chủ Cinema Portfolio.")
        sys.exit(0)
