import fs from 'fs';
import path from 'path';
import os from 'os';
import mongoose from 'mongoose';
import { Message, User } from './types.js';

const DB_FILE = path.join(os.tmpdir(), 'chat_db.json');

// Mongoose Schemas & Models
const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sender: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: String, required: true },
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  status: { type: String, enum: ['online', 'offline'], required: true },
  socketId: { type: String },
  lastSeen: { type: String },
});

// Avoid OverwriteModelError in hot reload environments
const MessageModel = (mongoose.models.Message || mongoose.model('Message', messageSchema)) as any;
const UserModel = (mongoose.models.User || mongoose.model('User', userSchema)) as any;

class ServerDb {
  private localData: { messages: Message[]; users: Record<string, User> } = {
    messages: [],
    users: {},
  };
  private useMongo = false;

  constructor() {
    this.init();
  }

  private async init() {
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
      try {
        console.log('[Database] Connecting to MongoDB...');
        await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 5000,
        });
        this.useMongo = true;
        console.log('[Database] Successfully connected to MongoDB database!');

        // Reset socket IDs and status of users to offline on database initialization (startup/reboot)
        await UserModel.updateMany({}, { status: 'offline', $unset: { socketId: 1 } });
      } catch (err) {
        console.error('[Database] MongoDB connection failed. Falling back to local file storage.', err);
        this.useMongo = false;
        this.loadLocal();
      }
    } else {
      console.log('[Database] MONGODB_URI not found. Utilizing local temporary file storage.');
      this.useMongo = false;
      this.loadLocal();
    }
  }

  // --- Local Fallback Methods ---
  private loadLocal() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        let parsed: any;
        try {
          parsed = JSON.parse(fileContent);
        } catch {
          parsed = {};
        }
        
        this.localData = {
          messages: parsed && Array.isArray(parsed.messages) ? parsed.messages : [],
          users: parsed && typeof parsed.users === 'object' && parsed.users !== null ? parsed.users : {},
        };

        if (this.localData.users) {
          for (const username of Object.keys(this.localData.users)) {
            if (this.localData.users[username]) {
              this.localData.users[username].status = 'offline';
              delete this.localData.users[username].socketId;
            }
          }
        }
      } else {
        this.localData = { messages: [], users: {} };
        this.saveLocal();
      }
    } catch (error) {
      console.error('Failed to load local database, initializing empty storage:', error);
      this.localData = { messages: [], users: {} };
    }
  }

  private saveLocal() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.localData, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save local database to disk:', error);
    }
  }

  // --- Public Universal APIs ---

  public async getMessages(): Promise<Message[]> {
    if (this.useMongo) {
      try {
        const docs = await MessageModel.find({}).sort({ timestamp: 1 }).lean();
        return docs.map((doc: any) => ({
          id: doc.id,
          sender: doc.sender,
          text: doc.text,
          timestamp: doc.timestamp,
          status: doc.status as Message['status'],
        }));
      } catch (err) {
        console.error('MongoDB getMessages failed:', err);
        return [];
      }
    } else {
      return this.localData.messages;
    }
  }

  public async addMessage(message: Message): Promise<Message> {
    if (this.useMongo) {
      try {
        const existing = await MessageModel.findOne({ id: message.id });
        if (!existing) {
          const doc = new MessageModel(message);
          await doc.save();
        }
        return message;
      } catch (err) {
        console.error('MongoDB addMessage failed:', err);
        return message;
      }
    } else {
      const exists = this.localData.messages.some((m) => m.id === message.id);
      if (!exists) {
        this.localData.messages.push(message);
        this.saveLocal();
      }
      return message;
    }
  }

  public async updateMessageStatus(id: string, status: Message['status']): Promise<boolean> {
    if (this.useMongo) {
      try {
        const res = await MessageModel.updateOne({ id }, { status });
        return res.modifiedCount > 0;
      } catch (err) {
        console.error('MongoDB updateMessageStatus failed:', err);
        return false;
      }
    } else {
      const msg = this.localData.messages.find((m) => m.id === id);
      if (msg) {
        msg.status = status;
        this.saveLocal();
        return true;
      }
      return false;
    }
  }

  public async markAllAsRead(exceptSender: string): Promise<string[]> {
    if (this.useMongo) {
      try {
        const unreadDocs = await MessageModel.find({
          sender: { $ne: exceptSender },
          status: { $ne: 'read' },
        });
        const updatedIds = unreadDocs.map((doc) => doc.id);
        if (updatedIds.length > 0) {
          await MessageModel.updateMany(
            { id: { $in: updatedIds } },
            { status: 'read' }
          );
        }
        return updatedIds;
      } catch (err) {
        console.error('MongoDB markAllAsRead failed:', err);
        return [];
      }
    } else {
      const updatedIds: string[] = [];
      this.localData.messages.forEach((msg) => {
        if (msg.sender !== exceptSender && msg.status !== 'read') {
          msg.status = 'read';
          updatedIds.push(msg.id);
        }
      });
      if (updatedIds.length > 0) {
        this.saveLocal();
      }
      return updatedIds;
    }
  }

  public async getUsers(): Promise<User[]> {
    if (this.useMongo) {
      try {
        const docs = await UserModel.find({}).lean();
        return docs.map((doc: any) => ({
          username: doc.username,
          status: doc.status as User['status'],
          socketId: doc.socketId,
          lastSeen: doc.lastSeen,
        }));
      } catch (err) {
        console.error('MongoDB getUsers failed:', err);
        return [];
      }
    } else {
      return Object.values(this.localData.users);
    }
  }

  public async setUserStatus(
    username: string,
    status: 'online' | 'offline',
    socketId?: string
  ): Promise<User> {
    if (!username || username.trim() === '') {
      throw new Error('Username cannot be empty');
    }

    const formattedUsername = username.trim();
    const lastSeen = new Date().toISOString();

    if (this.useMongo) {
      try {
        const updateData: any = { status, lastSeen };
        if (socketId) {
          updateData.socketId = socketId;
        } else if (status === 'offline') {
          updateData.$unset = { socketId: '' };
        }

        const doc = await UserModel.findOneAndUpdate(
          { username: formattedUsername },
          updateData,
          { upsert: true, new: true }
        ).lean();

        return {
          username: doc.username,
          status: doc.status as User['status'],
          socketId: doc.socketId,
          lastSeen: doc.lastSeen,
        };
      } catch (err) {
        console.error('MongoDB setUserStatus failed:', err);
        return { username: formattedUsername, status, socketId, lastSeen };
      }
    } else {
      if (!this.localData.users[formattedUsername]) {
        this.localData.users[formattedUsername] = {
          username: formattedUsername,
          status,
          socketId,
          lastSeen,
        };
      } else {
        this.localData.users[formattedUsername].status = status;
        if (socketId) {
          this.localData.users[formattedUsername].socketId = socketId;
        } else if (status === 'offline') {
          delete this.localData.users[formattedUsername].socketId;
        }
        this.localData.users[formattedUsername].lastSeen = lastSeen;
      }
      this.saveLocal();
      return this.localData.users[formattedUsername];
    }
  }

  public async getUserBySocketId(socketId: string): Promise<User | undefined> {
    if (this.useMongo) {
      try {
        const doc = await UserModel.findOne({ socketId }).lean();
        if (!doc) return undefined;
        return {
          username: doc.username,
          status: doc.status as User['status'],
          socketId: doc.socketId,
          lastSeen: doc.lastSeen,
        };
      } catch (err) {
        console.error('MongoDB getUserBySocketId failed:', err);
        return undefined;
      }
    } else {
      return Object.values(this.localData.users).find((user) => user.socketId === socketId);
    }
  }
}

export const db = new ServerDb();
