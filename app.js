const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const sanitizeHtml = require('sanitize-html');
const { marked } = require('marked');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'main'))); // Servir arquivos estáticos da pasta 'main'

// Arquivos de dados
const POSTS_FILE = path.join(__dirname, 'data', 'posts.json');
const COMMENTS_FILE = path.join(__dirname, 'data', 'comments.json');

// Criar diretório data se não existir
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Inicializar arquivos se não existirem
if (!fs.existsSync(POSTS_FILE)) {
  fs.writeFileSync(POSTS_FILE, JSON.stringify([]));
}

if (!fs.existsSync(COMMENTS_FILE)) {
  fs.writeFileSync(COMMENTS_FILE, JSON.stringify([]));
}

// Funções auxiliares
function readPosts() {
  try {
    const data = fs.readFileSync(POSTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Erro ao ler posts:", error);
    return [];
  }
}

function writePosts(posts) {
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
}

function readComments() {
  try {
    const data = fs.readFileSync(COMMENTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Erro ao ler comentários:", error);
    return [];
  }
}

function writeComments(comments) {
  fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));
}

// Rotas da API

// Listar e Filtrar/Buscar/Ordenar posts
app.get('/api/posts', (req, res) => {
  let posts = readPosts();
  const { tag, search, sort, limit, skip } = req.query;
  const numLimit = parseInt(limit) || 5;
  const numSkip = parseInt(skip) || 0;

  // Filtrar por tag
  if (tag && tag !== 'todas') {
    posts = posts.filter(post => post.tags.includes(tag));
  }

  // Buscar por termo (título ou conteúdo)
  if (search) {
    const searchTerm = search.toLowerCase();
    posts = posts.filter(post =>
      post.title.toLowerCase().includes(searchTerm) ||
      post.content.toLowerCase().includes(searchTerm) // Busca também no conteúdo
    );
  }

  // Ordenar posts
  if (sort) {
    switch (sort) {
      case 'Mais Recente':
        posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'Mais Antigo':
        posts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'Maior número de likes':
        posts.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case 'Menor número de likes':
        posts.sort((a, b) => (a.likes || 0) - (b.likes || 0));
        break;
      case 'Maior número de dislikes':
        posts.sort((a, b) => (b.dislikes || 0) - (a.dislikes || 0));
        break;
      case 'Menor número de dislikes':
        posts.sort((a, b) => (a.dislikes || 0) - (b.dislikes || 0));
        break;
      case 'Maior número de comentários':
        // Conta comentários para cada post
        const comments = readComments();
        posts.forEach(post => {
          post.commentCount = comments.filter(comment => comment.postId === post.id).length;
        });
        posts.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
        break;
      case 'Menor número de comentários':
        const commentsCount = readComments();
        posts.forEach(post => {
          post.commentCount = commentsCount.filter(comment => comment.postId === post.id).length;
        });
        posts.sort((a, b) => (a.commentCount || 0) - (b.commentCount || 0));
        break;
      default:
        // Ordenação padrão por mais recente se nenhum critério válido for fornecido
        posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }
  } else {
      // Default sort by most recent if no sort criteria is provided
      posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }


  // Paginação
  const paginatedPosts = posts.slice(numSkip, numSkip + numLimit);
  res.json(paginatedPosts);
});

// Criar post
app.post('/api/posts', (req, res) => {
  const { title, content, tags } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Título e conteúdo são obrigatórios' });
  }

  const titleClean = sanitizeHtml(title);
  const contentClean = sanitizeHtml(marked(content)); // Processa Markdown e sanitiza

  const posts = readPosts();
  const newPost = {
    id: Date.now().toString(),
    title: titleClean,
    content: contentClean,
    tags: Array.isArray(tags) ? tags : (tags ? [tags] : []), // Garante que tags seja um array
    createdAt: new Date().toISOString(),
    likes: 0,
    dislikes: 0
  };

  posts.unshift(newPost); // Adicionar no início (cronologia reversa)
  writePosts(posts);
  res.status(201).json(newPost);
});

// Deletar post
app.delete('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const posts = readPosts();
  const index = posts.findIndex(post => post.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Post não encontrado' });
  }

  posts.splice(index, 1);
  writePosts(posts);

  // Remover comentários do post
  const comments = readComments();
  const filteredComments = comments.filter(comment => comment.postId !== id);
  writeComments(filteredComments);

  res.json({ message: 'Post deletado com sucesso' });
});

// LIKES/DISLIKES PARA POSTS
app.post('/api/posts/:id/like', (req, res) => {
  const { id } = req.params;
  const posts = readPosts();
  const postIndex = posts.findIndex(post => post.id === id);

  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post não encontrado' });
  }

  posts[postIndex].likes = (posts[postIndex].likes || 0) + 1;
  writePosts(posts);
  res.json({ likes: posts[postIndex].likes, dislikes: posts[postIndex].dislikes });
});

app.post('/api/posts/:id/dislike', (req, res) => {
  const { id } = req.params;
  const posts = readPosts();
  const postIndex = posts.findIndex(post => post.id === id);

  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post não encontrado' });
  }

  posts[postIndex].dislikes = (posts[postIndex].dislikes || 0) + 1;
  writePosts(posts);
  res.json({ likes: posts[postIndex].likes, dislikes: posts[postIndex].dislikes });
});


// Listar comentários de um post com paginação
app.get('/api/posts/:postId/comments', (req, res) => {
  const { postId } = req.params;
  const { limit, skip } = req.query;
  const numLimit = parseInt(limit) || 3; // Padrão de 3 comentários por carga
  const numSkip = parseInt(skip) || 0;

  const comments = readComments();
  const postComments = comments
    .filter(comment => comment.postId === postId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Cronologia reversa

  const paginatedComments = postComments.slice(numSkip, numSkip + numLimit);
  res.json(paginatedComments);
});

// Criar comentário
app.post('/api/posts/:postId/comments', (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Texto do comentário é obrigatório' });
  }

  const textClean = sanitizeHtml(marked(text)); // Processa Markdown e sanitiza

  const comments = readComments();
  const newComment = {
    id: Date.now().toString(),
    postId: postId,
    text: textClean,
    createdAt: new Date().toISOString(),
    likes: 0,
    dislikes: 0
  };

  comments.push(newComment);
  writeComments(comments);
  res.status(201).json(newComment);
});

// LIKES/DISLIKES PARA COMENTÁRIOS
app.post('/api/comments/:commentId/like', (req, res) => {
  const { commentId } = req.params;
  const comments = readComments();
  const commentIndex = comments.findIndex(comment => comment.id === commentId);

  if (commentIndex === -1) {
    return res.status(404).json({ error: 'Comentário não encontrado' });
  }

  comments[commentIndex].likes = (comments[commentIndex].likes || 0) + 1;
  writeComments(comments);
  res.json({ likes: comments[commentIndex].likes, dislikes: comments[commentIndex].dislikes });
});

app.post('/api/comments/:commentId/dislike', (req, res) => {
  const { commentId } = req.params;
  const comments = readComments();
  const commentIndex = comments.findIndex(comment => comment.id === commentId);

  if (commentIndex === -1) {
    return res.status(404).json({ error: 'Comentário não encontrado' });
  }

  comments[commentIndex].dislikes = (comments[commentIndex].dislikes || 0) + 1;
  writeComments(comments);
  res.json({ likes: comments[commentIndex].likes, dislikes: comments[commentIndex].dislikes });
});


// Servir página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'main', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});