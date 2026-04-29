// Хранилище данных
let users = JSON.parse(localStorage.getItem('users')) || [];
let tickets = JSON.parse(localStorage.getItem('tickets')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// Инициализация тестового админа
if (users.length === 0) {
    users.push({
        id: 1,
        username: 'admin',
        password: 'admin123',
        role: 'admin'
    });
    localStorage.setItem('users', JSON.stringify(users));
}

// Функции для работы с данными
function saveData() {
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('tickets', JSON.stringify(tickets));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    
    const main = document.getElementById('main');
    main.insertBefore(messageDiv, main.firstChild);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Создание тикета
function createTicket(subject, message) {
    const ticket = {
        id: Date.now(),
        userId: currentUser.id,
        username: currentUser.username,
        subject: subject,
        message: message,
        status: 'new',
        createdAt: new Date().toISOString(),
        replies: []
    };
    
    tickets.push(ticket);
    saveData();
    showMessage('Тикет создан!', 'success');
    renderMain();
}

// Ответ на тикет
function replyToTicket(ticketId, replyMessage) {
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
        ticket.replies.push({
            userId: currentUser.id,
            username: currentUser.username,
            message: replyMessage,
            createdAt: new Date().toISOString()
        });
        
        if (currentUser.role === 'admin' && ticket.status === 'new') {
            ticket.status = 'in-progress';
        }
        
        saveData();
        showMessage('Ответ добавлен!', 'success');
        renderMain();
    }
}

// Обновление статуса тикета
function updateTicketStatus(ticketId, status) {
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
        ticket.status = status;
        saveData();
        showMessage('Статус обновлен!', 'success');
        renderMain();
    }
}

// Добавление админа
function addAdmin(username, password) {
    if (users.find(u => u.username === username)) {
        showMessage('Пользователь уже существует!', 'error');
        return false;
    }
    
    users.push({
        id: Date.now(),
        username: username,
        password: password,
        role: 'admin'
    });
    
    saveData();
    showMessage('Админ добавлен!', 'success');
    return true;
}

// Рендер главной страницы
function renderMain() {
    const main = document.getElementById('main');
    
    if (!currentUser) {
        main.innerHTML = `
            <div style="text-align: center;">
                <h2>Добро пожаловать в систему поддержки!</h2>
                <p>Пожалуйста, войдите или зарегистрируйтесь, чтобы создать обращение.</p>
                <button onclick="showAuthModal('login')">Войти</button>
                <button onclick="showAuthModal('register')">Регистрация</button>
            </div>
        `;
        return;
    }
    
    if (currentUser.role === 'admin') {
        renderAdminPanel();
    } else {
        renderUserPanel();
    }
}

function renderUserPanel() {
    const userTickets = tickets.filter(t => t.userId === currentUser.id);
    
    const html = `
        <div class="ticket-form">
            <h2>Создать обращение</h2>
            <input type="text" id="ticket-subject" placeholder="Тема">
            <textarea id="ticket-message" rows="5" placeholder="Ваше сообщение"></textarea>
            <button onclick="createTicket(document.getElementById('ticket-subject').value, document.getElementById('ticket-message').value)">Отправить</button>
        </div>
        
        <div class="tickets-list">
            <h2>Мои обращения</h2>
            ${userTickets.length === 0 ? '<p>У вас пока нет обращений</p>' : userTickets.map(ticket => renderTicket(ticket)).join('')}
        </div>
    `;
    
    document.getElementById('main').innerHTML = html;
}

function renderAdminPanel() {
    const html = `
        <div class="admin-panel">
            <h2>Панель администратора</h2>
            <div style="margin-bottom: 20px;">
                <h3>Добавить администратора</h3>
                <input type="text" id="new-admin-username" placeholder="Имя пользователя">
                <input type="password" id="new-admin-password" placeholder="Пароль">
                <button onclick="addAdmin(document.getElementById('new-admin-username').value, document.getElementById('new-admin-password').value)">Добавить админа</button>
            </div>
            
            <div class="tickets-list">
                <h3>Все обращения</h3>
                ${tickets.length === 0 ? '<p>Нет обращений</p>' : tickets.map(ticket => renderAdminTicket(ticket)).join('')}
            </div>
        </div>
    `;
    
    document.getElementById('main').innerHTML = html;
}

