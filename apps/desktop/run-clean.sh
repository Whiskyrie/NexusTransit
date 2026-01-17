#!/bin/bash

# Fechar instâncias antigas
pkill -9 -f nexustransit 2>/dev/null
pkill -9 -f NexusTransit 2>/dev/null

# Limpar cache completo do Tauri
rm -rf src-tauri/target
rm -rf ~/.cache/tauri*
rm -rf ~/.cache/*nexus*
rm -rf ~/.cache/icon-cache.db
rm -rf ~/.local/share/applications/*nexus*.desktop

# Limpar cache de ícones do sistema
rm -rf ~/.cache/thumbnails/*
gtk-update-icon-cache -f -t ~/.local/share/icons/hicolor/ 2>/dev/null || true

# Aguardar processos terminarem
sleep 2

echo "Cache limpo! Iniciando aplicativo..."

# Executar em modo dev
pnpm tauri dev
