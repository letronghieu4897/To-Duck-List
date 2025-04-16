# To-Duck List Chrome Extension

To-Duck List is a fun and efficient task management Chrome extension, themed around adorable rubber ducks. The extension helps users organize their daily tasks while bringing a smile to their face with its playful duck theme.

## Features

- **Simple Task Management**: Add, check off, and remove tasks easily.
- **Persistent Storage**: Your tasks are saved locally in your browser.
- **Duck Theme**: Enjoy the cheerful duck-themed interface.
- **Deadline Functionality**: Set and track task deadlines with intuitive color-coding:
  - **Red**: Urgent tasks (overdue or less than 1 day remaining)
  - **Orange**: Warning tasks (2-7 days remaining)
  - **Blue**: Normal tasks (more than 7 days remaining)
  - **Green**: Tasks with no deadline
- **Time Remaining Indicators**: Visual badges show hours left for same-day deadlines and days left for future deadlines
- **Priority Sorting**: Tasks are automatically sorted by deadline proximity
- ✨ Clean, modern interface
- 📝 Create and manage tasks with titles and descriptions
- 📅 Set deadlines for tasks with visual countdown indicators
- 🎨 Color-coded tasks based on deadline urgency
- ⏰ Shows hours remaining for same-day deadlines
- ✅ Mark tasks as complete with visual feedback
- 🗑️ Delete tasks you no longer need
- 🔄 Tasks persist between browser sessions
- 🎯 Tasks automatically sorted by deadline proximity
- 🖱️ Drag and drop to reorder tasks
- 🔒 Privacy-focused: all data stays local on your device
- **Task deadline management with color coding**
- **Priority visualization based on deadline proximity**
- **Time remaining indicators for better deadline awareness**

## Installation
The extension can be installed directly from the Chrome Web Store.

## Development

### Prerequisites
- Google Chrome browser
- Basic knowledge of HTML, CSS, and JavaScript

### Local Development
1. Make your changes to the source files
2. Reload the extension in Chrome:
   - Go to `chrome://extensions/`
   - Find To-Duck-List
   - Click the refresh icon

### Project Structure
```
To-Duck-List/
├── manifest.json       # Extension configuration
├── popup.html          # Main extension popup
├── privacy-policy.html # Privacy policy document
├── js/
│   ├── app.js          # Main application logic
├── css/
│   └── style.css       # Styling
├── icons/              # Extension icons
```

## Usage

1. Click the To-Duck-List icon in your Chrome toolbar
2. Add a new task:
   - Click the "+" button
   - Enter task title and description
   - Set a deadline (optional)
   - Click Save

3. Manage tasks:
   - Click the checkbox to mark a task as complete
   - Click the trash icon to delete a task
   - Drag tasks to reorder them
   - Completed tasks show with strikethrough and different styling

4. Deadline Color-Coding:
   - 🔴 **Red**: Overdue tasks or due within 1 day
   - 🟠 **Orange**: Tasks due within 2-7 days
   - 🔵 **Blue**: Tasks due after 7 days
   - 🟢 **Green**: Tasks with no deadline
   - ⚪ **Gray**: Completed tasks

5. **Set deadlines for tasks using the date picker**
6. **Tasks are automatically sorted and color-coded by deadline proximity:**
   - **Red: Overdue or due within 24 hours**
   - **Orange: Due in 2-7 days**
   - **Blue: Due in more than 7 days**
   - **Green: No deadline set**
   - **Tasks with same-day deadlines show hours remaining**

## Storage

Tasks are stored in Chrome's local storage, ensuring your tasks persist between browser sessions. No data is sent to external servers.

## Privacy

To-Duck List prioritizes your privacy:
- All task data is stored locally on your device
- No personal information is collected
- No data is transmitted to external servers
- No analytics or tracking

For more details, see our [Privacy Policy](privacy-policy.html).

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Icons provided by [Material Icons](https://material.io/icons/)
- Color scheme inspired by modern design principles 
