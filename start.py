#!/usr/bin/env python3
"""
Startup script for Electronic Industry Agent
Starts both frontend (Next.js) and backend (Python FastAPI) services
"""

import os
import sys
import time
import signal
import platform
import subprocess
from pathlib import Path
from threading import Thread

class Colors:
    """Terminal colors for better output"""
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_colored(text: str, color: str = Colors.ENDC):
    """Print colored text"""
    print(f"{color}{text}{Colors.ENDC}")

def check_python_version():
    """Check if Python version is 3.12 or higher"""
    version = sys.version_info
    if version.major != 3 or version.minor < 12:
        print_colored(f"❌ Python 3.12+ required, found Python {version.major}.{version.minor}", Colors.RED)
        print_colored("Please install Python 3.12 or higher", Colors.YELLOW)
        return False
    print_colored(f"✅ Python {version.major}.{version.minor}.{version.micro} detected", Colors.GREEN)
    return True

def check_node_version():
    """Check if Node.js is installed"""
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            version = result.stdout.strip()
            print_colored(f"✅ Node.js {version} detected", Colors.GREEN)
            return True
        else:
            print_colored("❌ Node.js not found", Colors.RED)
            return False
    except (subprocess.TimeoutExpired, FileNotFoundError):
        print_colored("❌ Node.js not found", Colors.RED)
        print_colored("Please install Node.js from https://nodejs.org/", Colors.YELLOW)
        return False

