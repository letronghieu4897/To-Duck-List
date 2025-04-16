# To-Duck-List

A modern, minimalist Chrome Extension for task management. Features drag-and-drop organization, persistent storage, and a clean UI. Built with vanilla JavaScript for speed and simplicity. Perfect for users who want their todo list just a click away in their browser.

## Description

To-Duck List is a simple and intuitive Chrome Extension for managing your tasks. The extension features a rubber duck as a mascot to make your task management experience more enjoyable.

## Features

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
- **Deadline Management**: Set, view, and track deadlines for your tasks
- **Color-Coded Priority System**: Visual indicators based on deadline proximity
  - Red: Urgent (overdue or less than 1 day remaining)
  - Orange: Warning (2-7 days remaining)
  - Blue: Normal (more than 7 days remaining)
  - Green: No deadline set
- **Time Remaining Indicators**: Shows hours left for same-day deadlines and days left for future deadlines
- **Task Sorting**: Tasks are automatically sorted by deadline proximity

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

5. **Setting Deadlines**: When adding or editing a task, use the date/time picker to set a deadline.
6. **Understanding Task Colors**:
   - Red background: Urgent tasks (overdue or due within 24 hours)
   - Orange background: Warning tasks (due in 2-7 days)
   - Blue background: Normal tasks (due in more than 7 days)
   - Green background: Tasks with no deadline
   - Gray background: Completed tasks

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
