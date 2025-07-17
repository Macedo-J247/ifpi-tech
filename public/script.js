const API_URL = 'http://localhost:3000/api';

// Elementos do DOM
const postForm = document.getElementById('postForm');
const titleInput = document.getElementById('title');
const contentInput = document.getElementById('content');
const tagFilter = document.getElementById('tagFilter');
const postsContainer = document.getElementById('postsContainer');

// Carregar posts ao iniciar
loadPosts();

// Event listeners
postForm.addEventListener('submit', createPost);
tagFilter.addEventListener('change', loadPosts);

// Função para criar post
async function createPost(e) {
  e.preventDefault();

  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  if (!title || !content) {
    return;
  }

  // Obter tags selecionadas
  const selectedTags = [];
  const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
  checkboxes.forEach(checkbox => {
    selectedTags.push(checkbox.value);
  });

  try {
    const response = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        content,
        tags: selectedTags
      })
    });

    if (response.ok) {
      // Limpar formulário
      titleInput.value = '';
      contentInput.value = '';
      checkboxes.forEach(checkbox => checkbox.checked = false);

      // Recarregar posts
      loadPosts();
    }
  } catch (error) {
    console.error('Erro ao criar post:', error);
  }
}

// Função para carregar posts
async function loadPosts() {
  try {
    const selectedTag = tagFilter.value;
    const url = selectedTag === 'todas' ?
      `${API_URL}/posts` :
      `${API_URL}/posts?tag=${selectedTag}`;

    const response = await fetch(url);
    const posts = await response.json();

    renderPosts(posts);
  } catch (error) {
    console.error('Erro ao carregar posts:', error);
  }
}

// Função para renderizar posts
function renderPosts(posts) {
  postsContainer.innerHTML = '';

  posts.forEach(post => {
    const postElement = document.createElement('div');
    postElement.className = 'post';

    const date = new Date(post.createdAt).toLocaleDateString('pt-BR');

    postElement.innerHTML = `
                    <div class="post-header">
                        <h3>${post.title}</h3>
                        <div>
                            <span class="date">${date}</span>
                            <button class="delete-btn" onclick="deletePost('${post.id}')">Excluir</button>
                        </div>
                    </div>
                    <div class="post-tags">
                        ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <p class="post-content">${post.content}</p>
                    <div id="comments-${post.id}"></div>
                    <div class="comment-form">
                        <input type="text" class="comment-input" id="comment-${post.id}" placeholder="Digite aqui">
                        <button onclick="addComment('${post.id}')">Comentar</button>
                    </div>
                `;

    postsContainer.appendChild(postElement);

    // Carregar comentários do post
    loadComments(post.id);
  });
}

// Função para excluir post
async function deletePost(postId) {
  const confirmation = confirm('Tem certeza que deseja excluir este post?');
  if (!confirmation) return;

  try {
    const response = await fetch(`${API_URL}/posts/${postId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      loadPosts();
    }
  } catch (error) {
    console.error('Erro ao excluir post:', error);
  }
}

// Função para carregar comentários
async function loadComments(postId) {
  try {
    const response = await fetch(`${API_URL}/posts/${postId}/comments`);
    const comments = await response.json();

    renderComments(postId, comments);
  } catch (error) {
    console.error('Erro ao carregar comentários:', error);
  }
}

// Função para renderizar comentários
function renderComments(postId, comments) {
  const commentsContainer = document.getElementById(`comments-${postId}`);
  commentsContainer.innerHTML = '';

  comments.forEach(comment => {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment';

    const date = new Date(comment.createdAt).toLocaleDateString('pt-BR');

    commentElement.innerHTML = `
                    <div>${comment.text}</div>
                    <div class="date">${date}</div>
                `;

    commentsContainer.appendChild(commentElement);
  });
}

// Função para adicionar comentário
async function addComment(postId) {
  const commentInput = document.getElementById(`comment-${postId}`);
  const text = commentInput.value.trim();

  if (!text) return;

  try {
    const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text })
    });

    if (response.ok) {
      commentInput.value = '';
      loadComments(postId);
    }
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
  }
}
