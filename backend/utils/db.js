import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Database file paths
const DB_FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  organizers: path.join(DATA_DIR, 'organizers.json'),
  events: path.join(DATA_DIR, 'events.json'),
  venues: path.join(DATA_DIR, 'venues.json'),
  tickets: path.join(DATA_DIR, 'tickets.json'),
  venueRequests: path.join(DATA_DIR, 'venueRequests.json'),
  organizerRequests: path.join(DATA_DIR, 'organizerRequests.json'),
  payments: path.join(DATA_DIR, 'payments.json'),
  feedback: path.join(DATA_DIR, 'feedback.json'),
};

// Initialize database files if they don't exist
function initializeDB() {
  Object.keys(DB_FILES).forEach((key) => {
    if (!fs.existsSync(DB_FILES[key])) {
      fs.writeFileSync(DB_FILES[key], JSON.stringify([], null, 2));
    }
  });
}

// Read data from a database file
export function readDB(fileKey) {
  try {
    const filePath = DB_FILES[fileKey];
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${fileKey}:`, error);
    return [];
  }
}

// Write data to a database file
export function writeDB(fileKey, data) {
  try {
    const filePath = DB_FILES[fileKey];
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${fileKey}:`, error);
    return false;
  }
}

// ID field name mapping
const ID_FIELD_MAP = {
  users: 'userId',
  organizers: 'organizerId',
  events: 'eventId',
  venues: 'venueId',
  tickets: 'ticketId',
  venueRequests: 'requestId',
  organizerRequests: 'requestId',
  payments: 'paymentId',
  feedback: 'feedbackId',
};

// Get next ID for a collection
export function getNextId(fileKey) {
  const data = readDB(fileKey);
  if (data.length === 0) return 1;
  const idField = ID_FIELD_MAP[fileKey] || 'id';
  const maxId = Math.max(...data.map((item) => item[idField] || item.id || 0));
  return maxId + 1;
}

// Initialize database on module load
initializeDB();

