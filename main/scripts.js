const API_URL = 'http://localhost:3000/api';

// Variáveis globais para controle de paginação e filtros
let currentPage = 1;
let currentTag = '';
let currentSearchTerm = '';
let currentSortCriteria = '';

// Elementos do DOM (atualizados para corresponder ao HTML e novas funcionalidades)
const postForm = document.getElementById('postForm');
const titleInput = document.getElementById('title');
// Alterado de 'content' para 'contentPost' para evitar conflito com input de comentário
const contentInput = document.getElementById('contentPost');
const tagFilterSelect = document.getElementById('tagFilter'); // Filtro de tags na coluna esquerda
const postsContainer = document.getElementById('posts-container'); // Container principal de posts
const searchInput = document.getElementById('search'); // Campo de busca
const searchButton = document.getElementById('searchButton'); // Botão de busca
const groupFilterSelect = document.getElementById('groupFilter'); // Filtro de ordenação
const loadMorePostsBtn = document.getElementById('loadMorePostsBtn'); // Botão Carregar Mais Posts

// Carregar posts ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadPosts();

    // Event Listeners para filtros, busca e ordenação
    if (tagFilterSelect) {
        tagFilterSelect.addEventListener('change', () => {
            currentTag = tagFilterSelect.value;
            currentPage = 1; // Reinicia a paginação
            loadPosts();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                currentSearchTerm = searchInput.value;
                currentPage = 1; // Reinicia a paginação
                loadPosts();
            }
        });
    }

    if (searchButton) {
        searchButton.addEventListener('click', () => {
            currentSearchTerm = searchInput.value;
            currentPage = 1; // Reinicia a paginação
            loadPosts();
        });
    }

    if (groupFilterSelect) {
        groupFilterSelect.addEventListener('change', () => {
            currentSortCriteria = groupFilterSelect.value;
            currentPage = 1; // Reinicia a paginação
            loadPosts();
        });
    }

    // Event Listener para o botão "Carregar Mais Posts"
    if (loadMorePostsBtn) {
        loadMorePostsBtn.addEventListener('click', () => {
            loadPosts(); // Apenas chama loadPosts, as variáveis globais já contêm os critérios
        });
    }

    // Event Listener para o formulário de nova postagem
    if (postForm) {
        postForm.addEventListener('submit', createPost);
        // Adiciona funcionalidade ao botão "Limpar" do formulário de postagem
        const clearPostFormBtn = postForm.querySelector('.btn-delete');
        if (clearPostFormBtn) {
            clearPostFormBtn.addEventListener('click', () => {
                postForm.reset();
            });
        }
    }
});

// Função para criar post
async function createPost(e) {
    e.preventDefault();

    const title = titleInput.value.trim();
    const content = contentInput.value.trim(); // Usando contentPost
    const tagSelectPost = document.getElementById('tagFilterPost'); // Obter a tag do formulário de postagem
    const selectedTag = tagSelectPost ? tagSelectPost.value : 'todas';
    const tags = selectedTag === 'todas' ? [] : [selectedTag];

    if (!title || !content) {
        alert('Título e conteúdo são obrigatórios!');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                content,
                tags: tags
            })
        });

        if (response.ok) {
            alert('Postagem criada com sucesso!');
            // Limpar formulário
            titleInput.value = '';
            contentInput.value = '';
            if (tagSelectPost) tagSelectPost.value = 'todas';

            currentPage = 1; // Reinicia a paginação
            loadPosts(); // Recarregar posts para mostrar o novo

            // Opcional: fechar a coluna direita após a postagem
            toggleColuna('direita');
        } else {
            const errorData = await response.json();
            alert(`Erro ao criar post: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Erro ao criar post:', error);
        alert('Erro ao conectar com o servidor para criar post.');
    }
}

// Função para carregar posts
async function loadPosts() {
    // Limpa posts existentes apenas se for uma nova filtragem/busca/ordenação ou primeira carga
    if (currentPage === 1) {
        postsContainer.innerHTML = '';
    }

    const limit = 5; // Número de posts por carga
    const skip = (currentPage - 1) * limit;

    let url = `${API_URL}/posts?limit=${limit}&skip=${skip}`;

    if (currentTag && currentTag !== 'todas') {
        url += `&tag=${encodeURIComponent(currentTag)}`;
    }
    if (currentSearchTerm) {
        url += `&search=${encodeURIComponent(currentSearchTerm)}`;
    }
    if (currentSortCriteria && currentSortCriteria !== 'todas') {
        url += `&sort=${encodeURIComponent(currentSortCriteria)}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const posts = await response.json();

        if (posts.length === 0 && currentPage === 1) {
            postsContainer.innerHTML = '<p style="text-align: center;"> Nenhum post encontrado com os critérios. </p>';
            loadMorePostsBtn.style.display = 'none';
            return;
        } else if (posts.length === 0) {
            loadMorePostsBtn.style.display = 'none';
            return;
        }

        renderPosts(posts);

        loadMorePostsBtn.style.display = posts.length === limit ? 'block' : 'none';
        currentPage++;

    } catch (error) {
        console.error('Erro ao carregar posts:', error);
        postsContainer.innerHTML = '<p>Erro ao carregar posts. Tente novamente mais tarde.</p>';
    }
}

