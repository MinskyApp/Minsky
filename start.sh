#!/bin/bash
# =====================================================
# MultiStream Pro — Script de inicio
# =====================================================

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║     MultiStream Pro — Iniciando      ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"

# ── Verificar Node.js ──────────────────────────────
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado. Instala Node.js >= 18${NC}"
    exit 1
fi

NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VER" -lt 18 ]; then
    echo -e "${RED}❌ Requiere Node.js >= 18 (actual: $(node -v))${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) detectado${NC}"

# ── Copiar .env si no existe ───────────────────────
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Archivo .env creado desde .env.example"
        echo -e "   Edita .env con tus credenciales antes de continuar${NC}"
        echo ""
        echo -e "${YELLOW}Abre el archivo: nano .env${NC}"
        echo ""
        read -p "¿Continuar de todas formas? (s/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Ss]$ ]]; then
            exit 0
        fi
    fi
fi

# ── Instalar dependencias ──────────────────────────
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Instalando dependencias...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependencias instaladas${NC}"
fi

# ── Crear directorios necesarios ───────────────────
mkdir -p logs recordings

# ── Iniciar aplicación ────────────────────────────
echo ""
echo -e "${GREEN}🚀 Iniciando MultiStream Pro...${NC}"
echo -e "${BLUE}   Dashboard: http://localhost:${PORT:-3000}${NC}"
echo ""

node src/index.js
