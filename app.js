// Profile picture preview for registration
const regProfilePicInput = document.getElementById('reg-profile-pic');
const regProfilePicPreview = document.getElementById('reg-profile-pic-preview');
if (regProfilePicInput && regProfilePicPreview) {
    regProfilePicInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                regProfilePicPreview.src = evt.target.result;
                regProfilePicPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            regProfilePicPreview.src = '';
            regProfilePicPreview.style.display = 'none';
        }
    });
}
// ==== Chat Room Action Buttons ====
const clearChatBtn = document.getElementById('clear-chat-btn');
const chatLogoutBtn = document.getElementById('chat-logout-btn');
const setUsernameInput = document.getElementById('set-username-input');
const setUsernameBtn = document.getElementById('set-username-btn');
if (clearChatBtn) {
    clearChatBtn.onclick = function() {
        if (confirm('Are you sure you want to clear the chat on your side?')) {
            chatWindow.innerHTML = '';
            localStorage.setItem('chatroom_cleared', Date.now());
        }
    };
}
if (chatLogoutBtn) {
    chatLogoutBtn.onclick = function() {
        firebase.auth().signOut();
    };
}
// Landing page Exit button
const landingExitBtn = document.getElementById('landing-exit');
if (landingExitBtn) landingExitBtn.onclick = function() {
    window.open('', '_self', '');
    window.close();
};
// ==== Form Navigation Buttons ====
function showLanding() {
    landingPage.style.display = '';
    authContainer.style.display = 'none';
    regForm.style.display = 'none';
    loginForm.style.display = 'none';
}

// Register form buttons
const regMainMenuBtn = document.getElementById('reg-main-menu');
const regExitBtn = document.getElementById('reg-exit');
if (regMainMenuBtn) regMainMenuBtn.onclick = showLanding;
if (regExitBtn) regExitBtn.onclick = function() {
    window.open('', '_self', '');
    window.close();
};

// Login form buttons
const loginMainMenuBtn = document.getElementById('login-main-menu');
const loginExitBtn = document.getElementById('login-exit');
if (loginMainMenuBtn) loginMainMenuBtn.onclick = showLanding;
if (loginExitBtn) loginExitBtn.onclick = function() {
    window.open('', '_self', '');
    window.close();
};
// ==== Firebase Config (Updated with your credentials) ====
const firebaseConfig = {
    apiKey: "AIzaSyDksNBzebLKG_a7I-K9PaeyY69OWcIAA_c",
    authDomain: "chartroom-a66d6.firebaseapp.com",
    databaseURL: "https://chartroom-a66d6-default-rtdb.firebaseio.com",
    projectId: "chartroom-a66d6",
    storageBucket: "chartroom-a66d6.appspot.com",
    messagingSenderId: "663647054887",
    appId: "1:663647054887:web:02075514ff18306a463202"
};

// ==== Initialize Firebase ====
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ==== DOM Elements ====
const chatWindow = document.getElementById('chat-window');
const nameInput = document.getElementById('name-input');
const recipientInput = document.getElementById('recipient-input');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
// Auth elements
const regForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const regError = document.getElementById('reg-error');
const loginError = document.getElementById('login-error');
const authForms = document.getElementById('auth-forms');
const authUserInfo = document.getElementById('auth-user-info');
const authUserLabel = document.getElementById('auth-user-label');
const logoutBtn = document.getElementById('logout-btn');
const chatContainer = document.querySelector('.chat-container');
const landingPage = document.getElementById('landing-page');
const authContainer = document.getElementById('auth-container');
const showRegisterBtn = document.getElementById('show-register');
const showLoginBtn = document.getElementById('show-login');
// ==== Landing Page Logic ====
if (showRegisterBtn && showLoginBtn) {
    showRegisterBtn.onclick = function() {
        landingPage.style.display = 'none';
        authContainer.style.display = '';
        regForm.style.display = '';
        loginForm.style.display = 'none';
    };
    showLoginBtn.onclick = function() {
        landingPage.style.display = 'none';
        authContainer.style.display = '';
        regForm.style.display = 'none';
        loginForm.style.display = '';
    };
}
// Show landing page on logout
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        landingPage.style.display = 'none';
        authContainer.style.display = 'none';
        // ...existing code...
    } else {
        landingPage.style.display = '';
        authContainer.style.display = 'none';
        // ...existing code...
    }
// End of onAuthStateChanged

// ==== Notification Permission ====
if ("Notification" in window) {
    if (Notification.permission === "default") {
        Notification.requestPermission();
    }
}


// ==== Auth Logic ====


