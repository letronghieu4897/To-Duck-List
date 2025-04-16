// Task Model
class TaskModel {
  constructor() {
    this.tasks = [];
    this.archivedTasks = [];
    this.listeners = [];
  }

  async loadTasks() {
    return new Promise(resolve => {
      chrome.storage.sync.get(['tasks', 'archivedTasks', 'firstUse'], result => {
        if (result.tasks && result.tasks.length) {
          // Existing tasks found, use them
          this.tasks = result.tasks;
        } else if (result.firstUse === false) {
          // Not first use, but no tasks (user deleted all)
          this.tasks = [];
        } else {
          // First use of the extension, load defaults and set flag
          this.tasks = this.#getDefaultTasks();
          chrome.storage.sync.set({ firstUse: false });
        }
        
        // Load archived tasks if they exist
        this.archivedTasks = result.archivedTasks || [];
        
        this.sortTasksByCompletion();
        this.#notifyListeners();
        resolve(this.tasks);
      });
    });
  }

  #getDefaultTasks() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    
    return [
        {
          id: 1,
          title: 'Start Work',
          description: 'Begin daily tasks',
          time: '09:30',
          completed: false,
        createdAt: now.toISOString(),
        deadline: tomorrow.toISOString(),
          comments: [],
          order: 0
        },
        {
          id: 2,
          title: 'Visit Consumer',
          description: 'Schedule meeting with client',
          time: '14:30',
          completed: false,
        createdAt: now.toISOString(),
        deadline: new Date(now.setHours(now.getHours() - 2)).toISOString(),
          comments: [],
          order: 1
        },
        {
          id: 3,
          title: 'Status Checking',
        description: 'Review project progress (no deadline)',
          time: '16:30',
          completed: false,
        createdAt: now.toISOString(),
          comments: [],
          order: 2
        },
        {
          id: 4,
        title: 'Urgent Meeting',
        description: 'Prepare for urgent meeting (due today)',
        time: '10:30',
          completed: false,
        createdAt: now.toISOString(),
        deadline: new Date(now.setHours(now.getHours() + 3)).toISOString(),
          comments: [],
          order: 3
        },
        {
          id: 5,
          title: 'Morning',
          description: 'Morning routine tasks',
          time: '08:30',
          completed: true,
        createdAt: now.toISOString(),
        completedAt: now.toISOString(),
          comments: [],
          order: 4
        }
      ];
  }

  saveTasks() {
    return new Promise(resolve => {
      chrome.storage.sync.set({ 
        tasks: this.tasks,
        archivedTasks: this.archivedTasks
      }, () => {
        this.#updateBadge();
        resolve();
      });
    });
  }

  #updateBadge() {
    const count = this.tasks.filter(task => !task.completed).length;
    chrome.action.setBadgeText({ text: count > 0 ? count.toString() : "" });
    chrome.action.setBadgeBackgroundColor({ color: '#f4a02c' });
  }

  sortTasksByCompletion() {
    // First sort by order
    this.tasks.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Then separate incomplete and completed
    const incomplete = this.tasks.filter(task => !task.completed);
    const completed = this.tasks.filter(task => task.completed);
    
    // Sort incomplete by deadline
    incomplete.sort((a, b) => {
      if (a.deadline && b.deadline) {
        return new Date(a.deadline) - new Date(b.deadline);
      }
      return a.deadline ? -1 : (b.deadline ? 1 : 0);
    });
    
    // Combine and reassign order
    this.tasks = [...incomplete, ...completed];
    this.tasks.forEach((task, index) => task.order = index);
    
    // Sort archived tasks by archive date (newest first)
    this.archivedTasks.sort((a, b) => {
      return new Date(b.archivedAt || b.createdAt) - new Date(a.archivedAt || a.createdAt);
    });
  }

  addTask(taskData) {
    const newId = this.tasks.length > 0 
      ? Math.max(...this.tasks.map(task => task.id)) + 1 
      : 1;
      
    const newTask = {
      id: newId,
      title: taskData.title,
      description: taskData.description,
      completed: false,
      createdAt: new Date().toISOString(),
      deadline: taskData.deadline,
      order: this.tasks.length,
      comments: []
    };
    
    this.tasks.push(newTask);
    this.sortTasksByCompletion();
    this.#notifyListeners();
    return newTask;
  }

  updateTask(taskId, updates) {
    const taskIndex = this.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return null;
    
    this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updates };
    this.sortTasksByCompletion();
    this.#notifyListeners();
    return this.tasks[taskIndex];
  }

  archiveTask(taskId) {
    const taskIndex = this.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return false;
    
    const task = this.tasks.splice(taskIndex, 1)[0];
    
    // Add archive date and push to archived tasks
    task.archivedAt = new Date().toISOString();
    this.archivedTasks.push(task);
    
    this.sortTasksByCompletion();
    this.#notifyListeners();
    return task;
  }
  
  restoreTask(archivedTaskId) {
    const taskIndex = this.archivedTasks.findIndex(task => task.id === archivedTaskId);
    if (taskIndex === -1) return false;
    
    const task = this.archivedTasks.splice(taskIndex, 1)[0];
    
    // Remove archive date and add back to active tasks
    delete task.archivedAt;
    task.order = this.tasks.length;
    this.tasks.push(task);
    
    this.sortTasksByCompletion();
    this.#notifyListeners();
    return task;
  }
  
  deleteArchivedTask(archivedTaskId) {
    const taskIndex = this.archivedTasks.findIndex(task => task.id === archivedTaskId);
    if (taskIndex === -1) return false;
    
    const deletedTask = this.archivedTasks.splice(taskIndex, 1)[0];
    this.#notifyListeners();
    return deletedTask;
  }

  deleteTask(taskId) {
    const taskIndex = this.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return false;
    
    const deletedTask = this.tasks.splice(taskIndex, 1)[0];
    this.sortTasksByCompletion();
    this.#notifyListeners();
    return deletedTask;
  }

  toggleTaskCompletion(taskId) {
    const task = this.tasks.find(task => task.id === taskId);
    if (!task) return null;
    
    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;
    
    this.sortTasksByCompletion();
    this.#notifyListeners();
    return task;
  }

  swapTaskOrder(taskId1, taskId2) {
    const task1 = this.tasks.find(task => task.id === taskId1);
    const task2 = this.tasks.find(task => task.id === taskId2);
    
    if (!task1 || !task2) return false;
    
    const tempOrder = task1.order;
    task1.order = task2.order;
    task2.order = tempOrder;
    
    this.sortTasksByCompletion();
    this.#notifyListeners();
    return true;
  }

  addChangeListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  #notifyListeners() {
    this.listeners.forEach(listener => listener(this.tasks, this.archivedTasks));
  }
}

