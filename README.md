# Gerador de Artes Metrópole

Site (React + Vite + Canvas) para corretores da Imobiliária Metrópole gerarem artes de **Venda** e **Locação** em PNG real **1080×1920** (Stories) e **1080×1080** (Feed). Funciona 100% no navegador: sem login, sem banco de dados, sem APIs externas. As fotos são processadas localmente.

## Rodar localmente
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera a pasta dist/
```
Requer Node.js 18+.

## Publicar no GitHub Pages
1. Crie um repositório no GitHub e envie estes arquivos (branch `main`).
2. Em **Settings → Pages → Source**, escolha **GitHub Actions**.
3. A cada push, o workflow `.github/workflows/deploy.yml` compila e publica. O site fica em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

O `vite.config.js` usa `base: './'`, então funciona em qualquer subpasta sem ajustes.

## Estrutura
- `src/render.js`: motor de desenho em Canvas (layout vertical oficial e adaptação do quadrado, coordenadas no topo do arquivo).
- `src/App.jsx`: fluxo em 5 etapas (modalidade, dados, fotos, pré-visualização, exportação).
- `src/assets/`: `logo.png` e `capi.png` (originais, apenas recortados das margens transparentes) e `paper.jpg` (fundo de papel amassado).

A logo e o Capi são desenhados em posição e proporção fixas; o usuário não consegue movê-los nem alterá-los. A exportação usa `canvas.toBlob` em resolução nativa, nunca captura de tela.
