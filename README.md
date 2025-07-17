# Rede Social do IFPI

Aplicação que implementa um blog com comentários.

## Setup

1. Clone este repositório
2. Navege até a pasta `ifpi-tech`
3. Execute `npm install`
4. Execute `node app.js`
5. Abra a página [http://localhost:3000](http://localhost:3000)

## Roadmap

- [x] Implementar a persistência de objetos
    - Persistência de obejetos por meio de arquivos `json`
- [x] Implementar comentários nas postagens
- [x] Implementar exclusão de postagens com confirmação
    - Confirmação por meio do `confirm()`, pode não ser uma boa experiência de usuário
- [x] Implementar uma listagem de comentários em cronologia reversa
- [x] Implementar 3 funcionalidades extras
    - [x] Tags para postagens
        - Tags são estáticas e client-side, talvez trocar para server-side
    - [x] Filtrar postagens por tags
    - [ ] Tratar input do usuário
        - `\n` não funciona
        - Restringir HTML
        - Renderizar Markdown
    
## Grupo

- Rafael
- José Macedo
- Hélio
- Emanoel