// UI Controller
class TaskUIController {
  constructor(taskModel) {
    this.model = taskModel;
    this.draggedItem = null;
    this.draggedId = null;
    
    // Cache DOM elements
    this.elements = {
      taskList: document.getElementById('taskList'),
      addTaskBtn: document.getElementById('addTaskBtn'),
      archiveBtn: document.getElementById('archiveBtn'),
      archiveModal: document.getElementById('archiveModal'),
      archiveList: document.getElementById('archiveList'),
      emptyArchive: document.getElementById('emptyArchive'),
      closeArchiveBtn: document.getElementById('closeArchiveBtn'),
      taskFormModal: document.getElementById('taskFormModal'),
      closeFormBtn: document.getElementById('closeFormBtn'),
      taskForm: document.getElementById('taskForm'),
      formTitle: document.getElementById('formTitle'),
      taskIdInput: document.getElementById('taskId'),
      titleInput: document.getElementById('title'),
      descriptionInput: document.getElementById('description'),
      deadlineInput: document.getElementById('deadline'),
      creationDateContainer: document.getElementById('creationDateContainer'),
      creationDate: document.getElementById('creationDate'),
      completionDateContainer: document.getElementById('completionDateContainer'),
      completionDate: document.getElementById('completionDate'),
      saveTaskBtn: document.getElementById('saveTaskBtn'),
      toast: document.getElementById('toast'),
      toastMessage: document.getElementById('toastMessage'),
      toastIcon: document.getElementById('toastIcon')
    };
    
    // Set up event handling
    this.#setupEventListeners();
    
    // Subscribe to model changes
    this.model.addChangeListener((tasks, archivedTasks) => {
      this.renderTasks(tasks);
      this.renderArchivedTasks(archivedTasks);
    });
  }