function renderTicket(ticket) {
    return `
        <div class="ticket">
            <div class="ticket-header">
                <span>${ticket.subject}</span>
                <span class="ticket-status status-${ticket.status}">${ticket.status === 'new' ? 'Новое' : ticket.status === 'in-progress' ? 'В обработке' : 'Решено'}</span>
            </div>
            <div class="ticket-message">${ticket.message}</div>
            <div><small>${new Date(ticket.createdAt).toLocaleString()}</small></div>
            ${ticket.replies.map(reply => `
                <div class="ticket-reply">
                    <strong>${reply.username}:</strong> ${reply.message}
                    <br><small>${new Date(reply.createdAt).toLocaleString()}</small>
                </div>
            `).join('')}
            <div style="margin-top: 10px;">
                <textarea id="reply-${ticket.id}" rows="2" placeholder="Ваш ответ"></textarea>
                <button onclick="replyToTicket(${ticket.id}, document.getElementById('reply-${ticket.id}').value)">Ответить</button>
            </div>
        </div>
    `;
}

function renderAdminTicket(ticket) {
    return `
        <div class="ticket">
            <div class="ticket-header">
                <span><strong>${ticket.username}:</strong> ${ticket.subject}</span>
                <select onchange="updateTicketStatus(${ticket.id}, this.value)">
                    <option value="new" ${ticket.status === 'new' ? 'selected' : ''}>Новое</option>
                    <option value="in-progress" ${ticket.status === 'in-progress' ? 'selected' : ''}>В обработке</option>
                    <option value="resolved" ${ticket.status === 'resolved' ? 'selected' : ''}>Решено</option>
                </select>
            </div>
            <div class="ticket-message">${ticket.message}</div>
            <div><small>${new Date(ticket.createdAt).toLocaleString()}</small></div>
            ${ticket.replies.map(reply => `
                <div class="ticket-reply">
                    <strong>${reply.username}:</strong> ${reply.message}
                    <br><small>${new Date(reply.createdAt).toLocaleString()}</small>
                </div>
            `).join('')}
            <div style="margin-top: 10px;">
                <textarea id="reply-${ticket.id}" rows="2" placeholder="Ответ администратора"></textarea>
                <button onclick="replyToTicket(${ticket.id}, document.getElementById('reply-${ticket.id}').value)">Ответить</button>
            </div>
        </div>
    `;
}

// Аутентификация
function showAuthModal(type) {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const usernameInput = document.getElementById('modal-username');
    const passwordInput = document.getElementById('modal-password');
    
    title.textContent = type === 'login' ? 'Вход' : 'Регистрация';
    usernameInput.value = '';
    passwordInput.value = '';
    
    modal.style.display = 'flex';
    window.authType = type;
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

function handleAuth() {
    const username = document.getElementById('modal-username').value;
    const password = document.getElementById('modal-password').value;
    
    if (window.authType === 'login') {
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            currentUser = user;
            saveData();
            closeModal();
            renderMain();
            renderNav();
            showMessage('Добро пожаловать!', 'success');
        } else {
            showMessage('Неверное имя пользователя или пароль!', 'error');
        }
    } else {
        if (users.find(u => u.username === username)) {
            showMessage('Пользователь уже существует!', 'error');
        } else {
            users.push({
                id: Date.now(),
                username: username,
                password: password,
                role: 'user'
            });
            saveData();
            showMessage('Регистрация успешна! Теперь войдите.', 'success');
            closeModal();
            showAuthModal('login');
        }
    }
}

function logout() {
    currentUser = null;
    saveData();
    renderMain();
    renderNav();
    showMessage('Вы вышли из системы', 'success');
}

function renderNav() {
    const nav = document.getElementById('nav');
    if (currentUser) {
        nav.innerHTML = `
            <span style="color: #333; padding: 10px;">Привет, ${currentUser.username} (${currentUser.role === 'admin' ? 'Админ' : 'Пользователь'})</span>
            <button onclick="logout()">Выйти</button>
        `;
    } else {
        nav.innerHTML = `
            <button onclick="showAuthModal('login')">Вход</button>
            <button onclick="showAuthModal('register')">Регистрация</button>
        `;
    }
}

// Инициализация
renderNav();
renderMain();
