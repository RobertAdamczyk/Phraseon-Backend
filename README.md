# Phraseon Backend

The Phraseon Backend serves as the nerve center for the Phraseon application, facilitating crucial operations such as authentication, project management, and real-time data synchronization.

## Project Structure

The backend is organized into several key directories, each with a specific role:

- `functions`: Contains the cloud functions and the core logic for the backend.
  - `lib`: Compiled JavaScript code from the TypeScript source.
  - `src`: The TypeScript source code for the cloud functions.
    - `Common`: Utility functions and common components used across different cloud functions.
    - `Domain`: Domain-specific logic, separated into subdirectories like `Keys`, `Project`, and `User`.
    - `Model`: Definitions for the data structures used in the application, such as `language`, `member`, and `project`.
- `node_modules`: Node.js dependencies for the functions.
- `.env`: Environment configuration file (not checked into version control).
- `package.json` & `package-lock.json`: Node.js project manifest and lock file for tracking dependencies.
- `tsconfig.json` & `tsconfig.dev.json`: TypeScript compiler configuration files.

Each subdirectory within `src` is crafted to encapsulate functionality, aligning with the best practices in software architecture for a clean and maintainable codebase.
