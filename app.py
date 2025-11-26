from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS # Needed for cross-origin requests
import os
import time

# --- Configuration ---
app = Flask(__name__)
# Enable CORS for all origins (crucial for development)
CORS(app) 
# Configure SQLite database (stored in the instance folder)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mindfulme.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# --- Database Model (Journal Entry) ---
class JournalEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.String(50), nullable=False)
    content = db.Column(db.Text, nullable=False)

# --- Database Initialization ---
with app.app_context():
    # This ensures the database file and tables are created if they don't exist
    if not os.path.exists('instance/mindfulme.db'):
        db.create_all()
        print("Database initialized and tables created.")


# ===============================================
# --- 1. JOURNAL API ENDPOINTS ---
# ===============================================

@app.route('/api/journal', methods=['POST'])
def add_journal_entry():
    """Adds a new journal entry."""
    data = request.get_json()

    if not data or 'content' not in data:
        return jsonify({'error': 'Missing journal content'}), 400

    new_entry = JournalEntry(
        timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
        content=data['content']
    )

    try:
        db.session.add(new_entry)
        db.session.commit()
        return jsonify({'message': 'Entry saved successfully!', 'date': new_entry.timestamp}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to save entry: {str(e)}'}), 500


@app.route('/api/journal', methods=['GET'])
def get_all_entries():
    """Retrieves all journal entries (newest first)."""
    entries = JournalEntry.query.order_by(JournalEntry.id.desc()).all()
    
    entries_list = [{
        'id': entry.id,
        'date': entry.timestamp,
        'content': entry.content
    } for entry in entries]

    return jsonify(entries_list), 200


# ===============================================
# --- 2. CHATBOT API ENDPOINT ---
# ===============================================

def get_zenbot_response(user_input):
    """Simulated simple chatbot logic."""
    input_text = user_input.lower()
    
    if "hello" in input_text or "hi" in input_text:
        return "Hello! I'm ZenBot. I'm here to listen. What's on your mind today?"
    elif "stress" in input_text or "anxiety" in input_text:
        return "It sounds like you're feeling overwhelmed. Let's try a quick mindfulness exercise. Focus on the feeling of your feet on the floor.remember you don't have any thoughts in your mind ,feel there is you and only you in your surrounding and in your soul.Always be calm with your mind ,this is my suggestion about your feeling. "
    elif "sad" in input_text or "down" in input_text:
        return "It's okay to feel that way. Be kind to yourself. Is there one small thing you can do for yourself right now?,dont be very sad as Vijay thalapaty said ,'Kill the sadness by your smile and burried with your success. and one more thing ,I think for your downness a small quot is enough for you that is 'its ok ,lets start again' "
    elif "thank" in input_text or "thank you" in input_text or "ok" in input_text:
        return "You're welcome. Remember, your well-being matters. Nobody can uplift you ,Always keep smile,because only your happiness matters!!. "
    else:
        return "Thank you for sharing. Can you tell me more about that thought or feeling?"


@app.route('/api/chatbot', methods=['POST'])
def chatbot_interaction():
    """Receives user message and returns a chatbot response."""
    data = request.get_json()

    if not data or 'message' not in data:
        return jsonify({'error': 'Missing message content'}), 400

    user_message = data['message']
    
    # Simulate thinking delay
    time.sleep(0.5) 
    
    bot_response = get_zenbot_response(user_message)

    return jsonify({'response': bot_response}), 200


# ===============================================
# --- RUN THE SERVER ---
# ===============================================
if __name__ == '__main__':
    # Run the server on port 5000
    app.run(debug=True, port=5000)