// Função para renderizar posts
function renderPosts(posts) {
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.classList.add('post'); // Usando classList.add
        postElement.setAttribute('data-post-id', post.id);

        const date = new Date(post.createdAt).toLocaleDateString('pt-BR');

        postElement.innerHTML = `
            <div class="post-header">
                <span>
                    <ul>
                        <li><strong>${post.title}</strong></li>
                        <li><span class="date">${date}</span></li>
                    </ul>
                </span>
                <button type="button" class="delete" onclick="deletePost('${post.id}')">
                    &Cross;
                </button>
            </div>
            <div class="post-tags">
                ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <div class="post-content">
                ${post.content}
            </div>
            <div class="post-actions">
                <button type="button" class="like" onclick="handleLikeDislike('${post.id}', 'post', 'like', this)">
                    &bigtriangleup; <span class="count">${post.likes || 0}</span>
                </button>
                <button type="button" class="dislike" onclick="handleLikeDislike('${post.id}', 'post', 'dislike', this)">
                    &bigtriangledown; <span class="count">${post.dislikes || 0}</span>
                </button>
            </div>
            <div class="comment-section">
                <div id="caixa-comentario">
                    <textarea class="comment-input" rows="3" placeholder="Deixe seu comentário..."></textarea>
                </div>
                <div id="botoes-comentario">
                    <button type="submit" class="btn-enviar" onclick="submitComment('${post.id}', this)"> Publicar </button>
                    <button type="button" class="btn-delete" onclick="clearCommentInput(this)"> Limpar </button>
                </div>
                <div class="comments-container">
                    </div>
                <button class="loadMoreCommentsBtn btn-enviar" type="button" onclick="loadMoreComments('${post.id}', this)" style="display: none;">Carregar Mais Comentários</button>
            </div>
        `;

        postsContainer.appendChild(postElement);

        // Carregar comentários do post (apenas a primeira página)
        loadCommentsForPost(post.id, postElement.querySelector('.comments-container'), 1);
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
            alert('Post deletado com sucesso!');
            document.querySelector(`.post[data-post-id="${postId}"]`).remove();
            currentPage = 1; // Recarrega a primeira página para garantir a exibição correta
            loadPosts();
        } else {
            const errorData = await response.json();
            alert(`Erro ao deletar post: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Erro ao excluir post:', error);
        alert('Erro ao conectar com o servidor para deletar post.');
    }
}

// Função para lidar com likes e dislikes de posts e comentários
async function handleLikeDislike(id, type, action, button) {
    let url;
    if (type === 'post') {
        url = `${API_URL}/posts/${id}/${action}`;
    } else if (type === 'comment') {
        url = `${API_URL}/comments/${id}/${action}`;
    } else {
        console.error('Tipo inválido para like/dislike:', type);
        return;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (response.ok) {
            const data = await response.json();
            const countSpan = button.querySelector('.count');
            countSpan.textContent = action === 'like' ? data.likes : data.dislikes;
        } else {
            const errorData = await response.json();
            console.error(`Erro ao ${action} ${type}:`, errorData.error);
        }
    } catch (error) {
        console.error(`Erro ao conectar com o servidor para ${action} ${type}:`, error);
    }
}

// Função para enviar um comentário
async function submitComment(postId, button) {
    const commentInput = button.closest('.comment-section').querySelector('.comment-input');
    const text = commentInput.value.trim();

    if (!text) {
        alert('O comentário não pode estar vazio!');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });
        if (response.ok) {
            commentInput.value = ''; // Limpa o input
            const commentsContainer = button.closest('.comment-section').querySelector('.comments-container');
            // Reseta a página para 1 para carregar os comentários do início e incluir o novo
            commentsContainer.nextElementSibling.setAttribute('data-current-page', 1);
            loadCommentsForPost(postId, commentsContainer, 1);
        } else {
            const errorData = await response.json();
            alert(`Erro ao publicar comentário: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Erro ao enviar comentário:', error);
        alert('Erro ao conectar com o servidor para publicar comentário.');
    }
}

