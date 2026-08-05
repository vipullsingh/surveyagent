#!/usr/bin/env bash
# SurveyAgent Single-File Dev Launcher (Backend + Mobile) with Auto-Restart & Multi-Terminal Support

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_PATH="$ROOT_DIR/dev.sh"

run_backend() {
  cd "$ROOT_DIR/backend"
  echo "=========================================="
  echo "🚀 SurveyAgent Golang Backend API"
  echo "=========================================="
  while true; do
    echo "[$(date '+%T')] Starting Backend REST API (port 8080)..."
    go run cmd/api/main.go || true
    echo ""
    echo "⚠️ Backend process exited. Press Ctrl+C to stop or ENTER to restart..."
    read -t 3 -p "Auto-restarting in 3 seconds..." || true
    echo ""
  done
}

run_mobile() {
  cd "$ROOT_DIR/mobile"
  echo "=========================================="
  echo "📱 SurveyAgent Mobile Client (Expo SDK 54)"
  echo "=========================================="
  while true; do
    echo "[$(date '+%T')] Starting Expo Metro Bundler..."
    npx expo start -c || true
    echo ""
    echo "⚠️ Expo bundler exited. Press Ctrl+C to stop or ENTER to restart..."
    read -t 3 -p "Auto-restarting in 3 seconds..." || true
    echo ""
  done
}

case "$1" in
  backend)
    run_backend
    exit 0
    ;;
  mobile)
    run_mobile
    exit 0
    ;;
esac

launch_terminal() {
  TITLE="$1"
  CMD="$2"

  if command -v gnome-terminal &> /dev/null; then
    gnome-terminal --title="$TITLE" -- bash -c "$CMD"
    return 0
  elif command -v konsole &> /dev/null; then
    konsole --title "$TITLE" -e bash -c "$CMD"
    return 0
  elif command -v xfce4-terminal &> /dev/null; then
    xfce4-terminal --title="$TITLE" -e "bash -c '$CMD'"
    return 0
  elif command -v xterm &> /dev/null; then
    xterm -title "$TITLE" -e "bash -c '$CMD'" &
    return 0
  elif [ -n "$TMUX" ]; then
    tmux split-window -h "bash -c '$CMD'"
    return 0
  fi
  return 1
}

echo "=================================================="
echo "⚡ SurveyAgent Full-Stack Dev Launcher"
echo "=================================================="

if launch_terminal "SurveyAgent Backend API" "bash '$SCRIPT_PATH' backend"; then
  echo "✅ Launched Backend in a separate terminal window."
  launch_terminal "SurveyAgent Mobile (Expo SDK 54)" "bash '$SCRIPT_PATH' mobile"
  echo "✅ Launched Mobile App in a separate terminal window."
  echo ""
  echo "Both services are running in separate terminals with auto-restart enabled!"
  exit 0
fi

echo "ℹ️  No GUI terminal emulator detected."
echo "Launching Backend and Mobile in parallel with auto-restart..."
echo "Press Ctrl+C to stop all services."
echo ""

trap 'echo "Terminating dev servers..."; kill 0' EXIT INT TERM

run_backend &
run_mobile &

wait
