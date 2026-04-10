// Banner - ASCII art
'use strict';

function printBanner(port) {
  const c = {
    purple: '\x1b[35m', cyan: '\x1b[36m', yellow: '\x1b[33m',
    green: '\x1b[32m', reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  };

  console.log(`
${c.purple}${c.bold}
  ███╗   ███╗██╗   ██╗██╗  ████████╗██╗███████╗████████╗██████╗ ███████╗ █████╗ ███╗   ███╗
  ████╗ ████║██║   ██║██║  ╚══██╔══╝██║██╔════╝╚══██╔══╝██╔══██╗██╔════╝██╔══██╗████╗ ████║
  ██╔████╔██║██║   ██║██║     ██║   ██║███████╗   ██║   ██████╔╝█████╗  ███████║██╔████╔██║
  ██║╚██╔╝██║██║   ██║██║     ██║   ██║╚════██║   ██║   ██╔══██╗██╔══╝  ██╔══██║██║╚██╔╝██║
  ██║ ╚═╝ ██║╚██████╔╝███████╗██║   ██║███████║   ██║   ██║  ██║███████╗██║  ██║██║ ╚═╝ ██║
  ╚═╝     ╚═╝ ╚═════╝ ╚══════╝╚═╝   ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝
${c.reset}${c.cyan}                    ██████╗ ██████╗  ██████╗ ${c.reset}
${c.cyan}                    ██╔══██╗██╔══██╗██╔═══██╗${c.reset}
${c.cyan}                    ██████╔╝██████╔╝██║   ██║${c.reset}
${c.cyan}                    ██╔═══╝ ██╔══██╗██║   ██║${c.reset}
${c.cyan}                    ██║     ██║  ██║╚██████╔╝${c.reset}
${c.cyan}                    ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ${c.reset}

${c.yellow}  Sistema Profesional de Transmisión en Vivo${c.reset}
${c.dim}  OBS + Restream + YouTube + Facebook + Instagram${c.reset}
  ${c.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}
${c.cyan}${c.bold}  Servidor Corriendo en: http://localhost:${port} ${c.reset}
  ${c.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}
`);
}

module.exports = { printBanner };