  #setupEventListeners() {
    // Task list
    this.elements.taskList.addEventListener('click', this.#handleTaskListClick.bind(this));
    
    // Archive
    this.elements.archiveBtn.addEventListener('click', this.openArchiveModal.bind(this));
    this.elements.closeArchiveBtn.addEventListener('click', this.closeArchiveModal.bind(this));
    this.elements.archiveList.addEventListener('click', this.#handleArchiveListClick.bind(this));
    
    // Task form
    this.elements.addTaskBtn.addEventListener('click', this.openAddTaskModal.bind(this));
    this.elements.closeFormBtn.addEventListener('click', this.closeFormModal.bind(this));
    this.elements.saveTaskBtn.addEventListener('click', this.#handleSaveTask.bind(this));
  }

  #handleTaskListClick(event) {
    // Using event delegation for all task-related clicks
    if (event.target.closest('.task-check')) {
      const taskId = parseInt(event.target.closest('.task-check').dataset.id);
      const task = this.model.toggleTaskCompletion(taskId);
      if (task && task.completed) {
        this.showToast(`Task "${task.title}" completed!`, 'success', 'fa-check-circle');
      }
      this.model.saveTasks();
    } else if (event.target.closest('.delete-btn')) {
      const taskId = parseInt(event.target.closest('.delete-btn').dataset.id);
      
      // Archive the task instead of deleting it
      const task = this.model.archiveTask(taskId);
      if (task) {
        this.showToast(`Task "${task.title}" archived`, 'info', 'fa-archive');
        this.model.saveTasks();
      }
    } else if (event.target.closest('.task-item') && 
              !event.target.closest('.task-check') && 
              !event.target.closest('.delete-btn')) {
      const taskId = parseInt(event.target.closest('.task-item').dataset.id);
      this.openEditTaskModal(taskId);
    }
  }
  
  #handleArchiveListClick(event) {
    const archiveItem = event.target.closest('.archive-item');
    if (!archiveItem) return;
    
    const taskId = parseInt(archiveItem.dataset.id);
    
    if (event.target.closest('.restore-btn')) {
      const task = this.model.restoreTask(taskId);
      if (task) {
        this.showToast(`Task "${task.title}" restored`, 'success', 'fa-undo');
        this.model.saveTasks();
      }
    } else if (event.target.closest('.delete-forever-btn')) {
      if (confirm('Are you sure you want to permanently delete this task?')) {
        const task = this.model.deleteArchivedTask(taskId);
        if (task) {
          this.showToast(`Task "${task.title}" permanently deleted`, 'danger', 'fa-trash-alt');
          this.model.saveTasks();
        }
      }
    }
  }

  openArchiveModal() {
    this.elements.archiveModal.style.display = 'block';
  }
  
  closeArchiveModal() {
    this.elements.archiveModal.style.display = 'none';
  }
  
  renderArchivedTasks(archivedTasks) {
    const { archiveList, emptyArchive } = this.elements;
    
    // Clear the archive list
    archiveList.innerHTML = '';
    
    if (archivedTasks.length === 0) {
      emptyArchive.style.display = 'block';
      return;
    }
    
    // Show the archive tasks
    emptyArchive.style.display = 'none';
    
    archivedTasks.forEach(task => {
      const archiveItem = this.#createArchiveElement(task);
      archiveList.appendChild(archiveItem);
    });
  }
  
  #createArchiveElement(task) {
    const item = document.createElement('li');
    item.className = 'archive-item';
    item.dataset.id = task.id;
    
    const content = document.createElement('div');
    content.className = 'archive-item-content';
    
    const title = document.createElement('div');
    title.className = 'archive-item-title';
    title.textContent = task.title;
    
    const desc = document.createElement('div');
    desc.className = 'archive-item-desc';
    desc.textContent = task.description || 'No description';
    