regForm.onsubmit = async function(e) {
    e.preventDefault();
    regError.textContent = '';
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const profilePicFile = regProfilePicInput ? regProfilePicInput.files[0] : null;
    if (!username) {
        regError.textContent = 'Username is required.';
        return;
    }
    try {
        // Check if username already exists
        const snapshot = await firebase.database().ref('usernames/' + username).once('value');
        if (snapshot.exists()) {
            regError.textContent = 'Username already taken. Please choose another.';
            return;
        }
        // Create user
        await firebase.auth().createUserWithEmailAndPassword(email, password);
        let photoURL = '';
        const user = firebase.auth().currentUser;
        if (profilePicFile) {
            // Upload profile picture to Firebase Storage
            const storageRef = firebase.storage().ref();
            const picRef = storageRef.child('profile_pics/' + user.uid + '_' + Date.now());
            await picRef.put(profilePicFile);
            photoURL = await picRef.getDownloadURL();
        }
        await user.updateProfile({ displayName: username, photoURL });
        // Save username to database for uniqueness
        await firebase.database().ref('usernames/' + username).set({ uid: user.uid });
        // Sign out after registration so user logs in with username set
        await firebase.auth().signOut();
        // Only show a notice, do not show login or chat room
        regError.textContent = 'Registration successful! Please log in using the Login button.';
        regForm.reset();
        if (regProfilePicPreview) {
            regProfilePicPreview.src = '';
            regProfilePicPreview.style.display = 'none';
        }
        // Keep registration form visible, hide login form
        regForm.style.display = '';
        loginForm.style.display = 'none';
    } catch (err) {
        regError.textContent = err.message;
    }
};

loginForm.onsubmit = async function(e) {
    e.preventDefault();
    loginError.textContent = '';
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
    } catch (err) {
        loginError.textContent = err.message;
    }
};

logoutBtn.onclick = function() {
    firebase.auth().signOut();
};

const authUserPic = document.getElementById('auth-user-pic');
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        // Show chat, hide auth
        authForms.style.display = 'none';
        authUserInfo.style.display = 'flex';
        chatContainer.style.display = '';
        authUserLabel.textContent = `Logged in as ${user.displayName || ''}`;
        nameInput.value = user.displayName || '';
        nameInput.disabled = true;
        // Show username set UI if missing
        if (!user.displayName) {
            setUsernameInput.style.display = '';
            setUsernameBtn.style.display = '';
        } else {
            setUsernameInput.style.display = 'none';
            setUsernameBtn.style.display = 'none';
        }
        if (authUserPic) {
            if (user.photoURL) {
                authUserPic.src = user.photoURL;
                authUserPic.style.display = 'inline-block';
            } else {
                authUserPic.style.display = 'none';
            }
        }
    } else {
        setUsernameInput.style.display = 'none';
        setUsernameBtn.style.display = 'none';
        // Hide chat, show auth
        authForms.style.display = '';
        authUserInfo.style.display = 'none';
        chatContainer.style.display = 'none';
        nameInput.value = '';
        nameInput.disabled = false;
        if (authUserPic) authUserPic.style.display = 'none';
    }
});

// Set/Update Username logic
if (setUsernameBtn && setUsernameInput) {
    setUsernameBtn.onclick = async function() {
        const newUsername = setUsernameInput.value.trim();
        if (!newUsername) {
            alert('Username cannot be empty.');
            return;
        }
        // Check if username already exists
        const snapshot = await firebase.database().ref('usernames/' + newUsername).once('value');
        if (snapshot.exists()) {
            alert('Username already taken. Please choose another.');
            return;
        }
        const user = firebase.auth().currentUser;
        if (!user) return;
        await user.updateProfile({ displayName: newUsername });
        await firebase.database().ref('usernames/' + newUsername).set({ uid: user.uid });
        // Optionally: remove old username from DB if needed
        setUsernameInput.style.display = 'none';
        setUsernameBtn.style.display = 'none';
        nameInput.value = newUsername;
        authUserLabel.textContent = `Logged in as ${newUsername}`;
        alert('Username updated!');
    };
}
});

// ==== Send Message ====
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    const name = user.displayName || 'Anonymous';
    const recipient = recipientInput.value.trim();
    const text = messageInput.value.trim();
    if (!text) return;
    const timestamp = Date.now();
    const msgData = {
        name,
        text,
        timestamp,
        photoURL: user.photoURL || ''
    };
    if (recipient) {
        msgData.recipient = recipient;
    }
    if (replyTo) {
        msgData.replyTo = replyTo;
    }
    db.ref('messages').push(msgData);
    messageInput.value = '';
    // Optionally clear recipientInput if you want
    // recipientInput.value = '';
    replyTo = null;
    showReplyBanner();
}

// ==== Listen for New Messages ====
let chatroomClearedAt = Number(localStorage.getItem('chatroom_cleared') || 0);
db.ref('messages').limitToLast(50).on('child_added', function(snapshot) {
    const msg = snapshot.val();
    const currentName = nameInput.value.trim() || 'Anonymous';
    // Only show messages sent to me, sent by me, or public (no recipient)
    // Only show messages newer than the last clear
    if (
        msg.timestamp > chatroomClearedAt &&
        (
            !msg.recipient ||
            msg.recipient.toLowerCase() === currentName.toLowerCase() ||
            msg.name.toLowerCase() === currentName.toLowerCase()
        )
    ) {
        addMessage(msg, snapshot.key);
        notifyNewMessage(msg);
    }
});

