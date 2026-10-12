// In-memory database for demonstration purposes
// This replaces MongoDB for immediate testing without database setup

const bcrypt = require('bcryptjs');

class MemoryDatabase {
  constructor() {
    this.users = [];
    this.tasks = [];
    this.userIdCounter = 1;
    this.taskIdCounter = 1;
  }

  // User operations
  async createUser(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = {
      _id: this.userIdCounter.toString(),
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(user);
    this.userIdCounter++;
    return user;
  }

  async findUserByEmail(email) {
    return this.users.find(u => u.email === email);
  }

  async findUserByUsername(username) {
    return this.users.find(u => u.username === username);
  }

  async findUserById(id) {
    return this.users.find(u => u._id === id);
  }

  async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Task operations
  async createTask(taskData) {
    const task = {
      _id: this.taskIdCounter.toString(),
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status || 'pending',
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate || null,
      user: taskData.user,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tasks.push(task);
    this.taskIdCounter++;
    return task;
  }

  async findTasks(query) {
    let filteredTasks = [...this.tasks];
    
    if (query.user) {
      filteredTasks = filteredTasks.filter(t => t.user === query.user);
    }
    
    if (query.status) {
      filteredTasks = filteredTasks.filter(t => t.status === query.status);
    }
    
    if (query.priority) {
      filteredTasks = filteredTasks.filter(t => t.priority === query.priority);
    }
    
    return filteredTasks;
  }

  async findTaskById(id) {
    return this.tasks.find(t => t._id === id);
  }

  async updateTask(id, updates) {
    const taskIndex = this.tasks.findIndex(t => t._id === id);
    if (taskIndex === -1) return null;
    
    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    return this.tasks[taskIndex];
  }

  async deleteTask(id) {
    const taskIndex = this.tasks.findIndex(t => t._id === id);
    if (taskIndex === -1) return null;
    
    const deleted = this.tasks.splice(taskIndex, 1)[0];
    return deleted;
  }
}

const db = new MemoryDatabase();

module.exports = db;