// Função para limpar o input de comentário
function clearCommentInput(button) {
    button.closest('.comment-section').querySelector('.comment-input').value = '';
}

// Função para carregar e exibir comentários para um post específico
async function loadCommentsForPost(postId, commentsContainer, page = 1) {
    const limit = 3; // Número de comentários por carga
    const skip = (page - 1) * limit;

    try {
        const response = await fetch(`${API_URL}/posts/${postId}/comments?limit=${limit}&skip=${skip}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const newComments = await response.json();

        if (page === 1) {
            commentsContainer.innerHTML = ''; // Limpa comentários existentes apenas na primeira carga
        }

        if (newComments.length === 0 && page === 1) {
            commentsContainer.innerHTML = '<p style="text-align: center;">Nenhum comentário ainda. Seja o primeiro a comentar!</p>';
            const loadMoreBtn = commentsContainer.nextElementSibling;
            if (loadMoreBtn && loadMoreBtn.classList.contains('loadMoreCommentsBtn')) {
                loadMoreBtn.style.display = 'none';
            }
            return;
        } else if (newComments.length === 0) {
            const loadMoreBtn = commentsContainer.nextElementSibling;
            if (loadMoreBtn && loadMoreBtn.classList.contains('loadMoreCommentsBtn')) {
                loadMoreBtn.style.display = 'none';
            }
            return;
        }

        newComments.forEach(comment => {
            const commentElement = createCommentElement(comment);
            commentsContainer.appendChild(commentElement);
        });

        const loadMoreBtn = commentsContainer.nextElementSibling;
        if (loadMoreBtn && loadMoreBtn.classList.contains('loadMoreCommentsBtn')) {
            loadMoreBtn.style.display = newComments.length === limit ? 'block' : 'none';
            loadMoreBtn.setAttribute('data-current-page', page + 1);
        }

    } catch (error) {
        console.error(`Erro ao carregar comentários para o post ${postId}:`, error);
        commentsContainer.innerHTML = '<p>Erro ao carregar comentários. Tente novamente.</p>';
    }
}

// Função para lidar com o clique do botão "Carregar Mais Comentários"
function loadMoreComments(postId, button) {
    const commentsContainer = button.previousElementSibling; // Pega o container de comentários
    let currentPage = parseInt(button.getAttribute('data-current-page') || 1);
    loadCommentsForPost(postId, commentsContainer, currentPage);
}

// Função para criar um elemento HTML de comentário
function createCommentElement(comment) {
    const commentElement = document.createElement('div');
    commentElement.classList.add('comment');
    commentElement.setAttribute('data-comment-id', comment.id);

    const formattedDate = new Date(comment.createdAt).toLocaleDateString('pt-BR');

    commentElement.innerHTML = `
        <span>
            <ul>
                <li><span class="date">${formattedDate}</span></li>
            </ul>
        </span>
        <p>${comment.text}</p>
        <div class="comment-actions">
            <button type="button" class="like" onclick="handleLikeDislike('${comment.id}', 'comment', 'like', this)">
                &bigtriangleup; <span class="count">${comment.likes || 0}</span>
            </button>
            <button type="button" class="dislike" onclick="handleLikeDislike('${comment.id}', 'comment', 'dislike', this)">
                &bigtriangledown; <span class="count">${comment.dislikes || 0}</span>
            </button>
        </div>
    `;
    return commentElement;
}

// Funções para as barras laterais (movidas do index.html para centralizar)
function toggleColuna(id) {
    const coluna = document.getElementById(id);
    if (coluna) {
        coluna.classList.toggle('ativo');
        const btnEsquerda = document.querySelector('.btn-esquerda');
        const btnDireita = document.querySelector('.btn-direita');

        if (id === 'esquerda') {
            if (coluna.classList.contains('ativo')) {
                if (btnEsquerda) btnEsquerda.classList.add('btn-oculto');
            } else {
                if (btnEsquerda) btnEsquerda.classList.remove('btn-oculto');
            }
        } else if (id === 'direita') {
            if (coluna.classList.contains('ativo')) {
                if (btnDireita) btnDireita.classList.add('btn-oculto');
            } else {
                if (btnDireita) btnDireita.classList.remove('btn-oculto');
            }
        }
    }
}

// Expondo funções para o escopo global 
window.deletePost = deletePost;
window.handleLikeDislike = handleLikeDislike;
window.submitComment = submitComment;
window.clearCommentInput = clearCommentInput;
window.loadMoreComments = loadMoreComments;
window.toggleColuna = toggleColuna;