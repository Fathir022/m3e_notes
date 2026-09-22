// State
let notes = [];
try { notes = JSON.parse(localStorage.getItem('notes')) || []; } catch(e) {}
let currentEditId = null;

let animTypingEnabled = true;
try { animTypingEnabled = JSON.parse(localStorage.getItem('animTyping') ?? 'true'); } catch(e) {}
document.getElementById('anim-switch').checked = animTypingEnabled;

let toolbarEnabled = true;
try { toolbarEnabled = JSON.parse(localStorage.getItem('toolbarEnabled') ?? 'true'); } catch(e) {}
document.getElementById('toolbar-switch').checked = toolbarEnabled;
applyToolbarState();

// --- Theme & Palette Logic ---
let currentThemeMode = localStorage.getItem('themeMode') || 'light';
let currentPalette = localStorage.getItem('themePalette') || 'purple';

function initThemeSettings() {
    setThemeMode(currentThemeMode);
    setPalette(currentPalette);
}

function setThemeMode(mode) {
    currentThemeMode = mode;
    localStorage.setItem('themeMode', mode);
    
    // Toggle Button UI
    document.getElementById('btn-mode-light').classList.remove('active');
    document.getElementById('btn-mode-dark').classList.remove('active');
    document.getElementById(`btn-mode-${mode}`).classList.add('active');

    // Apply to HTML element
    if (mode === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
}

function setPalette(paletteName) {
    currentPalette = paletteName;
    localStorage.setItem('themePalette', paletteName);
    
    // Apply to HTML element
    document.documentElement.setAttribute('data-palette', paletteName);
    
    // Update List UI Active State
    document.querySelectorAll('.palette-item').forEach(el => el.classList.remove('active'));
    const activeItem = document.getElementById(`palette-${paletteName}`);
    if(activeItem) activeItem.classList.add('active');
}

// Navigation core
function activateScreen(targetId, targetAnim, currentId, currentAnim) {
    if(currentId) {
        const cur = document.getElementById(currentId);
        cur.className = `screen active ${currentAnim}`;
        setTimeout(() => cur.classList.remove('active', currentAnim), 550);
    }
    const tgt = document.getElementById(targetId);
    tgt.className = `screen active ${targetAnim}`;
}

function navProfile(from) { if(from !== 'screen-3') activateScreen('screen-3', 'slide-in-up', from, 'scale-out-back'); }
function navSettings(from) { if(from !== 'screen-4') activateScreen('screen-4', 'slide-in-right', from, 'slide-out-left'); }
function navHome(from) { if(from !== 'screen-1') activateScreen('screen-1', 'slide-in-right', from, 'slide-out-left'); }

function openAdd() {
    currentEditId = null;
    document.getElementById('note-title').value = '';
    document.getElementById('note-content').innerHTML = '';
    checkToolbarState(); 
    activateScreen('screen-2', 'slide-in-right', 'screen-1', 'slide-out-left');
}
function backFromAdd() { activateScreen('screen-1', 'slide-in-left', 'screen-2', 'slide-out-right'); }
function backFromProfile() { activateScreen('screen-1', 'slide-in-left', 'screen-3', 'slide-out-down'); }
function backFromSettings() { activateScreen('screen-1', 'slide-in-left', 'screen-4', 'slide-out-right'); }

// Notes Data Logic
function saveNote() {
    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').innerHTML;
    
    if (!title && !content.trim() && content === '') { backFromAdd(); return; }
    
    if (currentEditId) {
        const note = notes.find(n => n.id === currentEditId);
        if (note) { note.title = title || 'Untitled'; note.content = content; }
    } else {
        notes.push({ id: Date.now(), title: title || 'Untitled', content: content });
    }
    
    saveToStorage(); renderNotes();
    activateScreen('screen-1', 'slide-in-left', 'screen-2', 'slide-out-right');
}

function deleteNote() {
    if (currentEditId) { notes = notes.filter(n => n.id !== currentEditId); saveToStorage(); renderNotes(); }
    activateScreen('screen-1', 'slide-in-left', 'screen-2', 'slide-out-right');
}

function editNote(id) {
    currentEditId = id;
    const note = notes.find(n => n.id === id);
    const titleInput = document.getElementById('note-title');
    const editor = document.getElementById('note-content');
    
    titleInput.value = note ? (note.title !== 'Untitled' ? note.title : '') : '';
    activateScreen('screen-2', 'slide-in-right', 'screen-1', 'slide-out-left');
    
    if (animTypingEnabled && note) {
        editor.innerHTML = '';
        let rawText = new DOMParser().parseFromString(note.content, 'text/html').body.textContent || '';
        let i = 0;
        function typeChar() {
            if (i < rawText.length) { editor.textContent += rawText.charAt(i); i++; setTimeout(typeChar, 15); } 
            else { editor.innerHTML = note.content; checkToolbarState(); }
        }
        typeChar();
    } else {
        editor.innerHTML = note ? note.content : '';
        setTimeout(checkToolbarState, 50);
    }
}

function renderNotes() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const list = document.getElementById('notes-list');
    list.innerHTML = '';
    
    let filtered = notes.filter(n => {
        let text = new DOMParser().parseFromString(n.content, 'text/html').body.textContent;
        let noteTitle = n.title || 'Untitled';
        return text.toLowerCase().includes(query) || noteTitle.toLowerCase().includes(query);
    });

    if(filtered.length === 0) {
        list.innerHTML = `<div class="empty-state">No notes found. Tap Create to add one!</div>`; return;
    }

    filtered.forEach(note => {
        let temp = new DOMParser().parseFromString(note.content, 'text/html').body.textContent || '';
        let displayTitle = note.title || 'Untitled';
        let item = document.createElement('div');
        item.className = 'list-item ripple';
        item.onclick = () => editNote(note.id);
        item.innerHTML = `
            <div class="list-icon"><span class="material-symbols-rounded">description</span></div>
            <div class="list-text-content">
                <div class="list-headline">${displayTitle}</div>
                <div class="list-supporting">${temp ? temp.substring(0, 60) + '...' : 'No content'}</div>
            </div>
            <span class="material-symbols-rounded" style="color: var(--onSurfaceVariant);">chevron_right</span>
        `;
        list.appendChild(item);
    });
}

