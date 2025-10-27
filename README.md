# Hierarchical To-Do Application

A powerful hierarchical to-do application with unlimited depth and keyboard-driven interface, built with Java Spring Boot and Angular.

## Features

- **Hierarchical Task Structure**: Unlimited depth tree structure for organizing your tasks
- **Keyboard-Driven Interface**: Fast navigation and editing using keyboard shortcuts
- **Material Design UI**: Modern, clean interface using Angular Material
- **Undo Functionality**: Undo the last action with Ctrl+Z
- **In-Memory Database**: Using H2 database for simplicity

## Keyboard Shortcuts

- **Enter**: Create a new sibling node below current
- **Tab**: Indent node (make it a child of previous sibling)
- **Shift+Tab**: Outdent node (move to parent's level)
- **Delete/Backspace**: Delete current node (when empty)
- **Arrow Up/Down**: Navigate between nodes
- **Ctrl+Up/Down**: Move node up/down in list
- **Ctrl+Z**: Undo last action

## Tech Stack

### Backend
- Java 17
- Spring Boot 3.2
- Spring Data JPA
- H2 In-Memory Database
- Maven

### Frontend
- Angular 17+
- TypeScript
- Angular Material
- Standalone Components

## Project Structure

```
.
├── backend/          # Spring Boot backend
│   ├── src/
│   └── pom.xml
├── frontend/        # Angular frontend
│   ├── src/
│   └── angular.json
└── README.md
```

## Getting Started

### Prerequisites

- Java 17 or higher
- Node.js 18+ and npm
- Angular CLI 17+
- Maven 3.6+

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Build and run the Spring Boot application:
```bash
mvn clean install
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

You can also run it as a JAR file:
```bash
mvn clean package
java -jar target/todo-backend-1.0.0.jar
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
ng serve
```

The frontend will be available at `http://localhost:4200`

### Running Both Applications

#### Option 1: Using Startup Scripts (Recommended)

**Terminal 1 - Backend:**
```bash
./start-backend.sh
```

**Terminal 2 - Frontend:**
```bash
./start-frontend.sh
```

#### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
mvn spring-boot:run
```

**Terminal 2 - Frontend:**
```bash
cd frontend
ng serve
```

## API Endpoints

- `GET /api/nodes` - Get all root nodes
- `GET /api/nodes/{id}/children` - Get children of a specific node
- `GET /api/nodes/{id}` - Get a specific node
- `POST /api/nodes` - Create a new node
- `PUT /api/nodes/{id}` - Update a node
- `DELETE /api/nodes/{id}` - Delete a node (cascades to children)
- `PUT /api/nodes/{id}/move` - Move a node (change parent/position)

## Usage

1. Click on any task to edit its content
2. Press Enter to create a new task
3. Use Tab to indent and create subtasks
4. Use Shift+Tab to outdent tasks
5. Press Delete on an empty task to remove it
6. Use keyboard shortcuts for quick navigation
7. Use Ctrl+Z to undo actions

## Development

### Running Tests

Backend tests:
```bash
cd backend
mvn test
```

Frontend tests:
```bash
cd frontend
ng test
```

## License

This project is for educational purposes.
