const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

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
    return [];
  }
}

function writeComments(comments) {
  fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));
}

// Rotas da API

// Listar posts
app.get('/api/posts', (req, res) => {
  const posts = readPosts();
  const { tag } = req.query;

  if (tag && tag !== 'todas') {
    const filteredPosts = posts.filter(post => post.tags.includes(tag));
    res.json(filteredPosts);
  } else {
    res.json(posts);
  }
});

// Criar post
app.post('/api/posts', (req, res) => {
  const { title, content, tags } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Título e conteúdo são obrigatórios' });
  }

  const posts = readPosts();
  const newPost = {
    id: Date.now().toString(),
    title,
    content,
    tags: tags || [],
    createdAt: new Date().toISOString()
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

// Listar comentários de um post
app.get('/api/posts/:id/comments', (req, res) => {
  const { id } = req.params;
  const comments = readComments();
  const postComments = comments
    .filter(comment => comment.postId === id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Cronologia reversa

  res.json(postComments);
});

// Criar comentário
app.post('/api/posts/:id/comments', (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Texto do comentário é obrigatório' });
  }

  const comments = readComments();
  const newComment = {
    id: Date.now().toString(),
    postId: id,
    text,
    createdAt: new Date().toISOString()
  };

  comments.push(newComment);
  writeComments(comments);
  res.status(201).json(newComment);
});

// Servir página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