function saveToStorage() { try { localStorage.setItem('notes', JSON.stringify(notes)); } catch(e) {} }

// Editor Actions
function execCmd(cmd) { document.execCommand(cmd, false, null); checkToolbarState(); }
function attachFile() { document.getElementById('note-content').innerHTML += ` 📎 `; }
function resetText() { 
    document.getElementById('note-title').value = '';
    document.getElementById('note-content').innerHTML = ''; 
    checkToolbarState();
}

function checkToolbarState() {
    ['bold', 'italic', 'underline'].forEach(cmd => {
        const btn = document.querySelector(`.floating-toolbar .icon-btn[data-cmd="${cmd}"]`);
        if (btn) {
            if (document.queryCommandState(cmd)) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });
}

const editorContent = document.getElementById('note-content');
editorContent.addEventListener('keyup', checkToolbarState);
editorContent.addEventListener('mouseup', checkToolbarState);
editorContent.addEventListener('touchend', checkToolbarState);
editorContent.addEventListener('focus', checkToolbarState);

function toggleAnim() {
    animTypingEnabled = document.getElementById('anim-switch').checked;
    try { localStorage.setItem('animTyping', JSON.stringify(animTypingEnabled)); } catch(e) {}
}

function toggleToolbar() {
    toolbarEnabled = document.getElementById('toolbar-switch').checked;
    try { localStorage.setItem('toolbarEnabled', JSON.stringify(toolbarEnabled)); } catch(e) {}
    applyToolbarState();
}

function applyToolbarState() { document.getElementById('editor-toolbar').style.display = toolbarEnabled ? 'inline-flex' : 'none'; }

// Ripple logic
document.addEventListener('mousedown', function(e) {
    const target = e.target.closest('.ripple');
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const ripple = document.createElement('span');
    const diameter = Math.max(rect.width, rect.height);
    const radius = diameter / 2;
    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${e.clientX - rect.left - radius}px`;
    ripple.style.top = `${e.clientY - rect.top - radius}px`;
    ripple.className = 'ripple-effect';
    target.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
});

// Init
renderNotes();
initThemeSettings(); 

// --- Profile Logic ---
let profileName = localStorage.getItem('profileName') || 'User';
document.getElementById('profile-name-input').value = profileName;

function saveProfileName() {
    let nameInput = document.getElementById('profile-name-input').value.trim();
    if (!nameInput) {
        nameInput = 'User';
        document.getElementById('profile-name-input').value = nameInput;
    }
    localStorage.setItem('profileName', nameInput);
    document.getElementById('profile-img-preview').src = `https://ui-avatars.com/api/?name=${nameInput}&size=400&background=EADDFF&color=21005D`;
}

// Set up UI Avatars initial state
document.getElementById('profile-img-preview').src = `https://ui-avatars.com/api/?name=${profileName}&size=400&background=EADDFF&color=21005D`;