// Remove message from UI when deleted from DB
db.ref('messages').on('child_removed', function(snapshot) {
    // Re-render all messages with filtering and local clear
    chatWindow.innerHTML = '';
    const currentName = nameInput.value.trim() || 'Anonymous';
    chatroomClearedAt = Number(localStorage.getItem('chatroom_cleared') || 0);
    db.ref('messages').limitToLast(50).once('value', function(snap) {
        snap.forEach(function(child) {
            const msg = child.val();
            if (
                msg.timestamp > chatroomClearedAt &&
                (
                    !msg.recipient ||
                    msg.recipient.toLowerCase() === currentName.toLowerCase() ||
                    msg.name.toLowerCase() === currentName.toLowerCase()
                )
            ) {
                addMessage(msg, child.key);
            }
        });
    });
});

function notifyNewMessage(msg) {
    // Only notify if the message is not from the current user
    const currentName = nameInput.value.trim() || 'Anonymous';
    if (msg.name === currentName) return;
    if ("Notification" in window && Notification.permission === "granted") {
        const body = msg.text.length > 80 ? msg.text.slice(0, 80) + '…' : msg.text;
        new Notification(`New message from ${msg.name}`, {
            body: body,
            icon: "https://www.gstatic.com/firebasejs/9.23.0/firebase-logo.png"
        });
    }
}

let replyTo = null;

function addMessage(msg, key) {
    const div = document.createElement('div');
    let isPrivate = !!msg.recipient;
    div.className = 'message' + (isPrivate ? ' private-message' : '');
    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let replyHtml = '';
    if (msg.replyTo) {
        replyHtml = `<div class="reply-context"><span class="reply-sender">${escapeHTML(msg.replyTo.name)}</span>: <span class="reply-text">${escapeHTML(msg.replyTo.text)}</span></div>`;
    }
    let privateLabel = '';
    if (isPrivate) {
        privateLabel = `<div class="private-label">Private from <b>${escapeHTML(msg.name)}</b></div>`;
    }
    let recipientHtml = '';
    if (msg.recipient) {
        recipientHtml = `<span class="recipient">To: ${escapeHTML(msg.recipient)}</span><br>`;
    }
    let deleteBtnHtml = '';
    const currentName = nameInput.value.trim() || 'Anonymous';
    if (msg.name === currentName) {
        deleteBtnHtml = `<button class="delete-btn">Delete</button>`;
    }
    // Avatar logic: try to get photoURL from msg.photoURL, fallback to default
    let avatarHtml = '';
    if (msg.photoURL) {
        avatarHtml = `<img class="message-avatar" src="${msg.photoURL}" alt="avatar" />`;
    } else {
        avatarHtml = `<img class="message-avatar" src="https://ui-avatars.com/api/?name=${encodeURIComponent(msg.name)}&background=4f8cff&color=fff&rounded=true&size=64" alt="avatar" />`;
    }
    div.innerHTML = `
        ${privateLabel}
        ${replyHtml}
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
            ${avatarHtml}
            <span class="sender">${escapeHTML(msg.name)}</span> <span class="timestamp">${time}</span>
        </div>
        ${recipientHtml}${escapeHTML(msg.text)}
        <div class="message-action-row">
            <button class="reply-btn">Reply</button>
            ${deleteBtnHtml}
        </div>
    `;
    const replyBtn = div.querySelector('.reply-btn');
    replyBtn.onclick = function() {
        replyTo = { name: msg.name, text: msg.text };
        messageInput.focus();
        showReplyBanner();
    };
    if (msg.name === currentName) {
        const deleteBtn = div.querySelector('.delete-btn');
        deleteBtn.onclick = function() {
            if (confirm('Delete this message for everyone?')) {
                db.ref('messages').child(key).remove();
            }
        };
    }
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showReplyBanner() {
    let banner = document.getElementById('reply-banner');
    if (!replyTo) {
        if (banner) banner.remove();
        return;
    }
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'reply-banner';
        banner.className = 'reply-banner';
        messageInput.parentNode.insertBefore(banner, messageInput);
    }
    banner.innerHTML = `Replying to <b>${escapeHTML(replyTo.name)}</b>: ${escapeHTML(replyTo.text)} <button id="cancel-reply">Cancel</button>`;
    document.getElementById('cancel-reply').onclick = function() {
        replyTo = null;
        showReplyBanner();
    };
}

function escapeHTML(str) {
    return str.replace(/[&<>"]/g, function(tag) {
        const chars = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;'
        };
        return chars[tag] || tag;
    });
}