def check_pnpm():
    """Check if pnpm is installed"""
    try:
        result = subprocess.run(['pnpm', '--version'], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            version = result.stdout.strip()
            print_colored(f"✅ pnpm {version} detected", Colors.GREEN)
            return True
        else:
            print_colored("❌ pnpm not found", Colors.RED)
            return False
    except (subprocess.TimeoutExpired, FileNotFoundError):
        print_colored("❌ pnpm not found", Colors.RED)
        print_colored("Installing pnpm...", Colors.YELLOW)
        try:
            subprocess.run(['npm', 'install', '-g', 'pnpm'], check=True, timeout=60)
            print_colored("✅ pnpm installed successfully", Colors.GREEN)
            return True
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
            print_colored("❌ Failed to install pnpm", Colors.RED)
            return False

def install_python_dependencies():
    """Install Python dependencies in virtual environment"""
    print_colored("📦 Setting up Python virtual environment...", Colors.BLUE)
    
    venv_path = Path("venv")
    
    # Create virtual environment if it doesn't exist
    if not venv_path.exists():
        try:
            subprocess.run([sys.executable, '-m', 'venv', 'venv'], check=True, timeout=60)
            print_colored("✅ Virtual environment created", Colors.GREEN)
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
            print_colored(f"❌ Failed to create virtual environment: {e}", Colors.RED)
            return False
    else:
        print_colored("✅ Virtual environment already exists", Colors.GREEN)
    
    # Determine pip executable in virtual environment
    if platform.system() == "Windows":
        pip_executable = venv_path / "Scripts" / "pip"
        python_executable = venv_path / "Scripts" / "python"
    else:
        pip_executable = venv_path / "bin" / "pip"
        python_executable = venv_path / "bin" / "python"
    
    # Install dependencies in virtual environment
    print_colored("📦 Installing Python dependencies in virtual environment...", Colors.BLUE)
    try:
        subprocess.run([str(pip_executable), 'install', '-r', 'requirements.txt'], 
                      check=True, timeout=300)
        print_colored("✅ Python dependencies installed", Colors.GREEN)
        return True, str(python_executable)
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
        print_colored(f"❌ Failed to install Python dependencies: {e}", Colors.RED)
        return False, None

def install_node_dependencies():
    """Install Node.js dependencies"""
    print_colored("📦 Installing Node.js dependencies...", Colors.BLUE)
    try:
        subprocess.run(['pnpm', 'install'], check=True, timeout=300)
        print_colored("✅ Node.js dependencies installed", Colors.GREEN)
        return True
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
        print_colored(f"❌ Failed to install Node.js dependencies: {e}", Colors.RED)
        return False

def create_env_file():
    """Create .env file if it doesn't exist"""
    env_file = Path('.env')
    if not env_file.exists():
        print_colored("📝 Creating .env file...", Colors.BLUE)
        env_content = """# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/dbname

# LLM Configuration
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_API_ENDPOINT=https://api.openai.com/v1/chat/completions
OPENAI_MODEL=gpt-3.5-turbo

GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent

# Frontend Configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
"""
        env_file.write_text(env_content)
        print_colored("✅ .env file created", Colors.GREEN)
        print_colored("⚠️  Please update the .env file with your actual configuration", Colors.YELLOW)
    else:
        print_colored("✅ .env file already exists", Colors.GREEN)

class ServiceManager:
    """Manages frontend and backend services"""
    
    def __init__(self):
        self.processes = []
        self.running = True
    
    def start_backend(self, python_executable=None):
        """Start Python FastAPI backend"""
        print_colored("🚀 Starting Python backend on http://localhost:8000", Colors.BLUE)
        
        # Use virtual environment Python if available, otherwise system Python
        python_cmd = python_executable or sys.executable
        
        try:
            backend_process = subprocess.Popen(
                [python_cmd, '-m', 'uvicorn', 'backend.main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
            )
            self.processes.append(('Backend', backend_process))
            
            # Monitor backend output in a separate thread
            def monitor_backend():
                for line in iter(backend_process.stdout.readline, ''):
                    if self.running:
                        print_colored(f"[Backend] {line.strip()}", Colors.BLUE)
                    if not line:
                        break
            
            Thread(target=monitor_backend, daemon=True).start()
            
        except Exception as e:
            print_colored(f"❌ Failed to start backend: {e}", Colors.RED)
            return False
        
        return True
    
    def start_frontend(self):
        """Start Next.js frontend"""
        print_colored("🚀 Starting Next.js frontend on http://localhost:3000", Colors.GREEN)
        try:
            frontend_process = subprocess.Popen(
                ['pnpm', 'dev'],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
            )
            self.processes.append(('Frontend', frontend_process))
            
            # Monitor frontend output in a separate thread
            def monitor_frontend():
                for line in iter(frontend_process.stdout.readline, ''):
                    if self.running:
                        print_colored(f"[Frontend] {line.strip()}", Colors.GREEN)
                    if not line:
                        break
            
            Thread(target=monitor_frontend, daemon=True).start()
            
        except Exception as e:
            print_colored(f"❌ Failed to start frontend: {e}", Colors.RED)
            return False
        
        return True
    
    def stop_all(self):
        """Stop all services"""
        self.running = False
        print_colored("\n🛑 Stopping all services...", Colors.YELLOW)
        
        for name, process in self.processes:
            try:
                print_colored(f"Stopping {name}...", Colors.YELLOW)
                process.terminate()
                process.wait(timeout=5)
                print_colored(f"✅ {name} stopped", Colors.GREEN)
            except subprocess.TimeoutExpired:
                print_colored(f"Force killing {name}...", Colors.RED)
                process.kill()
                process.wait()
    
    def wait_for_services(self):
        """Wait for services to start"""
        print_colored("⏳ Waiting for services to start...", Colors.YELLOW)
        time.sleep(3)
        
        # Check if services are still running
        for name, process in self.processes:
            if process.poll() is not None:
                print_colored(f"❌ {name} failed to start", Colors.RED)
                return False
        
        print_colored("✅ All services started successfully!", Colors.GREEN)
        print_colored("\n" + "="*60, Colors.BOLD)
        print_colored("🎉 Electronic Industry Agent is running!", Colors.BOLD)
        print_colored("Frontend: http://localhost:3000", Colors.GREEN)
        print_colored("Backend:  http://localhost:8000", Colors.BLUE)
        print_colored("API Docs: http://localhost:8000/docs", Colors.BLUE)
        print_colored("="*60, Colors.BOLD)
        print_colored("\nPress Ctrl+C to stop all services", Colors.YELLOW)
        
        return True

def main():
    """Main startup function"""
    print_colored("🚀 Electronic Industry Agent Startup Script", Colors.BOLD)
    print_colored("="*50, Colors.BOLD)
    
    # Check prerequisites
    if not check_python_version():
        sys.exit(1)
    
    if not check_node_version():
        sys.exit(1)
    
    if not check_pnpm():
        sys.exit(1)
    
    # Create environment file
    create_env_file()
    
    # Install dependencies
    python_deps_result = install_python_dependencies()
    if isinstance(python_deps_result, tuple):
        deps_success, python_executable = python_deps_result
        if not deps_success:
            sys.exit(1)
    else:
        if not python_deps_result:
            sys.exit(1)
        python_executable = None
    
    if not install_node_dependencies():
        sys.exit(1)
    
    # Start services
    service_manager = ServiceManager()
    
    def signal_handler(signum, frame):
        """Handle Ctrl+C gracefully"""
        service_manager.stop_all()
        print_colored("\n👋 Goodbye!", Colors.GREEN)
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    if platform.system() != 'Windows':
        signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # Start backend first
        if not service_manager.start_backend(python_executable):
            sys.exit(1)
        
        # Wait a bit for backend to start
        time.sleep(2)
        
        # Start frontend
        if not service_manager.start_frontend():
            service_manager.stop_all()
            sys.exit(1)
        
        # Wait for services and then keep running
        if service_manager.wait_for_services():
            # Keep the script running
            while service_manager.running:
                time.sleep(1)
        else:
            service_manager.stop_all()
            sys.exit(1)
            
    except KeyboardInterrupt:
        service_manager.stop_all()
        print_colored("\n👋 Goodbye!", Colors.GREEN)
        sys.exit(0)
    except Exception as e:
        print_colored(f"❌ Unexpected error: {e}", Colors.RED)
        service_manager.stop_all()
        sys.exit(1)

if __name__ == "__main__":
    main()
