const API_BASE_URL = 'http://127.0.0.1:5000'; // Flask server address

// --- Tab Switching Logic ---
function openTab(evt, tabName) {
    // Hide all tab contents
    const tabContent = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContent.length; i++) {
        tabContent[i].style.display = "none";
    }

    // Deactivate all buttons
    const tabButtons = document.getElementsByClassName("tab-button");
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove("active");
    }

    // Show the current tab and activate the button
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.classList.add("active");

    // Load journal entries if switching to the Journal tab
    if (tabName === 'Journal') {
        loadJournalEntries();
    }
}

// --- Journal Logic: Load entries from Backend API ---
async function loadJournalEntries() {
    const entriesList = document.getElementById('past-entries');
    entriesList.innerHTML = ''; // Clear existing list
    entriesList.innerHTML = '<li>Loading entries...</li>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/journal`);
        if (!response.ok) {
             throw new Error(`Server returned status: ${response.status}`);
        }
        
        const entries = await response.json(); // Array of entries

        entriesList.innerHTML = ''; // Clear 'Loading...' message

        if (entries.length === 0) {
            entriesList.innerHTML = '<li>No entries yet. Start writing!</li>';
            return;
        }

        entries.forEach(entry => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<strong>${entry.date}:</strong> ${entry.content.substring(0, 300)}...`;
            entriesList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error loading entries:', error);
        entriesList.innerHTML = '<li>⚠️ Failed to load entries from the server. Check if the backend is running.</li>';
    }
}

// --- Journal Logic: Save entry via Backend API ---
async function saveJournalEntry() {
    const entryTextarea = document.getElementById('journal-entry');
    const entryText = entryTextarea.value.trim();

    if (entryText === "") {
        alert("Please write something before saving!");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/journal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: entryText }) 
        });

        const result = await response.json();

        if (response.ok) {
            alert(`Entry saved on ${result.date.substring(0, 10)}!`);
            entryTextarea.value = '';
            loadJournalEntries(); // Refresh the list
        } else {
            alert(`Error saving entry: ${result.error}`);
        }
    } catch (error) {
        console.error('Network or server error:', error);
        alert('Could not connect to the backend server (Is app.py running on port 5000?).');
    }
}

// --- Chatbot Logic: Helper to add messages ---
function addMessage(text, sender) {
    const chatWindow = document.getElementById('chat-window');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(`${sender}-message`);
    messageDiv.textContent = text;
    chatWindow.appendChild(messageDiv);

    // Auto-scroll to the bottom
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// --- Chatbot Logic: Communicate with Backend API ---
async function sendMessage() {
    const userInputField = document.getElementById('user-input');
    const userText = userInputField.value.trim();

    if (userText === "") return;

    // 1. Display user message immediately
    addMessage(userText, 'user');

    // 2. Clear input field
    userInputField.value = '';

    try {
        const response = await fetch(`${API_BASE_URL}/api/chatbot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: userText })
        });

        const result = await response.json();

        if (response.ok) {
            // 3. Display bot response from the server
            addMessage(result.response, 'bot');
        } else {
            addMessage('Oops! The bot is having trouble connecting to the server.', 'bot');
        }
    } catch (error) {
        console.error('Chatbot API error:', error);
        addMessage('Connection failed. ZenBot is taking a quick break.', 'bot');
    }
}

// Event listener to load entries on page start and enable 'Enter' key for chat
document.addEventListener('DOMContentLoaded', () => {
    // Load entries if the Journal tab is the default one
    loadJournalEntries(); 
    
    // Allow pressing 'Enter' to send a message
    document.getElementById('user-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});