    const date = document.createElement('div');
    date.className = 'archive-item-date';
    date.innerHTML = `
      <span>Created: ${this.#formatDateShort(new Date(task.createdAt))}</span>
      ${task.archivedAt ? ` • Archived: ${this.#formatDateShort(new Date(task.archivedAt))}` : ''}
    `;
    
    content.appendChild(title);
    content.appendChild(desc);
    content.appendChild(date);
    
    const actions = document.createElement('div');
    actions.className = 'archive-actions';
    
    const restoreBtn = document.createElement('button');
    restoreBtn.className = 'restore-btn';
    restoreBtn.title = 'Restore task';
    restoreBtn.innerHTML = '<i class="fas fa-undo"></i>';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-forever-btn';
    deleteBtn.title = 'Delete permanently';
    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
    
    actions.appendChild(restoreBtn);
    actions.appendChild(deleteBtn);
    
    item.appendChild(content);
    item.appendChild(actions);
    
    return item;
  }

  openAddTaskModal() {
    const { taskForm, taskIdInput, creationDateContainer, completionDateContainer, deadlineInput, taskFormModal } = this.elements;
    
    taskForm.reset();
    taskIdInput.value = '';
    
    creationDateContainer.style.display = 'none';
    completionDateContainer.style.display = 'none';
    
    const datesContainer = document.querySelector('.dates-container');
    datesContainer.classList.remove('single-date');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);
    
    deadlineInput.value = tomorrow.toISOString().slice(0, 16);
    
    taskFormModal.style.display = 'block';
  }

  openEditTaskModal(taskId) {
    const task = this.model.tasks.find(task => task.id === taskId);
    if (!task) return;
    
    const { 
      taskForm, taskIdInput, titleInput, descriptionInput, deadlineInput,
      creationDateContainer, creationDate, completionDateContainer,
      completionDate, taskFormModal
    } = this.elements;
    
    taskForm.reset();
    
    taskIdInput.value = task.id;
    titleInput.value = task.title;
    descriptionInput.value = task.description || '';
    
    if (task.deadline) {
      deadlineInput.value = new Date(task.deadline).toISOString().slice(0, 16);
    } else {
      deadlineInput.value = '';
    }
    
    creationDateContainer.style.display = 'block';
    creationDate.textContent = this.#formatDate(new Date(task.createdAt));
    
    const datesContainer = document.querySelector('.dates-container');
    
    if (task.completed && task.completedAt) {
      completionDateContainer.style.display = 'block';
      completionDate.textContent = this.#formatDate(new Date(task.completedAt));
      datesContainer.classList.remove('single-date');
    } else {
      completionDateContainer.style.display = 'none';
      datesContainer.classList.add('single-date');
    }
    
    taskFormModal.style.display = 'block';
  }

  closeFormModal() {
    this.elements.taskFormModal.style.display = 'none';
  }

  #handleSaveTask(event) {
    event.preventDefault();
    
    const { titleInput, descriptionInput, deadlineInput, taskIdInput } = this.elements;
    
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const deadline = deadlineInput.value ? new Date(deadlineInput.value).toISOString() : null;
    
    if (!title) {
      this.showToast('Please enter a task title', 'danger', 'fa-exclamation-circle');
      return;
    }
    
    const taskId = taskIdInput.value ? parseInt(taskIdInput.value) : null;
    
    if (taskId) {
      // Update existing task
      const updatedTask = this.model.updateTask(taskId, { title, description, deadline });
      if (updatedTask) {
        this.showToast(`Task "${title}" updated`, 'info', 'fa-info-circle');
      }
    } else {
      // Add new task
      const newTask = this.model.addTask({ title, description, deadline });
      this.showToast(`Task "${title}" added`, 'success', 'fa-check-circle');
    }
    
    this.model.saveTasks();
    this.closeFormModal();
  }

  renderTasks(tasks) {
    const taskList = this.elements.taskList;
    
    // Create document fragment for better performance
    const fragment = document.createDocumentFragment();
  
  if (tasks.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <i class="fas fa-clipboard-list"></i>
      <p>No tasks yet</p>
      <p>Click the + button to add a new task</p>
    `;
      fragment.appendChild(emptyState);
    } else {
      const incompleteTasks = tasks.filter(task => !task.completed);
      const completedTasks = tasks.filter(task => task.completed);
      
      // Render incomplete tasks
      this.#renderTaskGroup(incompleteTasks, fragment);
      
      // Add separator if both types exist
      if (incompleteTasks.length > 0 && completedTasks.length > 0) {
    const separator = document.createElement('div');
    separator.className = 'task-separator';
        fragment.appendChild(separator);
      }
      
      // Render completed tasks
      this.#renderTaskGroup(completedTasks, fragment);
    }
    
    // Replace all content at once
    taskList.innerHTML = '';
    taskList.appendChild(fragment);
    
