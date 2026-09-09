import uvicorn
import webbrowser
import threading
import sys
import time

def open_browser():
    time.sleep(1.5)
    webbrowser.open("http://localhost:8000")

if __name__ == "__main__":
    is_packaged = getattr(sys, 'frozen', False)
    
    # Auto-open browser when double clicking the app / exe
    threading.Thread(target=open_browser, daemon=True).start()

    if is_packaged:
        # PyInstaller packaged mode - reload MUST be False to prevent infinite process spawn loop
        from app.main import app
        uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
    else:
        # Development mode
        uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