    // Set up drag and drop after adding to DOM
    this.#setupDragAndDrop();
  }

  #renderTaskGroup(tasksArray, fragment) {
  tasksArray.forEach((task, index) => {
      const taskItem = this.#createTaskElement(task, index);
      fragment.appendChild(taskItem);
    });
  }

  #createTaskElement(task, index) {
    // Calculate deadline status
    const deadlineInfo = this.#calculateDeadlineInfo(task);
    
    // Create task item
    const taskItem = document.createElement('li');
    taskItem.className = task.completed ? 'task-item completed' : 
                       `task-item ${deadlineInfo.deadlineClass}`;
    taskItem.dataset.id = task.id;
    taskItem.dataset.index = index;
    taskItem.setAttribute('draggable', 'true');
    
    // Create task components
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    
    const taskCheck = document.createElement('div');
    taskCheck.className = `task-check ${task.completed ? 'completed' : ''}`;
    taskCheck.dataset.id = task.id;
    if (task.completed) {
      taskCheck.innerHTML = '<i class="fas fa-check"></i>';
    }
    
    const taskContent = document.createElement('div');
    taskContent.className = 'task-content';
    
    // Add time remaining indicator directly to task-item if needed, not to task-content
    if (deadlineInfo.timeRemainingElement && !task.completed) {
      taskItem.appendChild(deadlineInfo.timeRemainingElement);
    }
    
    // Add title and description
    const taskTitle = document.createElement('div');
    taskTitle.className = 'task-title';
    taskTitle.textContent = task.title;
    
    const taskDescription = document.createElement('div');
    taskDescription.className = 'task-description';
    taskDescription.textContent = task.description;
    
    // Create dates section
    const taskDates = document.createElement('div');
    taskDates.className = 'task-dates';
    
    // Created date
    const createdDate = document.createElement('div');
    createdDate.className = 'task-date created';
    createdDate.innerHTML = `<i class="far fa-calendar-plus"></i> ${this.#formatDateShort(new Date(task.createdAt))}`;
    taskDates.appendChild(createdDate);
    
    // Completed date (if applicable)
    if (task.completed && task.completedAt) {
      const completedDateEl = document.createElement('div');
      completedDateEl.className = 'task-date completed';
      completedDateEl.innerHTML = `<i class="far fa-calendar-check"></i> ${this.#formatDateShort(new Date(task.completedAt))}`;
      taskDates.appendChild(completedDateEl);
    }
    
    // Deadline (if applicable)
    if (task.deadline) {
      const deadlineDate = new Date(task.deadline);
      const deadlineDateEl = document.createElement('div');
      deadlineDateEl.className = deadlineInfo.isOverdue ? 'task-date deadline overdue' : 'task-date deadline';
      deadlineDateEl.innerHTML = `<i class="far fa-calendar-alt"></i>`;
      taskDates.appendChild(deadlineDateEl);
    }
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.dataset.id = task.id;
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    
    // Assemble components
    taskContent.appendChild(taskTitle);
    taskContent.appendChild(taskDescription);
    taskContent.appendChild(taskDates);
    
    taskItem.appendChild(dragHandle);
    taskItem.appendChild(taskCheck);
    taskItem.appendChild(taskContent);
    taskItem.appendChild(deleteBtn);
    
    return taskItem;
  }

  #calculateDeadlineInfo(task) {
    let isOverdue = false;
    let daysRemaining = null;
    let hoursRemaining = null;
    let deadlineClass = '';
    let timeRemainingElement = null;
    
    if (task.deadline && !task.completed) {
      const deadlineDate = new Date(task.deadline);
      const currentDate = new Date();
      isOverdue = deadlineDate < currentDate;
      
      // Calculate days remaining
      const currentDateDay = new Date(currentDate);
      currentDateDay.setHours(0, 0, 0, 0);
      const deadlineDateDay = new Date(deadlineDate);
      deadlineDateDay.setHours(0, 0, 0, 0);
      
      const timeDiffDays = deadlineDateDay.getTime() - currentDateDay.getTime();
      daysRemaining = Math.ceil(timeDiffDays / (1000 * 3600 * 24));
      
      // Calculate hours remaining for same-day deadlines
      if (daysRemaining <= 0 && !isOverdue) {
        const timeDiffHours = deadlineDate.getTime() - currentDate.getTime();
        hoursRemaining = Math.ceil(timeDiffHours / (1000 * 3600));
      }
      
      // Set deadline class
      if (isOverdue) {
        deadlineClass = 'overdue';
      } else if (daysRemaining <= 1) {
        deadlineClass = 'urgent';
      } else if (daysRemaining <= 7) {
        deadlineClass = 'warning';
      } else {
        deadlineClass = 'normal';
      }
      
      // Create time remaining element
      if (!task.completed) {
        timeRemainingElement = document.createElement('div');
        timeRemainingElement.className = 'time-remaining-indicator';
        
        const deadlineTime = this.#formatDateShort(new Date(task.deadline));
        
        // Handle overdue tasks
        if (daysRemaining < 0) {
            const overdueDays = Math.abs(daysRemaining);
            const overdueText = `${overdueDays} ${overdueDays === 1 ? 'day' : 'days'} overdue`;
            timeRemainingElement.innerHTML = `<span class="overdue">${overdueText}</span><span class="deadline-time">${deadlineTime}</span>`;
        }
        // Handle tasks due today (less than 24 hours remaining)
        else if (daysRemaining === 0) {
            const hoursRemaining = Math.floor((deadlineDate - currentDate) / (1000 * 60 * 60));
            const hoursText = `${hoursRemaining} ${hoursRemaining === 1 ? 'hour' : 'hours'} left`;
            timeRemainingElement.innerHTML = `<span class="hours-remaining ${hoursRemaining <= 3 ? 'urgent' : 'normal'}">${hoursText}</span><span class="deadline-time">${deadlineTime}</span>`;
        }
        // Handle tasks with days remaining
        else {
            const daysText = `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left`;
            const urgencyClass = daysRemaining <= 7 ? 'urgent' : 'normal';
            timeRemainingElement.innerHTML = `<span class="days-remaining ${urgencyClass}">${daysText}</span><span class="deadline-time">${deadlineTime}</span>`;
        }
      }
    } else if (!task.completed) {
      deadlineClass = 'no-deadline';
    }
    
    return {
      isOverdue,
      daysRemaining,
      hoursRemaining,
      deadlineClass,
      timeRemainingElement
    };
  }

  #setupDragAndDrop() {
    const taskItems = document.querySelectorAll('.task-item');
    
    taskItems.forEach(item => {
      item.addEventListener('dragstart', this.#handleDragStart.bind(this));
      item.addEventListener('dragenter', this.#handleDragEnter.bind(this));
      item.addEventListener('dragover', this.#handleDragOver.bind(this));
      item.addEventListener('dragleave', this.#handleDragLeave.bind(this));
      item.addEventListener('drop', this.#handleDrop.bind(this));
      item.addEventListener('dragend', this.#handleDragEnd.bind(this));
    });
  }

  #handleDragStart(e) {
    this.draggedItem = e.currentTarget;
    this.draggedId = parseInt(e.currentTarget.dataset.id);
    
  setTimeout(() => {
      e.currentTarget.classList.add('dragging');
  }, 0);
  
  e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
}

  #handleDragEnter(e) {
  e.preventDefault();
}

  #handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
    const targetItem = e.currentTarget;
    
    if (targetItem && targetItem !== this.draggedItem) {
      targetItem.classList.add('drag-over');
    }
    
    return false;
  }

  #handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
  }

  #handleDrop(e) {
    e.stopPropagation();
    
    const targetItem = e.currentTarget;
    
    if (!targetItem || targetItem === this.draggedItem) {
      return false;
    }
    
    const targetId = parseInt(targetItem.dataset.id);
    
    if (this.draggedId && targetId) {
      this.model.swapTaskOrder(this.draggedId, targetId);
      this.model.saveTasks();
    }
    
    return false;
  }

  #handleDragEnd() {
    const taskItems = document.querySelectorAll('.task-item');
    taskItems.forEach(item => {
      item.classList.remove('dragging', 'drag-over');
    });
    
    this.draggedItem = null;
    this.draggedId = null;
  }

  showToast(message, type = 'success', icon = 'fa-check-circle', duration = 3000) {
    const { toast, toastMessage, toastIcon } = this.elements;
    
    toastMessage.textContent = message;
    toastIcon.className = `fas ${icon}`;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
      toast.className = toast.className.replace('show', '');
    }, duration);
  }

  #formatDateShort(dateObj) {
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month} ${hours}:${minutes}`;
  }

  #formatDate(dateObj) {
    return dateObj.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

// App Initialization
document.addEventListener('DOMContentLoaded', async () => {
  const taskModel = new TaskModel();
  const taskUI = new TaskUIController(taskModel);
  
  await taskModel.loadTasks();
  await taskModel.saveTasks(); // Ensures badge is updated on startup
});